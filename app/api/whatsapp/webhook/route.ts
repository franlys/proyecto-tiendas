import { NextRequest, NextResponse } from "next/server";
import { checkOrderAssignmentResponse } from "@/lib/handlers/order-assignment.handler";
import { checkBookingConfirmationResponse } from "@/lib/handlers/booking-confirmation.handler";
import { checkRentalConfirmationResponse } from "@/lib/handlers/rental-confirmation.handler";
import { processWhatsAppOrder } from "@/lib/handlers/whatsapp-order.handler";
import { sendTextMessage } from "@/lib/evolution";
import {
  getConversationContext,
  setConversationContext,
  clearConversationContext,
  detectMessageIntent,
} from "@/lib/services/conversation-context.service";
import { getWhatsAppConfigWithDefaults } from "@/lib/services/whatsapp-config.service";
import { WhatsAppAutoReplyConfig, ShopBasicInfo } from "@/lib/types/whatsapp-config.types";

// App URL for links in messages
// HARDCODED URL: Force production URL to avoid undefined/localhost issues
const APP_URL = "https://linko-app-pied.vercel.app";

/**
 * Webhook para recibir eventos de Evolution API
 *
 * Eventos soportados:
 * - MESSAGES_UPSERT: Nuevos mensajes
 * - MESSAGES_UPDATE: Actualización de estado de mensajes
 * - CONNECTION_UPDATE: Cambios en la conexión
 * - QRCODE_UPDATED: Nuevo QR code disponible
 */

interface WebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      locationMessage?: {
        degreesLatitude: number;
        degreesLongitude: number;
        name?: string;
        address?: string;
      };
    };
    messageTimestamp?: number;
    status?: string;
    state?: string;
  };
}

// Store for tracking recent contacts (in production, use Redis or DB)
const recentContacts = new Map<string, number>();

// Helper to get cooldown in milliseconds from config
// Returns 0 if cooldown is disabled (cooldownMinutes = 0)
const getCooldownMs = (config: WhatsAppAutoReplyConfig) => {
  const minutes = config.cooldownMinutes ?? 60;
  if (minutes === 0) return 0; // No cooldown - always respond
  return minutes * 60 * 1000;
};

// Check if current time is within business hours
function isBusinessHours(config: WhatsAppAutoReplyConfig): boolean {
  if (!config.businessHoursEnabled) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = config.businessHoursStart.split(":").map(Number);
  const [endHour, endMin] = config.businessHoursEnd.split(":").map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  return currentTime >= startTime && currentTime < endTime;
}

// Generate the main menu message based on config
function generateMenuMessage(
  config: WhatsAppAutoReplyConfig,
  shop: ShopBasicInfo | null,
  pushName?: string
): string {
  const greeting = pushName ? ` ${pushName}` : "";
  const shopName = shop?.name || "nuestra tienda";

  // Build options list based on config
  const options: string[] = [];
  if (config.showCatalogOption) {
    options.push(config.catalogOptionText);
  }
  if (config.showBookingOption) {
    options.push(config.bookingOptionText);
  }
  if (config.showQuestionOption) {
    options.push(config.questionOptionText);
  }

  const optionsText = options.length > 0 ? `\n\n${options.join("\n")}` : "";

  // Replace placeholders in welcome message
  const welcomeMsg = config.welcomeMessage
    .replace("{nombre}", pushName || "")
    .replace("{tienda}", shopName);

  return `¡Hola${greeting}! 👋 ${welcomeMsg}${optionsText}`;
}

// Extract phone number from JID
function getPhoneFromJid(jid: string): string {
  return jid.split("@")[0];
}

// Check if message is from a group
function isGroupMessage(jid: string): boolean {
  return jid.includes("@g.us");
}

// Simple GET handler for health check/verification
export async function GET() {
  console.log("[Webhook] Health check (GET request received)");
  return NextResponse.json({ status: "active", message: "Webhook is listening" });
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    console.log("[Webhook TRACE] Raw Payload:", JSON.stringify(payload, null, 2));

    const { event, instance, data } = payload;

    // DEBUG: Force Log EVERYTHING from this instance to Firestore
    // This confirms if Vercel is receiving the webhook at all
    if (instance?.includes("surprise_gifts")) {
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const db = adminDb();
        if (db) {
          await db.collection("webhook_debug_logs").add({
            instance,
            event,
            timestamp: new Date().toISOString(),
            payload: JSON.stringify(payload).substring(0, 5000)
          });
          console.log(`[DEBUG] Logged raw webhook to Firestore for ${instance}`);
        }
      } catch (e) {
        console.error("Debug log failed:", e);
      }
    }

    console.log(`[Webhook] Event: ${event} from instance: ${instance}`);

    // Normalize event name (Evolution API can send both formats)
    const normalizedEvent = event.toUpperCase().replace(/\./g, "_");

    switch (normalizedEvent) {
      case "MESSAGES_UPSERT":
        await handleNewMessage(instance, data);
        break;

      case "CONNECTION_UPDATE":
        console.log(`[${instance}] Connection state: ${data.state}`);
        // Could update DB with connection status here
        break;

      case "QRCODE_UPDATED":
        console.log(`[${instance}] QR Code updated`);
        // Could broadcast to connected admin clients via WebSocket
        break;

      default:
        console.log(`[${instance}] Unhandled event: ${event} (normalized: ${normalizedEvent})`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleNewMessage(instance: string, data: WebhookPayload["data"]) {
  const { key, message, pushName } = data;

  if (!key || !message) {
    console.log(`[${instance}] Ignored: Missing key or message data`);
    return;
  }

  const { formatPhoneForWhatsApp } = await import("@/lib/utils");
  // Ensure we use the strict format (e.g. adding 1 for DR numbers)
  const rawPhone = getPhoneFromJid(key.remoteJid);
  const phone = formatPhoneForWhatsApp(rawPhone);

  const text = message.conversation || message.extendedTextMessage?.text || "";

  // ============================================================
  // DIAGNOSTIC: PING COMMAND
  // Bypasses all checks (including fromMe) to confirm connectivity
  // ============================================================
  if (text.trim().toUpperCase() === "PING") {
    console.log(`[${instance}] PING received from ${pushName || phone}`);

    // LOG TO FIRESTORE: Proof of Life
    try {
      // Handle v2 instance names for shopId extraction
      let shopId = instance.replace("shop_", "");
      if (shopId.endsWith("_v2")) {
        shopId = shopId.slice(0, -3);
      }
      shopId = shopId.replace(/_/g, "-");

      const { adminDb } = await import("@/lib/firebase-admin");
      const db = adminDb();
      if (db) {
        await db.collection("shops").doc(shopId).collection("whatsappConfig").doc("status").set({
          lastPingReceived: new Date().toISOString(),
          lastPingFrom: phone
        }, { merge: true });
        console.log(`[${instance}] Logged PING to Firestore for ${shopId}`);
      }
    } catch (dbError) {
      console.error(`[${instance}] Failed to log PING to DB:`, dbError);
    }

    await sendTextMessage(instance, phone, "🏓 PONG! El webhook está activo y escuchando.");
    return;
  }

  // Ignore own messages
  if (key.fromMe) {
    console.log(`[${instance}] Ignored: Message fromMe`);
    return;
  }

  // Check if it's a location message
  if (message.locationMessage) {
    console.log(`[${instance}] Location message received from ${pushName || phone}`);
    await handleLocationMessage(instance, phone, message.locationMessage, pushName);
    return;
  }

  console.log(`[${instance}] New message from ${pushName || phone}: ${text}`);

  // ============================================================
  // PASO 1: Verificar si es respuesta a asignación de pedido
  // ============================================================
  try {
    const assignmentResponse = await checkOrderAssignmentResponse(instance, phone, text);

    if (assignmentResponse.handled) {
      console.log(`[${instance}] Order assignment response: ${assignmentResponse.action}`);

      // Enviar mensaje de respuesta si existe
      if (assignmentResponse.message) {
        await sendTextMessage(instance, phone, assignmentResponse.message);
      }
      return; // No continuar con auto-reply
    }
  } catch (error) {
    console.error(`[${instance}] Error checking order assignment:`, error);
  }

  // ============================================================
  // PASO 2: Verificar si es respuesta a confirmación de cita
  // ============================================================
  try {
    const bookingResponse = await checkBookingConfirmationResponse(instance, phone, text);

    if (bookingResponse.handled) {
      console.log(`[${instance}] Booking confirmation response: ${bookingResponse.action}`);

      // Enviar mensaje de respuesta si existe
      if (bookingResponse.responseMessage) {
        await sendTextMessage(instance, phone, bookingResponse.responseMessage);
      }
      return; // No continuar con auto-reply
    }
  } catch (error) {
    console.error(`[${instance}] Error checking booking confirmation:`, error);
  }

  // ============================================================
  // PASO 3: Verificar si es respuesta a confirmación de renta
  // ============================================================
  try {
    const rentalResponse = await checkRentalConfirmationResponse(instance, phone, text);

    if (rentalResponse.handled) {
      console.log(`[${instance}] Rental confirmation response: ${rentalResponse.action}`);

      // Enviar mensaje de respuesta si existe
      if (rentalResponse.responseMessage) {
        await sendTextMessage(instance, phone, rentalResponse.responseMessage);
      }
      return; // No continuar con auto-reply
    }
  } catch (error) {
    console.error(`[${instance}] Error checking rental confirmation:`, error);
  }

  // Extraer shopId del nombre de instancia (shop_xxx_v2 -> xxx)
  // Handles both legacy (shop_xxx) and v2 (shop_xxx_v2) formats
  let shopId = instance.replace("shop_", "");

  if (shopId.endsWith("_v2")) {
    shopId = shopId.slice(0, -3); // remove _v2
  }

  shopId = shopId.replace(/_/g, "-");

  // ============================================================
  // PASO 3.5: Gestión de Clientes (Registro y Nombre)
  // ============================================================
  try {
    const { createCustomer, getCustomerByPhone, updateCustomer } = await import("@/lib/services/customer.service");
    const customer = await getCustomerByPhone(shopId, phone);

    if (!customer) {
      // Nuevo cliente - Primer contacto
      console.log(`[${instance}] New customer detected: ${phone}`);

      // Registrar silenciosamente y dejar pasar al flujo normal (mensaje de bienvenida configurado)
      await createCustomer(shopId, {
        phone,
        name: pushName || "Cliente WhatsApp", // Usar nombre de WhatsApp si existe
        registrationState: "completed", // Marcar como completado para no pedir nombre después
        source: "whatsapp"
      });

      // NO retornamos aquí.
      // Dejamos que el código continúe al PASO 5 para enviar el mensaje de bienvenida estándar
      // configurado por el usuario (e.g. "Hola! Bienvenido a [Tienda]...")
    }

    // Si el cliente existía pero estaba pendiente de nombre (caso legacy o si decidimos reactivarlo)
    if (customer && customer.registrationState === "pending_name") {
      // Cliente respondiendo con su nombre
      const name = text.trim();

      if (name.length < 2) {
        await sendTextMessage(instance, phone, "Por favor, escribe un nombre válido.");
        return;
      }

      await updateCustomer(shopId, customer.id, {
        name,
        registrationState: "completed"
      });

      const welcomeBack = `¡Gracias ${name}! Un gusto saludarte.\n\n¿En qué podemos ayudarte el día de hoy?`;
      await sendTextMessage(instance, phone, welcomeBack);
      return;
    }
  } catch (error) {
    console.error(`[${instance}] Error in customer management:`, error);
  }


  // ============================================================
  // PASO 4: Detectar si es un pedido del carrito (Draft -> Pending)
  // Y Lógica de "Bot para el Dueño"
  // ============================================================
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");
    const db = adminDb();

    // ------------------------------------------------------------
    // A. COMANDOS DEL DUEÑO (Owner -> Business Bot)
    // ------------------------------------------------------------
    // Patrón: "Confirmar [ID]" (Case insensitive)
    const confirmMatch = text.match(/^confirmar\s+([a-zA-Z0-9-]+)/i);

    if (confirmMatch && db) {
      const orderId = confirmMatch[1]; // Can be full ID or partial
      console.log(`[${instance}] Owner command 'Confirm' for order: ${orderId}`);

      // Verify if sender is an Owner/Staff
      const notificationPhones = await getAllNotificationPhones(shopId);
      const isStaff = notificationPhones.some(p => p.phone && phone.includes(p.phone.replace(/\D/g, "")));

      if (isStaff) {
        // Search for the order (exact ID or OrderNumber)
        // We'll search by ID first, then orderNumber
        let orderRef = db.collection("shops").doc(shopId).collection("orders").doc(orderId);
        let orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          // Try searching by orderNumber
          const query = await db.collection("shops").doc(shopId).collection("orders")
            .where("orderNumber", "==", orderId)
            .limit(1)
            .get();

          if (!query.empty) {
            orderRef = query.docs[0].ref;
            orderSnap = query.docs[0];
          }
        }

        if (orderSnap.exists) {
          const orderData = orderSnap.data();

          if (orderData?.status === "pending") {
            // Update Status to Confirmed
            await orderRef.update({
              status: "confirmed",
              updatedAt: new Date().toISOString()
            });

            // Reply to Owner
            await sendTextMessage(instance, phone, `✅ Pedido *${orderData.orderNumber}* confirmado correctamente.`);

            // Notify Customer
            if (orderData.customerPhone) {
              await sendTextMessage(instance, orderData.customerPhone, `✅ Tu pedido *${orderData.orderNumber}* ha sido confirmado. Estamos preparándolo.`);
            }

          } else {
            await sendTextMessage(instance, phone, `⚠️ El pedido ${orderData?.orderNumber} ya está en estado: *${orderData?.status}*`);
          }
        } else {
          await sendTextMessage(instance, phone, `❌ No encontré ningún pedido con ID/Número: ${orderId}`);
        }
        return; // Command handled
      }
    }


    // ------------------------------------------------------------
    // B. ACTIVACIÓN DE PEDIDOS (Customer -> Business)
    // ------------------------------------------------------------
    // Matches: 🆔 Pedido: [ID]
    const draftOrderMatch = text.match(/🆔 Pedido: ([a-zA-Z0-9]+)/);

    if (draftOrderMatch) {
      const orderId = draftOrderMatch[1];
      console.log(`[${instance}] Draft order activation attempt for: ${orderId}`);

      if (db) {
        const orderRef = db.collection("shops").doc(shopId).collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (orderSnap.exists) {
          const orderData = orderSnap.data();

          // Only activate if it's a draft
          if (orderData?.status === "draft") {
            const customerNameData = pushName || "Cliente WhatsApp";

            // Activate Order
            await orderRef.update({
              status: "pending", // Activate!
              customerPhone: phone, // Bind phone now
              customerName: customerNameData, // Bind name now
              source: "whatsapp_verified",
              updatedAt: new Date().toISOString()
            });

            console.log(`[${instance}] ✅ Order ${orderId} activated (draft -> pending)`);

            // Create Notification (Server-side)
            await db.collection("shops").doc(shopId).collection("notifications").add({
              type: "new_order",
              title: "Nuevo Pedido WhatsApp",
              message: `Pedido #${orderData.orderNumber} de $${orderData.total}`,
              read: false,
              createdAt: new Date().toISOString(),
              data: {
                orderId: orderId,
                total: orderData.total
              }
            });

            // Send Confirmation to Customer
            const confirmMsg = `✅ *PEDIDO RECIBIDO*\n\nGracias ${customerNameData}, hemos recibido tu pedido *#${orderData.orderNumber}* correctamente.\n\nEn breve lo confirmaremos.`;
            await sendTextMessage(instance, phone, confirmMsg);

            // ------------------------------------------------------------
            // C. NOTIFICAR AL DUEÑO (Business -> Owner)
            // ------------------------------------------------------------
            const notificationPhones = await getAllNotificationPhones(shopId);
            const ownerMsg = `🔔 *NUEVO PEDIDO RECIBIDO*\n\n` +
              `📦 Pedido: *${orderData.orderNumber}*\n` +
              `👤 Cliente: ${customerNameData} (${phone})\n` +
              `💰 Total: $${orderData.total.toLocaleString()}\n\n` +
              `📝 *Items:*\n${orderData.items.map((i: any) => `- ${i.quantity}x ${i.productName}`).join("\n")}\n\n` +
              `👉 Responde: *Confirmar ${orderData.orderNumber}*\n` +
              `para procesarlo automáticamente.`;

            // Broadcast to all staff/owners
            for (const staff of notificationPhones) {
              try {
                await sendTextMessage(instance, staff.phone, ownerMsg);
                console.log(`[${instance}] Forwarded order to staff: ${staff.phone}`);
              } catch (err) {
                console.error(`[${instance}] Failed to notify staff ${staff.phone}`, err);
              }
            }

            return; // Stop processing
          } else if (orderData?.status !== "draft") {
            console.log(`[${instance}] Order ${orderId} already active (status: ${orderData?.status})`);
          }
        }
      }
    }

    // Legacy parser (still useful for text-based orders if any)
    const orderResult = await processWhatsAppOrder(
      instance,
      shopId,
      text,
      phone,
      pushName
    );

    if (orderResult.isOrder) {
      console.log(`[${instance}] Order detected and processed: ${orderResult.orderNumber}`);
      return; // El handler ya envió las confirmaciones
    }
  } catch (error) {
    console.error(`[${instance}] Error processing order:`, error);
  }

  // ============================================================
  // PASO 5: Verificar contexto de conversación
  // ============================================================

  try {
    const context = await getConversationContext(shopId, phone);

    if (context) {
      // ¡El cliente tiene contexto! Vino de un link de producto/servicio
      console.log(`[${instance}] Customer has context: ${context.source}`);
      await handleContextualMessage(instance, phone, text, context, pushName);
      return;
    }
  } catch (error) {
    console.error(`[${instance}] Error checking conversation context:`, error);
  }

  // ============================================================
  // PASO 5: Mensaje genérico (sin contexto previo)
  // ============================================================

  // Load shop config from Firestore
  let config: WhatsAppAutoReplyConfig;
  let shop: ShopBasicInfo | null = null;

  try {
    const configResult = await getWhatsAppConfigWithDefaults(shopId);
    config = configResult.config;
    shop = configResult.shop;
    console.log(`[${instance}] Loaded config for shop ${shopId}, type: ${shop?.businessType || "unknown"}`);
  } catch (error) {
    console.error(`[${instance}] Error loading config, using defaults:`, error);
    // Use retail defaults if config loading fails
    const { getDefaultWhatsAppConfig } = await import("@/lib/types/whatsapp-config.types");
    config = getDefaultWhatsAppConfig("retail");
  }

  if (!config.enabled) {
    console.log(`[${instance}] Auto-reply disabled for shop ${shopId}`);
    return;
  }

  // Check auto-reply cooldown (skip if cooldown is 0 = always respond)
  const lastContact = recentContacts.get(phone);
  const now = Date.now();
  const cooldownMs = getCooldownMs(config);

  if (cooldownMs > 0 && lastContact && now - lastContact < cooldownMs) {
    console.log(`[${instance}] Skipping auto-reply - cooldown active for ${phone}`);
    return;
  }

  // Check business hours if configured
  if (!isBusinessHours(config)) {
    console.log(`[${instance}] Outside business hours`);
    // Send offline message if configured
    if (config.offlineMessage) {
      try {
        await sendTextMessage(instance, phone, config.offlineMessage);
        recentContacts.set(phone, now);
      } catch (err) {
        console.error(`[${instance}] Failed to send offline message:`, err);
      }
    }
    return;
  }

  // Detectar intención del mensaje
  const { intent, confidence } = detectMessageIntent(text);
  console.log(`[${instance}] Detected intent: ${intent} (confidence: ${confidence})`);

  // Generar respuesta según la intención detectada
  let responseMessage: string;

  if (intent === "catalog") {
    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Aquí puedes ver nuestro catálogo completo:
🛍️ ${APP_URL}/${shopId}

¿Hay algo específico que te interese?`;

    // Crear contexto de solicitud de catálogo
    await setConversationContext(shopId, phone, "catalog_request", "idle", {
      customerName: pushName,
    });
  } else if (intent === "service" && config.showBookingOption) {
    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Para agendar una cita, visita nuestra página de servicios:
📅 ${APP_URL}/${shopId}/book

O dime qué servicio te interesa y te ayudo a reservar.`;
  } else {
    // Greeting or unknown intent - send menu with configured options
    const options: string[] = [];
    if (config.showCatalogOption) {
      options.push(config.catalogOptionText);
    }
    if (config.showBookingOption) {
      options.push(config.bookingOptionText);
    }
    if (config.showQuestionOption) {
      options.push(config.questionOptionText);
    }

    const optionsText = options.length > 0 ? `\n\n${options.join("\n")}` : "";

    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋 ${config.welcomeMessage}${optionsText}

Visita nuestra tienda:
🛍️ ${APP_URL}/${shopId}`;
  }

  // Send auto-reply
  try {
    await sendTextMessage(instance, phone, responseMessage);

    // Update cooldown
    recentContacts.set(phone, now);

    console.log(`[${instance}] Auto-reply sent to ${phone} (intent: ${intent})`);
  } catch (error) {
    console.error(`[${instance}] Failed to send auto-reply:`, error);
  }
}

/**
 * Maneja mensajes de clientes que tienen contexto previo
 * (vinieron de un link de producto o servicio)
 */
async function handleContextualMessage(
  instance: string,
  phone: string,
  text: string,
  context: Awaited<ReturnType<typeof getConversationContext>>,
  pushName?: string
) {
  if (!context) return;

  const shopId = context.shopId;

  switch (context.source) {
    case "product_inquiry":
      // Cliente preguntando por un producto específico
      const productMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Veo que te interesa: *${context.productName}*

Un momento, nuestro equipo revisará tu consulta y te responderá pronto.

Mientras tanto, puedes ver más detalles aquí:
🛍️ ${APP_URL}/${shopId}/product/${context.productId}`;

      await sendTextMessage(instance, phone, productMessage);

      // Limpiar contexto después de responder
      await clearConversationContext(shopId, phone);
      break;

    case "service_inquiry":
      // Cliente preguntando por un servicio específico
      const serviceMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Veo que te interesa nuestro servicio: *${context.serviceName}*

¿Te gustaría agendar una cita?
📅 Responde *SÍ* para ver horarios disponibles

O visita nuestra página para reservar:
${APP_URL}/${shopId}/book`;

      await sendTextMessage(instance, phone, serviceMessage);
      break;

    case "catalog_request":
      // Ya pidió catálogo, dar seguimiento
      const catalogMessage = `Recuerda que puedes ver todos nuestros productos aquí:
🛍️ ${APP_URL}/${shopId}

¿Hay algo específico que buscas?`;

      await sendTextMessage(instance, phone, catalogMessage);
      break;

    default:
      // Contexto no manejado, respuesta genérica
      console.log(`[${instance}] Unhandled context source: ${context.source}`);
  }
}

/**
 * Maneja mensajes de ubicación de clientes
 * - Busca si hay un pedido activo esperando ubicación
 * - Envía la ubicación al dueño de la tienda
 * - Actualiza el pedido con la ubicación
 */
async function handleLocationMessage(
  instance: string,
  phone: string,
  location: NonNullable<WebhookPayload["data"]["message"]>["locationMessage"],
  pushName?: string
) {
  if (!location) return;

  const { degreesLatitude, degreesLongitude, name, address } = location;
  const shopId = instance.replace("shop_", "").replace(/_/g, "-");

  console.log(`[${instance}] Location received: ${degreesLatitude}, ${degreesLongitude}`);

  // Try to find an active order for this customer
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");

    const db = adminDb();
    if (!db) {
      console.error(`[${instance}] No database connection`);
      return;
    }

    // Find active orders for this customer (dispatched status - waiting for delivery)
    const ordersSnapshot = await db
      .collection("shops")
      .doc(shopId)
      .collection("orders")
      .where("customerPhone", "==", phone)
      .where("status", "in", ["dispatched", "preparing", "confirmed"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let orderNumber = "";

    if (!ordersSnapshot.empty) {
      const orderDoc = ordersSnapshot.docs[0];
      const orderData = orderDoc.data();
      orderNumber = orderData.orderNumber || orderDoc.id;

      // Update order with customer location
      await orderDoc.ref.update({
        customerLocation: {
          latitude: degreesLatitude,
          longitude: degreesLongitude,
          name: name || null,
          address: address || null,
          receivedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      });

      console.log(`[${instance}] Updated order ${orderNumber} with customer location`);
    }

    // Get customer name from database
    let customerName = pushName || "Cliente";
    try {
      const { getCustomerByPhone } = await import("@/lib/services/customer.service");
      const customer = await getCustomerByPhone(shopId, phone);
      if (customer?.name) {
        customerName = customer.name;
      }
    } catch (e) {
      // Ignore error, use pushName or default
    }

    // Generate Google Maps link
    const mapsUrl = `https://www.google.com/maps?q=${degreesLatitude},${degreesLongitude}`;

    // Get all notification phones to forward the location
    const notificationPhones = await getAllNotificationPhones(shopId);

    if (notificationPhones.length > 0) {
      const locationMessage = `📍 *UBICACIÓN RECIBIDA*

👤 *Cliente:* ${customerName}
📱 *Teléfono:* ${phone}
${orderNumber ? `📦 *Pedido:* #${orderNumber}` : ""}
${address ? `📌 *Dirección:* ${address}` : ""}
${name ? `🏷️ *Lugar:* ${name}` : ""}

🗺️ *Ver en Google Maps:*
${mapsUrl}

⏰ ${new Date().toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}`;

      // Send location to all notification phones in parallel
      const notificationPromises = notificationPhones.map(async (staff) => {
        try {
          await sendTextMessage(instance, staff.phone, locationMessage);
          console.log(`[${instance}] Location forwarded to ${staff.name} (${staff.role}): ${staff.phone}`);
          return { success: true, phone: staff.phone };
        } catch (error) {
          console.error(`[${instance}] Failed to forward location to ${staff.phone}:`, error);
          return { success: false, phone: staff.phone, error };
        }
      });

      const results = await Promise.all(notificationPromises);
      const successCount = results.filter((r) => r.success).length;
      console.log(`[${instance}] Location forwarded to ${successCount}/${notificationPhones.length} staff members`);
    } else {
      console.log(`[${instance}] No notification phones configured for shop ${shopId}`);
    }

    // Send confirmation to customer
    const confirmationMessage = orderNumber
      ? `✅ ¡Ubicación recibida!\n\nTu pedido *#${orderNumber}* será entregado en esta ubicación.\n\n¡Gracias por tu compra! 🙏`
      : `✅ ¡Ubicación recibida!\n\nGracias por compartir tu ubicación. Te contactaremos pronto. 🙏`;

    await sendTextMessage(instance, phone, confirmationMessage);
    console.log(`[${instance}] Location confirmation sent to customer ${phone}`);
  } catch (error) {
    console.error(`[${instance}] Error handling location message:`, error);

    // Send fallback message to customer
    try {
      await sendTextMessage(
        instance,
        phone,
        "✅ ¡Ubicación recibida! Gracias por compartirla. Te contactaremos pronto."
      );
    } catch (err) {
      console.error(`[${instance}] Failed to send fallback location confirmation:`, err);
    }
  }
}

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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://linko-app-pied.vercel.app";

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

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    const { event, instance, data } = payload;

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

  if (!key || !message) return;

  // Ignore own messages
  if (key.fromMe) return;

  // Ignore group messages
  if (isGroupMessage(key.remoteJid)) return;

  const phone = getPhoneFromJid(key.remoteJid);
  const text = message.conversation || message.extendedTextMessage?.text || "";

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

  // Extraer shopId del nombre de instancia (shop_xxx -> xxx)
  const shopId = instance.replace("shop_", "").replace(/_/g, "-");

  // ============================================================
  // PASO 3.5: Gestión de Clientes (Registro y Nombre)
  // ============================================================
  try {
    const { createCustomer, getCustomerByPhone, updateCustomer } = await import("@/lib/services/customer.service");
    const customer = await getCustomerByPhone(shopId, phone);

    if (!customer) {
      // Nuevo cliente - Primer contacto
      console.log(`[${instance}] New customer detected: ${phone}`);
      await createCustomer(shopId, {
        phone,
        registrationState: "pending_name",
        source: "whatsapp"
      });

      await sendTextMessage(instance, phone, "¡Hola! 👋 Bienvenido a nuestra tienda.\n\nPara poder atenderte mejor, ¿me podrías decir cuál es tu nombre?");
      return;
    }

    if (customer.registrationState === "pending_name") {
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

    // Si ya está registrado, usamos su nombre REAL en lugar del pushName
    if (customer.name) {
      // Sobreescribir pushName localmente para usar el nombre registrado en los siguientes pasos
      // (aunque pushName es const en el argumento, podemos usar una variable local si fuera necesario, 
      // pero por ahora el flujo siguiente usa pushName directamente. 
      // Lo ideal sería pasar customer.name a las funciones siguientes si es posible)
      // Hack: modificamos el objeto data.pushName si se permite, o simplemente confiamos en que 
      // la lógica de abajo usa 'pushName' que viene del argumento.
      // Como no podemos reasignar el argumento, dejaremos que la lógica de abajo use el pushName de WhatsApp
      // O PODEMOS hacer que generateMenuMessage use customer.name si existe.
    }
  } catch (error) {
    console.error(`[${instance}] Error in customer management:`, error);
  }


  // ============================================================
  // PASO 4: Detectar si es un pedido del carrito
  // ============================================================
  try {
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

// GET endpoint for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");

  if (challenge) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}

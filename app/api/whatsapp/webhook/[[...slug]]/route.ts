import { NextRequest, NextResponse } from "next/server";
import { checkOrderAssignmentResponse } from "@/lib/handlers/order-assignment.handler";
import { checkBookingConfirmationResponse } from "@/lib/handlers/booking-confirmation.handler";
import { checkRentalConfirmationResponse } from "@/lib/handlers/rental-confirmation.handler";
import { processWhatsAppOrder } from "@/lib/handlers/whatsapp-order.handler";
import { sendTextMessage, sendImage } from "@/lib/evolution";
import {
  getConversationContext,
  setConversationContext,
  clearConversationContext,
  detectMessageIntent,
} from "@/lib/services/conversation-context.service";
import { getWhatsAppConfigWithDefaults } from "@/lib/services/whatsapp-config.service";
import { WhatsAppAutoReplyConfig, ShopBasicInfo } from "@/lib/types/whatsapp-config.types";

// App URL for links in messages - use PRODUCTION_URL for customer-facing links
import { PRODUCTION_URL, WEBHOOK_BASE_URL } from "@/lib/constants";

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
      participant?: string; // Add participant
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
  sender?: string; // Real JID (e.g. 18294617939@s.whatsapp.net)
  destination?: string;
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

  // Robust check: Ensure values exist before split
  const startStr = config.businessHoursStart || "09:00";
  const endStr = config.businessHoursEnd || "18:00";

  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

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

// Helper to format Bank Accounts
function formatBankAccounts(shop: ShopBasicInfo): string {
  if (!shop.bankAccounts || shop.bankAccounts.length === 0) return "";

  const accounts = shop.bankAccounts.map(acc =>
    `🏦 *${acc.bankName}*\n   Cuenta: ${acc.accountNumber}\n   Tipo: ${acc.accountType}\n   Titular: ${acc.accountHolder}${acc.identification ? `\n   ID: ${acc.identification}` : ""}${acc.instructions ? `\n   📝 ${acc.instructions}` : ""}`
  ).join("\n\n");

  return `\n\n💳 *DATOS DE PAGO / TRANSFERENCIA*:\n${accounts}\n\n📸 *Por favor envía una foto del comprobante aquí para validar tu pago.*`;
}

// Helper to extract phone OR handle LID (Linked Device ID)
// If it's a LID, we MUST use the participant (real phone JID) if available
const getPhoneFromJid = (key: any, sender?: string) => {
  // 1. If we have the top-level 'sender' from payload, use it! It's the most reliable "Real JID"
  if (sender) {
    return sender.split("@")[0];
  }

  // 2. Fallback to key data
  const jid = key.remoteJid;
  if (jid.includes("@lid") && key.participant) {
    // Return participant JID (which is the phone number JID)
    return key.participant.split("@")[0];
  }
  // Fallback: if no participant, return JID (will fail if LID, but nothing else to do)
  return jid.includes("@lid") ? jid : jid.split("@")[0];
};

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
        await handleNewMessage(instance, data, payload.sender);
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
    return NextResponse.json({
      error: "Internal error",
      details: error instanceof Error ? error.message : String(error),
      env_check: {
        hasEvolutionUrl: !!process.env.EVOLUTION_API_URL,
        hasEvolutionKey: !!process.env.EVOLUTION_API_KEY,
        hasFirebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      }
    }, { status: 200 }); // Return 200 to acknowledge receipt and prevent Evolution from retrying spam
  }
}

async function handleNewMessage(instance: string, data: WebhookPayload["data"], sender?: string) {
  try {
    const { key, message, pushName } = data;
    const { getShopBasicInfo } = await import("@/lib/services/whatsapp-config.service");

    // DEBUG: Log raw key data for diagnosis
    console.log(`[${instance}] 🔍 RAW KEY:`, JSON.stringify({
      remoteJid: key?.remoteJid,
      fromMe: key?.fromMe,
      participant: key?.participant,
      id: key?.id,
      pushName,
      hasMessage: !!message
    }));

    if (!key || !message) {
      console.log(`[${instance}] Ignored: Missing key or message data`);
      return;
    }

    // ============================================================
    // PRE-PROCESS: Resolve Shop SLUG from Instance Name
    // ============================================================
    // The instance name contains the slug (e.g. shop_surprise_gifts_v2 -> surprise-gifts)
    // IMPORTANT: All subcollections (products, orders, services) use the SLUG as the path.
    // We use the slug directly, NOT the UUID.

    let shopSlug = instance.replace("shop_", "");
    // Remove any trailing version like _v2, _v3, _v10
    shopSlug = shopSlug.replace(/_v\d+$/, "");
    shopSlug = shopSlug.replace(/_/g, "-");

    // Use slug for all Firestore subcollections (products, orders, etc.)
    const shopId = shopSlug;

    // Verify shop exists (for logging purposes)
    try {
      const shopInfo = await getShopBasicInfo(shopSlug);

      if (shopInfo) {
        console.log(`[${instance}] ✅ Shop found: ${shopInfo.name} (slug: ${shopSlug})`);
      } else {
        console.warn(`[${instance}] ⚠️ Shop not found for slug: ${shopSlug}. Proceeding with slug as path.`);
      }
    } catch (error) {
      console.error(`[${instance}] ❌ Error verifying shop:`, error);
    }

    const { formatPhoneForWhatsApp } = await import("@/lib/utils");
    // Check strict format
    const rawPhone = getPhoneFromJid(key, sender);

    // Only format if it's NOT a JID (doesn't contain @)
    const phone = (sender || rawPhone).includes("@") ? (sender || rawPhone) : formatPhoneForWhatsApp(rawPhone);

    const text = message.conversation || message.extendedTextMessage?.text || "";

    // ============================================================
    // DIAGNOSTIC: PING COMMAND
    // ============================================================
    if (text.trim().toUpperCase() === "PING") {
      console.log(`[${instance}] PING received from ${pushName || phone}`);

      // LOG TO FIRESTORE: Proof of Life
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const db = adminDb();
        if (db) {
          // Use the RESOLVED shopId here!
          await db.collection("shops").doc(shopId).collection("whatsappConfig").doc("status").set({
            lastPingReceived: new Date().toISOString(),
            lastPingFrom: phone,
            debugShopId: shopId, // Log which ID we used
            conversationId: instance
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

    // 1. Identify Message Type
    const messageContentData = data.message || {};
    const messageType = Object.keys(messageContentData)[0];

    console.log(`[${instance}] 📩 processing ${messageType} from ${phone}`);
    // Check if it's a location message
    if (message.locationMessage) {
      console.log(`[${instance}] Location message received from ${pushName || phone}`);
      // Pass the resolved shopId!
      await handleLocationMessage(instance, shopId, phone, message.locationMessage, pushName);
      return;
    }

    console.log(`[${instance}] New message from ${pushName || phone}: ${text}`);

    // ============================================================
    // PASO 0.4: CHECK IF OWNER IS ADDING PRODUCT (Image handling)
    // ============================================================
    // If it's an image and from an owner with active product creation session, handle it
    if (messageType === "imageMessage") {
      try {
        const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");
        const { handleProductImage, getProductCreationSession } = await import("@/lib/handlers/product-creation.handler");

        const notificationPhones = await getAllNotificationPhones(shopId);
        const isOwnerOrStaff = notificationPhones.some(p => {
          const cleanStored = p.phone?.replace(/\D/g, "") || "";
          return p.phone && phone.includes(cleanStored);
        });

        if (isOwnerOrStaff) {
          const productSession = await getProductCreationSession(shopId, phone);
          if (productSession && productSession.state === "awaiting_photo") {
            // Extract image URL from Evolution API payload
            const imageData = (data.message as any)?.imageMessage;
            const imageUrl = imageData?.url || imageData?.mediaUrl || "";

            if (imageUrl) {
              console.log(`[${instance}] 📦 Owner sending product image`);
              const result = await handleProductImage(instance, shopId, phone, imageUrl);
              if (result.handled) {
                return; // Image handled for product creation
              }
            }
          }
        }
      } catch (err) {
        console.error(`[${instance}] Error checking product image:`, err);
      }
    }

    // ============================================================
    // PASO 0.5: DETECCIÓN DE COMPROBANTES DE PAGO (Imágenes y Texto)
    // ============================================================
    // Keywords that indicate payment was made
    const paymentProofKeywords = [
      // Spanish
      "ya pague", "ya pagué", "pague", "pagué", "pagado", "pago hecho",
      "ya transferi", "ya transferí", "transferi", "transferí", "transferido",
      "ya deposite", "ya deposité", "deposite", "deposité", "depositado",
      "listo el pago", "pago listo", "listo", "hecho", "realizado",
      "aqui el comprobante", "aquí el comprobante", "comprobante", "capture", "captura",
      "ya te solte", "ya te solté", "te solte", "te solté",
      "te acabo de transferir", "te acabo de pagar", "acabo de pagar",
      "foto del pago", "imagen del pago", "ahí va", "ahi va", "ahi ta", "ahí ta",
      "recibo", "voucher", "constancia", "soporte",
      // Confirmation phrases
      "confirmo pago", "confirmo transferencia", "pago confirmado",
      "transferencia realizada", "deposito realizado", "depósito realizado"
    ];

    const textLower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isPaymentProofText = paymentProofKeywords.some(kw => textLower.includes(kw));
    const isImageMessage = messageType === "imageMessage" || messageType === "documentMessage";

    // If it's an image OR text indicating payment proof, forward to owner
    if (isImageMessage || isPaymentProofText) {
      console.log(`[${instance}] 💸 Payment proof detected! Type: ${messageType}, HasKeywords: ${isPaymentProofText}`);

      try {
        const shopInfo = await getShopBasicInfo(shopId);
        const ownerPhone = shopInfo?.ownerNotificationPhone;

        if (ownerPhone) {
          // Build notification message
          let notifyMsg = "";

          if (isImageMessage) {
            notifyMsg = `📸💸 *COMPROBANTE DE PAGO RECIBIDO*\n\n` +
              `👤 Cliente: ${pushName || "Sin nombre"}\n` +
              `📱 Teléfono: ${phone}\n` +
              `${text ? `💬 Mensaje: "${text}"\n` : ""}` +
              `\n⚠️ *Revisa el chat para ver la imagen del comprobante.*\n` +
              `\n⏰ ${new Date().toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}`;
          } else {
            notifyMsg = `💸 *POSIBLE PAGO REPORTADO*\n\n` +
              `👤 Cliente: ${pushName || "Sin nombre"}\n` +
              `📱 Teléfono: ${phone}\n` +
              `💬 Mensaje: "${text}"\n` +
              `\n⏰ ${new Date().toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}`;
          }

          // Send to owner
          await sendTextMessage(instance, ownerPhone, notifyMsg);
          console.log(`[${instance}] ✅ Payment proof forwarded to owner: ${ownerPhone}`);

          // Reply to customer
          const customerReply = isImageMessage
            ? `✅ *¡Comprobante recibido!*\n\nGracias ${pushName || ""}. Hemos notificado al equipo sobre tu pago.\n\nTe confirmaremos en breve. 🙏`
            : `✅ *¡Gracias por confirmar tu pago!*\n\nHemos notificado al equipo. Te confirmaremos en breve. 🙏\n\n📸 Si tienes una foto del comprobante, envíala para agilizar la verificación.`;

          await sendTextMessage(instance, phone, customerReply);
          return; // Stop processing - payment proof handled
        } else {
          console.log(`[${instance}] ⚠️ No owner phone configured for shop ${shopId}`);
        }
      } catch (error) {
        console.error(`[${instance}] Error handling payment proof:`, error);
      }
    }

    // ============================================================
    // PASO 0.9: DETECTAR SOLICITUD DE CITA (Booking Request)
    // ============================================================
    // Pattern: "🆔 Ref: XXXXX" or "quiero agendar una cita"
    const bookingRefMatch = text.match(/🆔\s*Ref:\s*([A-Z0-9]+)/i);
    const isBookingRequest = bookingRefMatch ||
      (text.toLowerCase().includes("quiero agendar una cita") && text.includes("Fecha:"));

    if (isBookingRequest) {
      console.log(`[${instance}] 📅 Booking request detected!`);

      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const { createBookingAdmin } = await import("@/lib/services/booking-admin.service");
        const { getShopBasicInfo } = await import("@/lib/services/whatsapp-config.service");
        const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");
        const db = adminDb();

        if (db) {
          // Extract booking details from message (handle various emoji formats)
          // Remove special characters that might interfere with parsing
          const cleanText = text.replace(/[◆◇●○★☆✦✧♦♢]/g, "").replace(/\*/g, "");

          const dateMatch = cleanText.match(/Fecha:\s*([^\n]+)/i);
          const timeMatch = cleanText.match(/Hora:\s*(\d{1,2}:\d{2})/i);
          const servicesMatch = cleanText.match(/Servicios:\s*([\s\S]*?)(?=Duración|Total|$)/i);
          const durationMatch = cleanText.match(/Duración[^:]*:\s*([^\n]+)/i);
          const totalMatch = cleanText.match(/Total[^:]*:\s*\$?([\d,.\s]+)/i);

          const refCode = bookingRefMatch ? bookingRefMatch[1] : `WA${Date.now().toString().slice(-5)}`;
          const dateStr = dateMatch ? dateMatch[1].trim() : "";
          const timeStr = timeMatch ? timeMatch[1].trim() : "";
          const servicesText = servicesMatch ? servicesMatch[1].trim() : "";
          const durationText = durationMatch ? durationMatch[1].trim() : "";
          const totalText = totalMatch ? totalMatch[1].replace(/,/g, "") : "0";

          // Parse date (e.g., "martes, 24 de febrero" -> "2026-02-24")
          let bookingDate = "";
          const dayNumMatch = dateStr.match(/(\d{1,2})/);
          if (dayNumMatch) {
            const dayNum = parseInt(dayNumMatch[1]);
            const now = new Date();
            const year = now.getFullYear();
            // Determine month from text
            const monthNames: Record<string, number> = {
              "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5,
              "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
            };
            let month = now.getMonth();
            for (const [name, num] of Object.entries(monthNames)) {
              if (dateStr.toLowerCase().includes(name)) {
                month = num;
                break;
              }
            }
            bookingDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
          }

          // Parse duration (e.g., "1h 50min" -> 110)
          let durationMinutes = 60; // default
          const hoursMatch = durationText.match(/(\d+)\s*h/);
          const minsMatch = durationText.match(/(\d+)\s*min/);
          if (hoursMatch || minsMatch) {
            durationMinutes = (hoursMatch ? parseInt(hoursMatch[1]) * 60 : 0) + (minsMatch ? parseInt(minsMatch[1]) : 0);
          }

          // Parse services into array (clean up formatting artifacts)
          const serviceNames = servicesText
            .split(/[-•·\n]/)
            .map(s => s.trim().replace(/^[\*\s]+|[\*\s]+$/g, "")) // Remove asterisks and whitespace
            .filter(s => s.length > 1 && !s.match(/^[◆◇●○★☆✦✧♦♢\*\s]+$/)); // Filter out empty or symbol-only entries

          // Check if booking with this ref already exists (created by web modal)
          const existingBookings = await db.collection("shops").doc(shopId).collection("bookings")
            .where("referenceCode", "==", refCode)
            .limit(1)
            .get();

          if (!existingBookings.empty) {
            console.log(`[${instance}] Booking with ref ${refCode} found - updating with customer info`);
            const existingBooking = existingBookings.docs[0];
            const existingData = existingBooking.data();

            // Update booking with customer phone (was pending from web modal)
            await existingBooking.ref.update({
              customerPhone: phone,
              customerName: pushName || existingData.customerName || "Cliente WhatsApp",
              source: "whatsapp-confirmed",
              updatedAt: new Date().toISOString(),
            });

            // Get formatted date
            const bookingDate = existingData.date;
            const bookingTime = existingData.time;
            const dateObj = new Date(bookingDate + "T12:00:00");
            const formattedDate = dateObj.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });

            // Send confirmation
            await sendTextMessage(instance, phone,
              `✅ *¡CITA CONFIRMADA!*\n\n` +
              `📋 Referencia: *${refCode}*\n` +
              `📅 Fecha: ${formattedDate}\n` +
              `🕐 Hora: ${bookingTime}\n` +
              `💇‍♀️ Servicios: ${existingData.serviceName}\n` +
              `💰 Total: $${existingData.servicePrice?.toLocaleString() || "Por confirmar"}\n\n` +
              `⏳ *Estado: Pendiente de confirmación del negocio*\n\n` +
              `Te enviaremos un recordatorio antes de tu cita. ¡Gracias! 🙏`
            );

            // Notify owner
            const notificationPhones = await getAllNotificationPhones(shopId);

            const ownerMsg = `📅 *CITA CONFIRMADA POR WHATSAPP*\n\n` +
              `📋 Ref: *${refCode}*\n` +
              `👤 Cliente: ${pushName || "Sin nombre"}\n` +
              `📱 Teléfono: ${phone}\n` +
              `📆 Fecha: ${formattedDate}\n` +
              `🕐 Hora: ${bookingTime}\n` +
              `💇‍♀️ Servicios: ${existingData.serviceName}\n` +
              `💰 Total: $${existingData.servicePrice?.toLocaleString()}\n\n` +
              `_El cliente envió su confirmación por WhatsApp._`;

            for (const staff of notificationPhones) {
              try {
                await sendTextMessage(instance, staff.phone, ownerMsg);
              } catch (err) {
                console.error(`[${instance}] Failed to notify ${staff.phone}:`, err);
              }
            }

            return;
          }

          // Create proper booking
          const bookingData = {
            customerName: pushName || "Cliente WhatsApp",
            customerPhone: phone,
            serviceId: "whatsapp-booking",
            serviceName: serviceNames.join(", ") || "Servicios varios",
            serviceDuration: durationMinutes,
            servicePrice: parseFloat(totalText) || 0,
            date: bookingDate || new Date().toISOString().split("T")[0],
            time: timeStr || "09:00",
            notes: `Referencia: ${refCode}\nServicios: ${serviceNames.join(", ")}\nMensaje original enviado por WhatsApp`,
          };

          const newBooking = await createBookingAdmin(shopId, bookingData);
          console.log(`[${instance}] ✅ Booking created: ${newBooking.id} (ref: ${refCode})`);

          // Store reference code in booking for future lookups
          await db.collection("shops").doc(shopId).collection("bookings").doc(newBooking.id).update({
            referenceCode: refCode,
            source: "whatsapp"
          });

          // Create notification for admin
          await db.collection("shops").doc(shopId).collection("notifications").add({
            type: "new_booking",
            title: "Nueva Cita Agendada",
            message: `Cita para ${dateStr} - ${timeStr}`,
            read: false,
            createdAt: new Date().toISOString(),
            data: {
              bookingId: newBooking.id,
              referenceCode: refCode,
              total: parseFloat(totalText) || 0,
              date: bookingDate,
              time: timeStr
            }
          });

          // Format date for confirmation message
          const dateObj = new Date(bookingDate + "T12:00:00");
          const formattedDate = dateObj.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });

          // Send confirmation to customer
          const confirmMsg = `✅ *¡CITA RECIBIDA!*\n\n` +
            `📋 Referencia: *${refCode}*\n` +
            `📅 Fecha: ${formattedDate}\n` +
            `🕐 Hora: ${timeStr}\n` +
            `💇‍♀️ Servicios: ${serviceNames.join(", ") || "Pendiente confirmación"}\n` +
            `💰 Total aprox: $${parseFloat(totalText).toLocaleString() || "Por confirmar"}\n\n` +
            `⏳ *Estado: Pendiente de confirmación*\n\n` +
            `Te enviaremos un mensaje cuando tu cita sea confirmada. ¡Gracias por tu preferencia! 🙏`;

          await sendTextMessage(instance, phone, confirmMsg);

          // Notify owner/staff
          const shopInfo = await getShopBasicInfo(shopId);
          const notificationPhones = await getAllNotificationPhones(shopId);

          const ownerMsg = `📅 *NUEVA CITA RECIBIDA*\n\n` +
            `📋 Ref: *${refCode}*\n` +
            `👤 Cliente: ${pushName || "Sin nombre"}\n` +
            `📱 Teléfono: ${phone}\n` +
            `📆 Fecha: ${formattedDate}\n` +
            `🕐 Hora: ${timeStr}\n` +
            `💇‍♀️ Servicios: ${serviceNames.join(", ")}\n` +
            `💰 Total: $${parseFloat(totalText).toLocaleString()}\n\n` +
            `⏱️ Duración: ${durationText}\n\n` +
            `_Ve al panel de citas para confirmar o reagendar._`;

          for (const staff of notificationPhones) {
            try {
              await sendTextMessage(instance, staff.phone, ownerMsg);
            } catch (err) {
              console.error(`[${instance}] Failed to notify ${staff.phone}:`, err);
            }
          }

          return; // Stop processing - booking handled
        }
      } catch (error) {
        console.error(`[${instance}] Error processing booking request:`, error);
        // Fall through to generic response if booking creation fails
      }
    }

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

    // Shop ID is already resolved at the top of this function!
    // We use the 'shopId' variable which now contains the UUID (or Slug if not found)

    // ============================================================
    // DEBUG COMMANDS (HIDDEN)
    // ============================================================
    const cleanCmd = (text || "").trim();

    if (cleanCmd === "DEBUG_STATUS") {
      console.log(`[${instance}] DEBUG_STATUS requested by ${phone}`);
      const { getWhatsAppConfigWithDefaults } = await import("@/lib/services/whatsapp-config.service");
      const configResult = await getWhatsAppConfigWithDefaults(shopId);
      const cfg = configResult.config;

      const statusMsg = `*DEBUG STATUS* 🛠️\n\n` +
        `Instance: ${instance}\n` +
        `ShopID: ${shopId}\n` +
        `Resolved Slug: ${shopSlug}\n` +
        `Enabled: ${cfg.enabled}\n` +
        `BizHours: ${cfg.businessHoursEnabled}\n` +
        `Cooldown: ${cfg.cooldownMinutes}m\n` +
        `Welcome Len: ${cfg.welcomeMessage?.length || 0}\n` +
        `Server Time: ${new Date().toISOString()}`;

      await sendTextMessage(instance, phone, statusMsg);
      return;
    }

    if (cleanCmd === "TEST_AUTO_REPLY") {
      console.log(`[${instance}] TEST_AUTO_REPLY requested by ${phone}`);
      const { getWhatsAppConfigWithDefaults } = await import("@/lib/services/whatsapp-config.service");
      const configResult = await getWhatsAppConfigWithDefaults(shopId);
      const cfg = configResult.config;

      const reply = cfg.welcomeMessage || "No welcome message set.";
      await sendTextMessage(instance, phone, `*TEST AUTO REPLY:*\n\n${reply}`);
      return;
    }

    if (cleanCmd === "DEBUG_LOGS") {
      console.log(`[${instance}] DEBUG_LOGS requested by ${phone}`);
      try {
        const { adminDb } = await import("@/lib/firebase-admin");
        const db = adminDb();
        if (db) {
          const logsSnap = await db.collection("shops").doc(shopId).collection("request_logs")
            .orderBy("timestamp", "desc")
            .limit(5)
            .get();

          const lines = logsSnap.docs.map(d => {
            const dat = d.data();
            const t = dat.timestamp?.toDate ? dat.timestamp.toDate().toLocaleTimeString() : "??";
            // Show participant if exists
            const part = dat.participant ? ` (P: ${dat.participant.split('@')[0]})` : "";
            // Show status/error
            const stat = dat.status === "error" ? ` ❌ ${dat.error}` : (dat.status ? ` ${dat.status}` : "");
            return `[${t}] ${dat.phone}${part}${stat}: ${dat.text.substring(0, 10)}`;
          });

          await sendTextMessage(instance, phone, `*LAST 5 HITS 🕵️:*\n${lines.join("\n")}`);
        }
      } catch (e) {
        await sendTextMessage(instance, phone, `Error reading logs: ${e}`);
      }
      return;
    }



    // ============================================================
    // LOG REQUEST TO FIRESTORE (DIAGNOSTIC)
    // ============================================================
    let logDocRef: any = null; // Defined here for wider scope
    try {
      const { adminDb } = await import("@/lib/firebase-admin");
      const { FieldValue } = await import("firebase-admin/firestore");
      const db = adminDb();
      if (db) {
        // Assign the promise result (DocumentReference) to logDocRef
        logDocRef = await db.collection("shops").doc(shopId).collection("request_logs").add({
          instance,
          phone,
          participant: key?.participant || null, // Log participant
          text: text || "[media]",
          status: "received",
          payload: JSON.stringify(data), // Save FULL payload
          timestamp: FieldValue.serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Log init failed", e);
    }

    // LID CHECK REMOVED: Allowing auto-responses to all LID users
    // System will use LID JID as identifier effectively.

    // ============================================================
    // PASO 3.3: Comandos de Dueño (Prioridad Alta)
    // ============================================================
    try {
      const { handleOwnerCommand } = await import("@/lib/handlers/owner-commands.handler");
      const cmdResult = await handleOwnerCommand(instance, shopId, phone, text);

      if (cmdResult.handled) {
        console.log(`[${instance}] Owner command handled for ${phone}`);
        return;
      }
    } catch (err) {
      console.error(`[${instance}] Error handling owner command:`, err);
    }

    // ============================================================
    // PASO 3.4: IGNORE OWNER MESSAGES (Prevent Loop)
    // ============================================================
    // If it wasn't a command, check if it's the owner saying "Hola" or similar.
    // We don't want to welcome them as a new customer.
    try {
      const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");
      const notificationPhones = await getAllNotificationPhones(shopId);

      const isOwnerOrStaff = notificationPhones.some(p => {
        const cleanStored = p.phone?.replace(/\D/g, "") || "";
        return p.phone && phone.includes(cleanStored);
      });

      if (isOwnerOrStaff) {
        console.log(`[${instance}] 🛑 Ignored: Message from Owner/Staff (${phone}) - preventing auto-reply loop.`);
        return;
      }
    } catch (err) {
      console.error(`[${instance}] Error checking owner status:`, err);
    }

    // ============================================================
    // PASO 3.5: Gestión de Clientes (Registro y Nombre)
    // ============================================================
    try {
      const { createCustomer, getCustomerByPhone, updateCustomer } = await import("@/lib/services/customer.service");
      const customer = await getCustomerByPhone(shopId, phone);

      if (!customer) {
        // Nuevo cliente - Primer contacto
        console.log(`[${instance}] New customer detected: ${phone}`);

        // Timeout wrapper to prevent hanging
        const performCustomerParams = async () => {
          // Registrar silenciosamente y dejar pasar al flujo normal
          await createCustomer(shopId, {
            phone,
            name: pushName || "Cliente WhatsApp",
            registrationState: "completed",
            source: "whatsapp"
          });
          console.log(`[${instance}] Customer created successfully`);
        };

        // Race against 2s timeout
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Customer DB Timeout")), 2000));

        try {
          await Promise.race([performCustomerParams(), timeout]);
        } catch (raceErr) {
          console.error(`[${instance}] Customer creation timed out or failed (proceeding anyway):`, raceErr);
        }

        // NO retornamos aquí.
        // Dejamos que el código continúe al PASO 5 para enviar el mensaje de bienvenida estándar
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

      // ---------------------------------------------------------
      // 4. NLP & DOMINICAN SLANG DETECTION
      // ---------------------------------------------------------

      // GUARD: Skip NLP for order messages - let order processing handle them first
      const isOrderMessage = text.includes("🆔 Pedido:") || text.includes("Pedido:") ||
        text.match(/^confirmar\s+/i) || text.includes("Total:") ||
        text.includes("Productos:") || text.length > 300;

      if (isOrderMessage) {
        console.log(`[NLP] Skipping NLP - detected order message pattern`);
        // Don't return - fall through to order processing below
      } else {
        const { detectIntent } = await import("@/lib/nlp/dominican-slang");
        const detectedIntent = detectIntent(text);

        console.log(`🇩🇴 [NLP] Detected Intent: ${detectedIntent} for message: "${text}"`);

        let responseText = "";

        // Assuming `cfg` (whatsapp config) and `shopInfo` (shop basic info) are available here.
        // If not, they would need to be fetched or passed.
        // For now, using `cfg` for welcomeMessage and assuming `shopInfo` can be fetched.
        // Use existing services to get Shop Info
        const { getWhatsAppConfigWithDefaults, getShopBasicInfo } = await import("@/lib/services/whatsapp-config.service");
        const shopInfo = await getShopBasicInfo(shopId);
        const configResult = await getWhatsAppConfigWithDefaults(shopId);
        const cfg = configResult.config;


        switch (detectedIntent) {
          case "GREETING":
            // GUARD: Don't greet if message is long or looks like an order/forwarded message
            // Use break (not return) so order processing can still run after NLP
            if (text.length > 50 || text.includes("Pedido:") || text.includes("Total:") || text.includes("Productos:") || text.includes("🆔")) {
              console.log("💰 [NLP] Skipping Greeting for potential Order/Long message - will continue to order processing");
              break; // Don't return! Let the order processing code run below
            }

            const bType = shopInfo?.businessType || (shopInfo as any)?.category || "retail";

            // Build professional welcome message
            let welcomeAction = "";
            let businessEmoji = "🏪";

            if (["restaurant", "food", "bar"].includes(bType)) {
              welcomeAction = "Ver menú y hacer pedidos";
              businessEmoji = "🍽️";
            } else if (["service", "beauty", "barbershop", "spa", "salon"].includes(bType)) {
              welcomeAction = "Agendar una cita";
              businessEmoji = "💅";
            } else if (["rental", "car_rental", "real_estate"].includes(bType)) {
              welcomeAction = "Consultar disponibilidad";
              businessEmoji = "🚗";
            } else {
              welcomeAction = "Ver catálogo de productos";
              businessEmoji = "🛍️";
            }

            // Build info lines
            const infoLines: string[] = [];

            // Business hours if configured
            if (cfg?.businessHoursEnabled && cfg.businessHoursStart && cfg.businessHoursEnd) {
              infoLines.push(`🕐 *Horario:* ${cfg.businessHoursStart} - ${cfg.businessHoursEnd}`);
            }

            // Address if available
            if (shopInfo?.contact?.address) {
              infoLines.push(`📍 *Ubicación:* ${shopInfo.contact.address}${shopInfo.contact.city ? `, ${shopInfo.contact.city}` : ""}`);
            }

            // Website
            const websiteUrl = shopInfo?.website || `${PRODUCTION_URL}/${shopInfo?.slug}`;
            infoLines.push(`🌐 *Web:* ${websiteUrl}`);

            const infoSection = infoLines.length > 0 ? `\n\n${infoLines.join("\n")}` : "";

            // Professional welcome caption (used with image or standalone)
            const welcomeCaption = `${businessEmoji} *${shopInfo?.name || "Bienvenido"}*\n` +
              `━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `¡Hola${pushName ? ` ${pushName}` : ""}! 👋\n` +
              `Gracias por contactarnos.${infoSection}\n\n` +
              `*¿Qué deseas hacer?*\n` +
              `✨ ${welcomeAction}\n` +
              `❓ Hacer una pregunta\n` +
              `👤 Hablar con alguien\n\n` +
              `_Escribe *Menú* para ver todas las opciones_`;

            // Send logo image with welcome message if logo exists
            if (shopInfo?.logoUrl) {
              try {
                console.log(`[${instance}] 🖼️ Sending welcome image to ${phone} using URL: ${shopInfo.logoUrl}`);
                await sendImage(instance, phone, shopInfo.logoUrl, welcomeCaption);
                console.log(`[${instance}] ✅ Welcome image sent successfully`);
                return; // Image sent with caption, don't send text
              } catch (imgError) {
                console.error(`[${instance}] ❌ Error sending welcome image:`, imgError);
                // Fall back to text-only message
              }
            } else {
              console.log(`[${instance}] ℹ️ No logoUrl found for shop, using text-only welcome`);
            }

            responseText = welcomeCaption;
            break;

          case "PRICE_INQUIRY":
            responseText = `Para ver los precios, por favor chequea nuestro catálogo aquí: \n${shopInfo?.website || `${PRODUCTION_URL}/${shopInfo?.slug}`}`;
            break;

          case "ADDRESS_INQUIRY":
            if (shopInfo?.contact?.address) {
              responseText = `📍 Estamos ubicados en:\n*${shopInfo.contact.address}*\n${shopInfo.contact.city || ""}\n\n¡Visítanos cuando gustes!`;
              // Optional: Send Location Request to Evolution API if supported
            } else {
              responseText = "Operamos principalmente online 🌐. ¡Hacemos envíos!";
            }
            break;

          case "PAYMENT_PROOF":
            // This overlaps with existing image logic, but handles text-only proofs better
            console.log("💰 [NLP] Payment Proof Text Detected");
            await sendTextMessage(
              instance,
              phone,
              "¡Excelente! 🇩🇴 He notificado al dueño de tu pago. \nSi tienes una foto del comprobante, mándala por aquí para confirmar más rápido."
            );

            // Forward to Owner
            const ownerPhone = shopInfo?.ownerNotificationPhone;
            if (ownerPhone) {
              await sendTextMessage(
                instance,
                ownerPhone,
                `🇩🇴💸 *Posible Pago Reportado* (Texto)\n\nCliente: ${pushName || phone} (${phone})\nDijo: "${text}"`
              );
            }
            return; // Stop further processing to avoid double reply

          case "HUMAN_HANDOVER":
            responseText = "Entendido, ya le avisé a un humano real 👤. \nAlguien del equipo te responderá en breve.";
            const ownerPhoneHandover = shopInfo?.ownerNotificationPhone;
            if (ownerPhoneHandover) {
              await sendTextMessage(
                instance,
                ownerPhoneHandover,
                `🚨 *Cliente Pide Hablar con Humano*\n\nCliente: ${pushName || phone} (${phone})\nDijo: "${text}"`
              );
            }
            break;

          case "CATALOG_INQUIRY":
            // GUARD: Don't send catalog if it's part of an order message
            if (text.includes("Pedido:") || text.includes("Total:") || text.includes("🆔") || text.length > 100) {
              console.log("💰 [NLP] Skipping Catalog for potential Order message");
              break;
            }
            responseText = `Claro, aquí tienes nuestro catálogo: \n${shopInfo?.website || `${PRODUCTION_URL}/${shopInfo?.slug}`}`;
            break;

          case "PAYMENT_POLICY":
            const pType = shopInfo?.businessType || (shopInfo as any)?.category || "retail";

            if (["service", "beauty", "barbershop", "spa", "salon", "rental", "car_rental"].includes(pType)) {
              responseText = `ℹ️ *Política de Reservas:*\n\nPara agendar tu cita o reservar, requerimos el **50% de anticipo / depósito**.\n\nEl resto se paga el día del servicio/entrega. 💳`;
            } else if (["restaurant", "food"].includes(pType)) {
              responseText = `ℹ️ *Política de Pagos:*\n\nAceptamos efectivo o transferencia al momento de confirmar tu pedido o contra entrega. 🍔`;
            } else {
              responseText = `ℹ️ *Métodos de Pago:*\n\naceptamos pagos contra entrega 🛵 o transferencia bancaria al confirmar tu pedido.`;
            }
            break;

          case "BOOKING_STATUS":
            if (!db) {
              console.error("Database connection not available for BOOKING_STATUS");
              responseText = "Sistema no disponible en este momento.";
              break;
            }
            try {
              // Find bookings for this phone number
              // Shop ID matches current shop
              // Status is NOT cancelled
              const bookingsSnap = await db.collection("shops").doc(shopId).collection("bookings")
                .where("customerPhone", "==", phone)
                .where("date", ">=", new Date().toISOString().split("T")[0]) // Future bookings
                .limit(3)
                .get();

              const activeBookings = bookingsSnap.docs
                .map(doc => doc.data())
                .filter(b => b.status !== "cancelled");

              const isRental = ["rental", "car_rental", "real_estate"].includes(shopInfo?.businessType || (shopInfo as any)?.category || "");
              const term = isRental ? "Reserva" : "Cita";
              const termPlural = isRental ? "Reservas" : "Citas";

              if (activeBookings.length > 0) {
                const bookingList = activeBookings.map(b => {
                  const dateObj = new Date(b.date + "T12:00:00"); // Avoid timezone shift
                  const dateStr = dateObj.toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' });
                  return `📅 *${dateStr}* a las *${b.time}*\n   Estado: ${b.status === 'confirmed' ? '✅ Confirmada' : '⏳ Pendiente'}`;
                }).join("\n\n");

                responseText = `🔎 Encontré estas ${termPlural.toLowerCase()} para ti:\n\n${bookingList}`;
              } else {
                responseText = `No encontré ${termPlural.toLowerCase()} próximas agendadas con este número. 🤔\n\nSi crees que es un error, por favor escribe 'Hablar con humano'.`;
              }
            } catch (error) {
              console.error("Error fetching bookings:", error);
              responseText = "Hubo un error consultando tus citas/reservas. Por favor intenta más tarde.";
            }
            break;

          case "PAYMENT_INFO":
            // Customer asking how to pay / bank accounts
            console.log("💳 [NLP] Payment Info Request Detected");
            if (shopInfo?.bankAccounts && shopInfo.bankAccounts.length > 0) {
              responseText = `💳 *¿CÓMO PAGAR?*\n\nPuedes hacer tu pago por transferencia bancaria:${formatBankAccounts(shopInfo)}`;
            } else {
              responseText = `💳 *Métodos de Pago:*\n\nAceptamos:\n• Efectivo al entregar 💵\n• Transferencia bancaria 🏦\n\nPara datos de transferencia, por favor escribe "Hablar con humano" y te atenderemos. 🙋`;
            }
            break;

          case "ORDER_STATUS":
            // Customer asking about their order status
            console.log("📦 [NLP] Order Status Request Detected");
            if (!db) {
              responseText = "Sistema no disponible en este momento.";
              break;
            }
            try {
              // Find recent orders for this phone number
              const ordersSnap = await db.collection("shops").doc(shopId).collection("orders")
                .where("customerPhone", "==", phone)
                .orderBy("createdAt", "desc")
                .limit(3)
                .get();

              if (!ordersSnap.empty) {
                const ordersList = ordersSnap.docs.map(doc => {
                  const o = doc.data();
                  const statusEmoji: Record<string, string> = {
                    draft: "📝",
                    pending: "⏳",
                    confirmed: "✅",
                    preparing: "👨‍🍳",
                    dispatched: "🚚",
                    delivered: "📬",
                    cancelled: "❌"
                  };
                  const statusText: Record<string, string> = {
                    draft: "Borrador",
                    pending: "Pendiente",
                    confirmed: "Confirmado",
                    preparing: "Preparando",
                    dispatched: "En camino",
                    delivered: "Entregado",
                    cancelled: "Cancelado"
                  };
                  return `${statusEmoji[o.status] || "📦"} *#${o.orderNumber}* - ${statusText[o.status] || o.status}\n   Total: $${o.total?.toLocaleString() || "0"}`;
                }).join("\n\n");

                responseText = `📦 *TUS PEDIDOS RECIENTES:*\n\n${ordersList}\n\n¿Necesitas más información sobre alguno? Escríbeme el número del pedido.`;
              } else {
                responseText = `No encontré pedidos asociados a este número. 🤔\n\n¿Hiciste tu pedido con otro número? Escribe "Hablar con humano" para ayudarte.`;
              }
            } catch (error) {
              console.error("Error fetching orders:", error);
              responseText = "Hubo un error consultando tus pedidos. Por favor intenta más tarde.";
            }
            break;

          case "ORDER_MODIFICATION":
            // Customer wants to modify or cancel their order
            console.log("✏️ [NLP] Order Modification Request Detected");
            responseText = `✏️ *MODIFICAR / CANCELAR PEDIDO*\n\nEntiendo que deseas hacer cambios en tu pedido.\n\nPara ayudarte mejor, por favor indica:\n• El número de tu pedido\n• Qué cambio necesitas\n\nUn miembro del equipo te atenderá en breve. 🙋`;

            // Notify owner about modification request
            const ownerPhoneModify = shopInfo?.ownerNotificationPhone;
            if (ownerPhoneModify) {
              await sendTextMessage(
                instance,
                ownerPhoneModify,
                `✏️ *SOLICITUD DE MODIFICACIÓN*\n\nCliente: ${pushName || phone} (${phone})\nMensaje: "${text}"\n\n⚠️ Revisar y responder manualmente.`
              );
            }
            break;

          case "UNKNOWN":
            // Bot doesn't understand - ask clarifying question instead of welcome spam
            console.log("❓ [NLP] Unknown Intent - Asking clarifying question");

            // GUARD: Skip for very short messages (might just be noise)
            if (text.length < 3) {
              break; // Let it fall through to other handlers
            }

            // GUARD: Skip for potential order messages
            if (text.includes("Pedido:") || text.includes("Total:") || text.includes("🆔") || text.length > 200) {
              console.log("❓ [NLP] Skipping UNKNOWN handler for potential order/long message");
              break;
            }

            const businessType = shopInfo?.businessType || (shopInfo as any)?.category || "retail";
            let suggestions = "";

            if (["service", "beauty", "barbershop", "spa", "salon"].includes(businessType)) {
              suggestions = "• Ver *servicios* disponibles\n• *Agendar* una cita\n• Consultar *precios*\n• Ver el estado de mi *cita*";
            } else if (["restaurant", "food", "bar"].includes(businessType)) {
              suggestions = "• Ver el *menú*\n• Hacer un *pedido*\n• Consultar *horarios*\n• Ver el estado de mi *orden*";
            } else if (["rental", "car_rental", "real_estate"].includes(businessType)) {
              suggestions = "• Ver *opciones* disponibles\n• Hacer una *reserva*\n• Consultar *precios*\n• Ver el estado de mi *reserva*";
            } else {
              suggestions = "• Ver *productos* disponibles\n• Consultar *precios*\n• Ver el estado de mi *pedido*\n• Saber *cómo pagar*";
            }

            responseText = `🤔 Hmm, no estoy seguro de entender tu mensaje.\n\n¿En qué te puedo ayudar? Por ejemplo:\n${suggestions}\n\nO escribe *"Hablar con humano"* para atención personalizada. 🙋`;
            break;
        }

        if (responseText) {
          console.log(`[${instance}] ✉️ Sending text response to ${phone}`);
          await sendTextMessage(instance, phone, responseText);
          console.log(`[${instance}] ✅ Text response sent successfully`);
          return;
        }
      } // End of NLP else block

      // ---------------------------------------------------------
      // 5. EXISTING AI / FLOW LOGIC
      // ---------------------------------------------------------

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
              // Use server action to update status AND deduct inventory atomically
              const { updateOrderStatusAction } = await import("@/lib/actions/order-actions");
              const result = await updateOrderStatusAction(shopId, orderSnap.id, "confirmed");

              if (!result.success) {
                console.error(`[${instance}] ❌ Failed to confirm order: ${result.error}`);
                await sendTextMessage(instance, phone, `❌ Error al confirmar el pedido: ${result.error}`);
                return;
              }

              console.log(`[${instance}] ✅ Order ${orderId} confirmed via WhatsApp command (with stock deduction)`);

              // 5. Notify Customer (with Bank Info if avail)
              const shopInfo = await getShopBasicInfo(shopId);
              let replyText = `✅ *PEDIDO #${orderData.orderNumber} CONFIRMADO*\n\nSu pedido está siendo procesado.`;

              if (shopInfo) {
                replyText += formatBankAccounts(shopInfo);
              }

              await sendTextMessage(instance, orderData.customerPhone, replyText);

              // Reply to Owner
              await sendTextMessage(instance, phone, `✅ Pedido *${orderData.orderNumber}* confirmado correctamente.`);


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

              // NOTE: Stock is deducted when order is CONFIRMED, not on activation
              // This is handled by updateOrderStatusAction to prevent double deduction
              console.log(`[${instance}] ℹ️ Stock will be deducted when order is confirmed`);

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
              // D. PAYMENT PROOF HANDLING (Customer -> Owner)
              // ------------------------------------------------------------
              const paymentKeywords = ["pago", "transferencia", "comprobante", "ya pagué", "listo", "pagado"];
              const isPaymentMsg = paymentKeywords.some(kw => text.toLowerCase().includes(kw));

              // Forward if it's an image OR text with keywords
              if (messageType === "imageMessage" || (messageType === "conversation" && isPaymentMsg) || (messageType === "extendedTextMessage" && isPaymentMsg)) {

                // Get Owner Phone
                const shopInfo = await getShopBasicInfo(shopId);
                const ownerPhone = shopInfo?.ownerNotificationPhone;

                if (ownerPhone) {
                  console.log(`[${instance}] 📸 Payment proof detected. Forwarding to owner: ${ownerPhone}`);

                  const caption = `📩 *COMPROBANTE/MENSAJE DE PAGO*\n\nDe: ${pushName || phone}\nTel: ${phone}\n\n${text ? `"${text}"` : ""}`;

                  // IF IMAGE
                  if (messageType === "imageMessage") {
                    // We need the media content. Evolution API webhook provides mediaUrl if we configure it, or we might need to download.
                    // For now, let's assume Evolution sends `data.message.imageMessage` with `url` or we use `sendImageMessage` if we had the URL. 
                    // BUT webhook usually gives base64 or url.

                    // Complex: Evolution webhook structure for media.
                    // If we can't easily forward the image without downloading, let's just notify the owner:
                    // "El cliente envió una imagen. Por favor revisa el chat."

                    await sendTextMessage(instance, ownerPhone, `📸 *FOTO RECIBIDA - POSIBLE PAGO*\n\nCliente: ${pushName} (${phone})\n\n⚠️ El bot no puede reenviar la imagen aún. Por favor revisa el chat con el cliente.`);
                  } else {
                    // TEXT
                    await sendTextMessage(instance, ownerPhone, caption);
                  }
                }
              }
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

    // GUARD: Don't send auto-reply for order messages
    if (text.includes("Pedido:") || text.includes("Total:") || text.includes("Productos:") || text.includes("🆔")) {
      console.log(`[${instance}] Skipping auto-reply - detected order message pattern`);
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
🛍️ ${shop?.website || `${WEBHOOK_BASE_URL}/${shopId}`}

¿Hay algo específico que te interese?`;

      // Crear contexto de solicitud de catálogo
      await setConversationContext(shopId, phone, "catalog_request", "idle", {
        customerName: pushName,
      });
    } else if (intent === "service" && config.showBookingOption) {
      responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Para agendar una cita, visita nuestra página de servicios:
📅 ${shop?.website ? `${shop.website}/book` : `${WEBHOOK_BASE_URL}/${shopId}/book`}

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
🛍️ ${shop?.website || `${WEBHOOK_BASE_URL}/${shopId}`}`;
    }

    // Send auto-reply
    try {
      await sendTextMessage(instance, phone, responseMessage);

      // Update cooldown
      recentContacts.set(phone, now);

      console.log(`[${instance}] Auto-reply sent to ${phone} (intent: ${intent})`);

      // Log Success
      if (logDocRef) logDocRef.update({ status: "reply_sent" }).catch(() => { });

    } catch (error) {
      console.error(`[${instance}] Failed to send auto-reply:`, error);
      // Log Error
      if (logDocRef) logDocRef.update({ status: "error", error: String(error) }).catch(() => { });
    }
  } catch (error) {
    console.error(`[${instance}] ❌ CRITICAL ERROR in handleNewMessage:`, error);
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
🛍️ ${WEBHOOK_BASE_URL}/${shopId}/product/${context.productId}`;

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
${WEBHOOK_BASE_URL}/${shopId}/book`;

      await sendTextMessage(instance, phone, serviceMessage);
      break;

    case "catalog_request":
      // Ya pidió catálogo, dar seguimiento
      const catalogMessage = `Recuerda que puedes ver todos nuestros productos aquí:
🛍️ ${WEBHOOK_BASE_URL}/${shopId}

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
  shopId: string, // Added shopId argument
  phone: string,
  location: NonNullable<WebhookPayload["data"]["message"]>["locationMessage"],
  pushName?: string
) {
  if (!location) return;

  const { degreesLatitude, degreesLongitude, name, address } = location;
  // shopId is passed in now! No need to extract from slug.

  console.log(`[${instance}] Location received: ${degreesLatitude}, ${degreesLongitude} for shop ${shopId}`);

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

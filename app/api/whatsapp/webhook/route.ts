import { NextRequest, NextResponse } from "next/server";
import { checkOrderAssignmentResponse } from "@/lib/handlers/order-assignment.handler";
import { checkBookingConfirmationResponse } from "@/lib/handlers/booking-confirmation.handler";
import { checkRentalConfirmationResponse } from "@/lib/handlers/rental-confirmation.handler";
import { sendTextMessage } from "@/lib/evolution";
import {
    getConversationContext,
    setConversationContext,
    clearConversationContext,
    detectMessageIntent,
} from "@/lib/services/conversation-context.service";

// App URL for links in messages (fallback to production URL)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://proyecto-tiendas.vercel.app";

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
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown for auto-reply

// Auto-reply configuration (in production, load from DB per shop)
const getAutoReplyConfig = (instanceName: string) => {
  // Default config - would be loaded from DB per shop
  return {
    enabled: true,
    welcomeMessage: `¡Hola! 👋 Gracias por contactarnos.

Visita nuestra tienda para ver todos nuestros productos y servicios:
🛍️ https://tu-tienda.com

¿En qué podemos ayudarte?`,
    businessHoursOnly: false,
    startHour: 9,
    endHour: 18,
  };
};

// Check if current time is within business hours
function isBusinessHours(startHour: number, endHour: number): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= startHour && hour < endHour;
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

  // ============================================================
  // PASO 4: Verificar contexto de conversación
  // ============================================================

  // Extraer shopId del nombre de instancia (shop_xxx -> xxx)
  const shopId = instance.replace("shop_", "").replace(/_/g, "-");

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

  // Check auto-reply cooldown
  const lastContact = recentContacts.get(phone);
  const now = Date.now();

  if (lastContact && now - lastContact < COOLDOWN_MS) {
    console.log(`[${instance}] Skipping auto-reply - cooldown active for ${phone}`);
    return;
  }

  // Detectar intención del mensaje
  const { intent, confidence } = detectMessageIntent(text);
  console.log(`[${instance}] Detected intent: ${intent} (confidence: ${confidence})`);

  // Get auto-reply config for this instance
  const config = getAutoReplyConfig(instance);

  if (!config.enabled) {
    console.log(`[${instance}] Auto-reply disabled`);
    return;
  }

  // Check business hours if configured
  if (config.businessHoursOnly && !isBusinessHours(config.startHour, config.endHour)) {
    console.log(`[${instance}] Outside business hours`);
    return;
  }

  // Enviar respuesta según la intención detectada
  let responseMessage = config.welcomeMessage;

  if (intent === "catalog") {
    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Aquí puedes ver nuestro catálogo completo:
🛍️ ${APP_URL}/${shopId}

¿Hay algo específico que te interese?`;

    // Crear contexto de solicitud de catálogo
    await setConversationContext(shopId, phone, "catalog_request", "idle", {
      customerName: pushName,
    });
  } else if (intent === "service") {
    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋

Para agendar una cita, visita nuestra página de servicios:
📅 ${APP_URL}/${shopId}/book

O dime qué servicio te interesa y te ayudo a reservar.`;
  } else if (intent === "greeting" || intent === "unknown") {
    responseMessage = `¡Hola${pushName ? ` ${pushName}` : ""}! 👋 Gracias por contactarnos.

¿En qué podemos ayudarte?

📋 *CATÁLOGO* - Ver productos y servicios
📅 *CITA* - Agendar una cita
❓ *PREGUNTA* - Escribe tu consulta

O visita nuestra tienda:
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

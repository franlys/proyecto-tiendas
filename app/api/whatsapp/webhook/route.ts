import { NextRequest, NextResponse } from "next/server";

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

    switch (event) {
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
        console.log(`[${instance}] Unhandled event: ${event}`);
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

  // Check auto-reply cooldown
  const lastContact = recentContacts.get(phone);
  const now = Date.now();

  if (lastContact && now - lastContact < COOLDOWN_MS) {
    console.log(`[${instance}] Skipping auto-reply - cooldown active for ${phone}`);
    return;
  }

  // Get auto-reply config for this instance
  const config = getAutoReplyConfig(instance);

  if (!config.enabled) {
    console.log(`[${instance}] Auto-reply disabled`);
    return;
  }

  // Check business hours if configured
  if (config.businessHoursOnly && !isBusinessHours(config.startHour, config.endHour)) {
    console.log(`[${instance}] Outside business hours`);
    // Could send a different "we're closed" message here
    return;
  }

  // Send auto-reply
  try {
    // In production, this would call Evolution API
    // await sendTextMessage(instance, phone, config.welcomeMessage);

    // Update cooldown
    recentContacts.set(phone, now);

    console.log(`[${instance}] Auto-reply sent to ${phone}`);

    // Log for analytics (would save to DB)
    console.log(`[Analytics] Auto-reply sent - instance: ${instance}, phone: ${phone}, name: ${pushName}`);
  } catch (error) {
    console.error(`[${instance}] Failed to send auto-reply:`, error);
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

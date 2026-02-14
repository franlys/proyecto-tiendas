/**
 * Evolution API Service Layer
 * Conecta con tu servidor Evolution existente (Proyecto-envios)
 *
 * Configurar en .env:
 * EVOLUTION_API_URL=https://tu-servidor-evolution.com
 * EVOLUTION_API_KEY=tu-api-key-global
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";

export interface EvolutionInstance {
  instanceName: string;
  instanceId?: string;
  status: "open" | "close" | "connecting";
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
}

export interface QRCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface SendMessageResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: object;
  messageTimestamp: string;
  status: string;
}

export interface WebhookConfig {
  url: string;
  webhook_by_events: boolean;
  webhook_base64: boolean;
  events: string[];
}

// Helpers
async function evolutionFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error("Evolution API no configurada. Revisa EVOLUTION_API_URL y EVOLUTION_API_KEY en .env");
  }

  const url = `${EVOLUTION_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    cache: "no-store", // Ensure we always get fresh data
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================
// INSTANCE MANAGEMENT
// ============================================

/**
 * Crear una nueva instancia con un nombre específico
 * @param instanceName - Nombre de la instancia (ej: "shop_tienda1" o "fleet_tienda1_1234567890")
 */
export async function createInstance(instanceName: string): Promise<EvolutionInstance> {
  return evolutionFetch<EvolutionInstance>("/instance/create", {
    method: "POST",
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

/**
 * Crear una instancia para una tienda (WhatsApp principal)
 * @param shopSlug - Identificador de la tienda (ej: "estetica-lola")
 */
export async function createShopInstance(shopSlug: string): Promise<EvolutionInstance> {
  const instanceName = getInstanceName(shopSlug);
  return createInstance(instanceName);
}

/**
 * Obtener información de una instancia
 */
export async function getInstance(instanceName: string): Promise<EvolutionInstance> {
  return evolutionFetch<EvolutionInstance>(`/instance/fetchInstances?instanceName=${instanceName}`);
}

/**
 * Obtener estado de conexión de una instancia
 */
export async function getConnectionState(instanceName: string): Promise<{ state: string }> {
  const response = await evolutionFetch<any>(`/instance/connectionState/${instanceName}`);
  return response.instance || response;
}

/**
 * Desconectar instancia
 */
export async function logoutInstance(instanceName: string): Promise<{ status: string }> {
  return evolutionFetch<{ status: string }>(`/instance/logout/${instanceName}`, {
    method: "DELETE",
  });
}

/**
 * Eliminar instancia completamente
 */
export async function deleteInstance(instanceName: string): Promise<{ status: string }> {
  return evolutionFetch<{ status: string }>(`/instance/delete/${instanceName}`, {
    method: "DELETE",
  });
}

// ============================================
// QR CODE
// ============================================

/**
 * Obtener QR code para conectar WhatsApp
 */
export async function fetchQRCode(instanceName: string): Promise<QRCodeResponse> {
  return evolutionFetch<QRCodeResponse>(`/instance/connect/${instanceName}`);
}

// ============================================
// WEBHOOKS
// ============================================

/**
 * Configurar webhook para recibir mensajes
 */
export async function setWebhook(
  instanceName: string,
  webhookUrl: string
): Promise<{ webhook: WebhookConfig }> {
  return evolutionFetch<{ webhook: WebhookConfig }>(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: true,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED",
      ],
    }),
  });
}

/**
 * Obtener configuración de webhook actual
 */
export async function getWebhook(instanceName: string): Promise<WebhookConfig | null> {
  try {
    return await evolutionFetch<WebhookConfig>(`/webhook/find/${instanceName}`);
  } catch {
    return null;
  }
}

// ============================================
// MESSAGING
// ============================================

/**
 * Enviar mensaje de texto
 */
export async function sendTextMessage(
  instanceName: string,
  phone: string,
  message: string
): Promise<SendMessageResponse> {
  // Limpiar número (solo dígitos) si NO es un JID (contiene @)
  const cleanPhone = phone.includes("@") ? phone : phone.replace(/\D/g, "");

  return evolutionFetch<SendMessageResponse>(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: cleanPhone,
      textMessage: {
        text: message,
      },
    }),
  });
}

/**
 * Enviar mensaje con botones
 */
export async function sendButtonMessage(
  instanceName: string,
  phone: string,
  title: string,
  description: string,
  buttons: { buttonId: string; buttonText: string }[]
): Promise<SendMessageResponse> {
  const cleanPhone = phone.replace(/\D/g, "");

  return evolutionFetch<SendMessageResponse>(`/message/sendButtons/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: cleanPhone,
      title,
      description,
      buttons: buttons.map((b, i) => ({
        buttonId: b.buttonId || `btn_${i}`,
        buttonText: { displayText: b.buttonText },
        type: 1,
      })),
    }),
  });
}

/**
 * Enviar documento (PDF, etc)
 */
export async function sendDocument(
  instanceName: string,
  phone: string,
  documentUrl: string,
  fileName: string,
  caption?: string
): Promise<SendMessageResponse> {
  const cleanPhone = phone.replace(/\D/g, "");

  return evolutionFetch<SendMessageResponse>(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: cleanPhone,
      mediatype: "document",
      media: documentUrl,
      fileName,
      caption: caption || "",
    }),
  });
}

/**
 * Enviar imagen
 */
export async function sendImage(
  instanceName: string,
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<SendMessageResponse> {
  const cleanPhone = phone.replace(/\D/g, "");

  return evolutionFetch<SendMessageResponse>(`/message/sendMedia/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: cleanPhone,
      mediatype: "image",
      media: imageUrl,
      caption: caption || "",
    }),
  });
}

// ============================================
// AUTO-REPLY CONFIG
// ============================================

export interface AutoReplyConfig {
  enabled: boolean;
  welcomeMessage: string;
  shopUrl: string;
  businessHours?: {
    start: string; // "09:00"
    end: string;   // "18:00"
    timezone: string;
  };
  offlineMessage?: string;
}

/**
 * Generar mensaje de bienvenida con link de la tienda
 */
export function generateWelcomeMessage(
  shopName: string,
  shopUrl: string,
  customMessage?: string
): string {
  if (customMessage) {
    return customMessage
      .replace("{shopName}", shopName)
      .replace("{shopUrl}", shopUrl);
  }

  return `¡Hola! 👋 Bienvenido a *${shopName}*

Visita nuestra tienda en línea para ver nuestros productos y servicios:
🛍️ ${shopUrl}

¿En qué podemos ayudarte?`;
}

// ============================================
// UTILITY: Check if Evolution is configured
// ============================================

export function isEvolutionConfigured(): boolean {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

export function getEvolutionBaseUrl(): string {
  return EVOLUTION_API_URL;
}

export function getInstanceName(shopSlug: string): string {
  // VERSION 2: Forcing a new instance to clear "Waiting for message" encryption issues
  // Old: shop_surprise_gifts
  // New: shop_surprise_gifts_v2
  return `shop_${shopSlug.replace(/-/g, "_")}_v2`;
}

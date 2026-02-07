/**
 * Servicio para manejar el contexto de conversaciones de WhatsApp
 * Permite diferenciar entre:
 * - Clientes que vienen de un link de producto/servicio
 * - Clientes que escriben mensajes genéricos
 */

import { adminDb } from "@/lib/firebase-admin";

// Tipos de contexto de conversación
export type ConversationSource =
    | "direct_message"      // Mensaje directo sin contexto
    | "product_inquiry"     // Vino de un producto específico
    | "service_inquiry"     // Vino de un servicio específico
    | "catalog_request"     // Pidió el catálogo
    | "booking_flow"        // Está en flujo de reservación
    | "order_assignment"    // Es un vendedor respondiendo asignación
    | "rental_confirmation"; // Está confirmando una renta

export type ConversationState =
    | "idle"                    // Sin estado activo
    | "awaiting_response"       // Esperando respuesta del cliente
    | "awaiting_confirmation"   // Esperando confirmación
    | "awaiting_selection"      // Esperando que seleccione opción
    | "awaiting_date"           // Esperando fecha
    | "awaiting_time";          // Esperando hora

export interface ConversationContext {
    phone: string;
    shopId: string;
    source: ConversationSource;
    state: ConversationState;
    // Datos adicionales según el contexto
    productId?: string;
    productName?: string;
    serviceId?: string;
    serviceName?: string;
    bookingId?: string;
    orderId?: string;
    rentalId?: string;
    // Timestamps
    createdAt: string;
    updatedAt: string;
    expiresAt: string; // El contexto expira después de cierto tiempo
    // Metadata
    lastMessageId?: string;
    customerName?: string;
}

// Colección de contextos
const getContextCollection = (shopId: string) =>
    `shops/${shopId}/conversationContexts`;

// Tiempo de expiración del contexto (2 horas)
const CONTEXT_EXPIRY_HOURS = 2;

/**
 * Obtener el contexto de una conversación
 */
export async function getConversationContext(
    shopId: string,
    phone: string
): Promise<ConversationContext | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        const docRef = db.collection(getContextCollection(shopId)).doc(cleanPhone);
        const doc = await docRef.get();

        if (!doc.exists) return null;

        const context = doc.data() as ConversationContext;

        // Verificar si el contexto expiró
        if (new Date(context.expiresAt) < new Date()) {
            // Contexto expirado, eliminarlo
            await docRef.delete();
            return null;
        }

        return context;
    } catch (error) {
        console.error("Error getting conversation context:", error);
        return null;
    }
}

/**
 * Crear o actualizar el contexto de una conversación
 */
export async function setConversationContext(
    shopId: string,
    phone: string,
    source: ConversationSource,
    state: ConversationState = "idle",
    additionalData: Partial<ConversationContext> = {}
): Promise<ConversationContext | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CONTEXT_EXPIRY_HOURS * 60 * 60 * 1000);

        const context: ConversationContext = {
            phone: cleanPhone,
            shopId,
            source,
            state,
            ...additionalData,
            createdAt: additionalData.createdAt || now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        };

        await db.collection(getContextCollection(shopId)).doc(cleanPhone).set(context);

        return context;
    } catch (error) {
        console.error("Error setting conversation context:", error);
        return null;
    }
}

/**
 * Actualizar el estado de una conversación
 */
export async function updateConversationState(
    shopId: string,
    phone: string,
    state: ConversationState,
    additionalData: Partial<ConversationContext> = {}
): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + CONTEXT_EXPIRY_HOURS * 60 * 60 * 1000);

        await db.collection(getContextCollection(shopId)).doc(cleanPhone).update({
            state,
            ...additionalData,
            updatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        });

        return true;
    } catch (error) {
        console.error("Error updating conversation state:", error);
        return false;
    }
}

/**
 * Limpiar el contexto de una conversación
 */
export async function clearConversationContext(
    shopId: string,
    phone: string
): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        await db.collection(getContextCollection(shopId)).doc(cleanPhone).delete();
        return true;
    } catch (error) {
        console.error("Error clearing conversation context:", error);
        return false;
    }
}

/**
 * Crear contexto desde un link de producto
 * Usado cuando el cliente hace clic en "Consultar por WhatsApp" en un producto
 */
export async function createProductInquiryContext(
    shopId: string,
    phone: string,
    productId: string,
    productName: string,
    customerName?: string
): Promise<ConversationContext | null> {
    return setConversationContext(shopId, phone, "product_inquiry", "awaiting_response", {
        productId,
        productName,
        customerName,
    });
}

/**
 * Crear contexto desde un link de servicio
 * Usado cuando el cliente hace clic en "Agendar cita" en un servicio
 */
export async function createServiceInquiryContext(
    shopId: string,
    phone: string,
    serviceId: string,
    serviceName: string,
    customerName?: string
): Promise<ConversationContext | null> {
    return setConversationContext(shopId, phone, "service_inquiry", "awaiting_response", {
        serviceId,
        serviceName,
        customerName,
    });
}

/**
 * Detectar intención del mensaje
 * Analiza el texto para determinar qué quiere el cliente
 */
export function detectMessageIntent(text: string): {
    intent: "catalog" | "product" | "service" | "greeting" | "question" | "unknown";
    confidence: number;
} {
    const lowerText = text.toLowerCase().trim();

    // Palabras clave para catálogo
    const catalogKeywords = ["catalogo", "catálogo", "productos", "menu", "menú", "ver todo", "que tienen", "qué tienen"];
    if (catalogKeywords.some((kw) => lowerText.includes(kw))) {
        return { intent: "catalog", confidence: 0.9 };
    }

    // Saludos
    const greetings = ["hola", "buenos días", "buenas tardes", "buenas noches", "hey", "hi", "hello"];
    if (greetings.some((g) => lowerText.startsWith(g) || lowerText === g)) {
        return { intent: "greeting", confidence: 0.8 };
    }

    // Preguntas sobre servicios
    const serviceKeywords = ["cita", "reservar", "agendar", "turno", "hora", "disponibilidad"];
    if (serviceKeywords.some((kw) => lowerText.includes(kw))) {
        return { intent: "service", confidence: 0.7 };
    }

    // Preguntas sobre productos
    const productKeywords = ["precio", "costo", "cuanto", "cuánto", "disponible", "tienen", "hay"];
    if (productKeywords.some((kw) => lowerText.includes(kw))) {
        return { intent: "product", confidence: 0.6 };
    }

    // Pregunta general
    if (lowerText.includes("?")) {
        return { intent: "question", confidence: 0.5 };
    }

    return { intent: "unknown", confidence: 0.3 };
}

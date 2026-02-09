/**
 * Servicio para gestionar la configuración de WhatsApp Bot por tienda
 * Usa Firebase Admin SDK (server-side)
 */

import { adminDb } from "@/lib/firebase-admin";
import {
    WhatsAppAutoReplyConfig,
    ShopBasicInfo,
    getDefaultWhatsAppConfig,
} from "@/lib/types/whatsapp-config.types";

const CONFIG_DOC = "config";
const WHATSAPP_COLLECTION = "whatsapp_bot";

/**
 * Obtener configuración de auto-respuesta de una tienda
 */
export async function getWhatsAppConfig(shopId: string): Promise<WhatsAppAutoReplyConfig | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const docRef = db.collection("shops").doc(shopId).collection(WHATSAPP_COLLECTION).doc(CONFIG_DOC);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        return doc.data() as WhatsAppAutoReplyConfig;
    } catch (error) {
        console.error(`Error getting WhatsApp config for shop ${shopId}:`, error);
        return null;
    }
}

/**
 * Guardar configuración de auto-respuesta
 */
export async function saveWhatsAppConfig(
    shopId: string,
    config: Partial<WhatsAppAutoReplyConfig>
): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        const docRef = db.collection("shops").doc(shopId).collection(WHATSAPP_COLLECTION).doc(CONFIG_DOC);

        await docRef.set(
            {
                ...config,
                updatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        return true;
    } catch (error) {
        console.error(`Error saving WhatsApp config for shop ${shopId}:`, error);
        return false;
    }
}

/**
 * Obtener información básica de la tienda
 */
export async function getShopBasicInfo(shopId: string): Promise<ShopBasicInfo | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        // Intentar buscar por slug primero
        const shopsRef = db.collection("shops");
        let doc = await shopsRef.doc(shopId).get();

        if (!doc.exists) {
            // Buscar por slug
            const query = await shopsRef.where("slug", "==", shopId).limit(1).get();
            if (!query.empty) {
                doc = query.docs[0];
            } else {
                return null;
            }
        }

        const data = doc.data();
        if (!data) return null;

        return {
            id: doc.id,
            slug: data.slug || doc.id,
            name: data.name || "Tienda",
            businessType: data.businessType || data.category || "retail",
            contact: data.contact,
        };
    } catch (error) {
        console.error(`Error getting shop info for ${shopId}:`, error);
        return null;
    }
}

/**
 * Obtener configuración completa (config + info de tienda)
 * Si no existe configuración, devuelve valores por defecto según tipo de negocio
 */
export async function getWhatsAppConfigWithDefaults(shopId: string): Promise<{
    config: WhatsAppAutoReplyConfig;
    shop: ShopBasicInfo | null;
}> {
    const [config, shop] = await Promise.all([
        getWhatsAppConfig(shopId),
        getShopBasicInfo(shopId),
    ]);

    // Si no hay configuración, usar defaults según tipo de negocio
    const finalConfig = config || getDefaultWhatsAppConfig(shop?.businessType || "retail");

    return {
        config: finalConfig,
        shop,
    };
}

/**
 * Inicializar configuración por defecto para una tienda
 */
export async function initializeWhatsAppConfig(shopId: string, businessType: string): Promise<boolean> {
    const existingConfig = await getWhatsAppConfig(shopId);

    if (existingConfig) {
        return true; // Ya existe
    }

    const defaultConfig = getDefaultWhatsAppConfig(businessType);
    return saveWhatsAppConfig(shopId, defaultConfig);
}

"use server";

import { adminDb } from "@/lib/firebase-admin";
import type {
    Fleet,
    ShopWhatsAppConfig,
    CreateFleetInput,
    UpdateFleetInput,
} from "@/lib/types/fleet.types";

// Colecciones
const getFleetsCollection = (shopId: string) => `shops/${shopId}/fleets`;
const getWhatsAppConfigDoc = (shopId: string) => `shops/${shopId}/whatsappConfig/config`;

// ==================== WHATSAPP CONFIG ====================

const DEFAULT_WHATSAPP_CONFIG: Omit<ShopWhatsAppConfig, "mainInstanceName" | "mainPhone"> = {
    isMainConnected: false,
    webhookUrl: "",
    webhookConfigured: false,
    autoReplyEnabled: true,
    welcomeMessage: "¡Hola! 👋 Gracias por contactarnos. En breve te atenderemos.",
    businessHoursOnly: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    fleetRotationEnabled: true,
    notifyAllFleetsOnAssignment: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export async function getShopWhatsAppConfig(
    shopId: string
): Promise<ShopWhatsAppConfig | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const docRef = db.doc(getWhatsAppConfigDoc(shopId));
        const doc = await docRef.get();

        if (!doc.exists) return null;

        return doc.data() as ShopWhatsAppConfig;
    } catch (error) {
        console.error("Error getting WhatsApp config:", error);
        return null;
    }
}

export async function createOrUpdateWhatsAppConfig(
    shopId: string,
    config: Partial<ShopWhatsAppConfig>
): Promise<ShopWhatsAppConfig | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const docRef = db.doc(getWhatsAppConfigDoc(shopId));
        const existingDoc = await docRef.get();

        const now = new Date().toISOString();

        if (existingDoc.exists) {
            // Actualizar
            await docRef.update({
                ...config,
                updatedAt: now,
            });
        } else {
            // Crear con valores por defecto
            const mainInstanceName = `shop_${shopId.replace(/-/g, "_")}`;
            await docRef.set({
                ...DEFAULT_WHATSAPP_CONFIG,
                mainInstanceName,
                mainPhone: config.mainPhone || "",
                ...config,
                createdAt: now,
                updatedAt: now,
            });
        }

        return await getShopWhatsAppConfig(shopId);
    } catch (error) {
        console.error("Error updating WhatsApp config:", error);
        return null;
    }
}

export async function updateMainInstanceConnection(
    shopId: string,
    isConnected: boolean
): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        const docRef = db.doc(getWhatsAppConfigDoc(shopId));
        await docRef.update({
            isMainConnected: isConnected,
            mainConnectedAt: isConnected ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        console.error("Error updating main instance connection:", error);
        return false;
    }
}

// ==================== FLEET MANAGEMENT ====================

export async function createFleet(input: CreateFleetInput): Promise<Fleet | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const { shopId, name, phone, email, role, priority } = input;

        // Generar nombre de instancia para la flota
        const cleanPhone = phone.replace(/\D/g, "");
        const instanceName = `fleet_${shopId.replace(/-/g, "_")}_${cleanPhone}`;

        // Obtener prioridad si no se especificó
        let fleetPriority = priority;
        if (!fleetPriority) {
            const existingFleets = await getFleets(shopId);
            fleetPriority = existingFleets.length + 1;
        }

        const now = new Date().toISOString();

        const fleet: Omit<Fleet, "id"> = {
            shopId,
            name,
            phone: cleanPhone,
            email,
            role,
            instanceName,
            isConnected: false,
            isActive: true,
            isAvailable: true,
            priority: fleetPriority,
            totalAssignments: 0,
            acceptedAssignments: 0,
            rejectedAssignments: 0,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await db.collection(getFleetsCollection(shopId)).add(fleet);

        return {
            id: docRef.id,
            ...fleet,
        };
    } catch (error) {
        console.error("Error creating fleet:", error);
        return null;
    }
}

export async function getFleet(
    shopId: string,
    fleetId: string
): Promise<Fleet | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const docRef = db.collection(getFleetsCollection(shopId)).doc(fleetId);
        const doc = await docRef.get();

        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data(),
        } as Fleet;
    } catch (error) {
        console.error("Error getting fleet:", error);
        return null;
    }
}

export async function getFleets(shopId: string): Promise<Fleet[]> {
    const db = adminDb();
    if (!db) return [];

    try {
        const snapshot = await db
            .collection(getFleetsCollection(shopId))
            .orderBy("priority", "asc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Fleet[];
    } catch (error) {
        console.error("Error getting fleets:", error);
        return [];
    }
}

export async function getActiveFleets(shopId: string): Promise<Fleet[]> {
    const db = adminDb();
    if (!db) return [];

    try {
        const snapshot = await db
            .collection(getFleetsCollection(shopId))
            .where("isActive", "==", true)
            .where("isAvailable", "==", true)
            .orderBy("priority", "asc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Fleet[];
    } catch (error) {
        console.error("Error getting active fleets:", error);
        return [];
    }
}

export async function getConnectedFleets(shopId: string): Promise<Fleet[]> {
    const db = adminDb();
    if (!db) return [];

    try {
        const snapshot = await db
            .collection(getFleetsCollection(shopId))
            .where("isActive", "==", true)
            .where("isConnected", "==", true)
            .orderBy("priority", "asc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Fleet[];
    } catch (error) {
        console.error("Error getting connected fleets:", error);
        return [];
    }
}

export async function updateFleet(
    shopId: string,
    fleetId: string,
    updates: UpdateFleetInput
): Promise<Fleet | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const docRef = db.collection(getFleetsCollection(shopId)).doc(fleetId);

        // Si se actualiza el teléfono, actualizar también el nombre de instancia
        const updateData: any = {
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        if (updates.phone) {
            const cleanPhone = updates.phone.replace(/\D/g, "");
            updateData.phone = cleanPhone;
            updateData.instanceName = `fleet_${shopId.replace(/-/g, "_")}_${cleanPhone}`;
        }

        await docRef.update(updateData);

        return await getFleet(shopId, fleetId);
    } catch (error) {
        console.error("Error updating fleet:", error);
        return null;
    }
}

export async function updateFleetConnection(
    shopId: string,
    fleetId: string,
    isConnected: boolean
): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        const docRef = db.collection(getFleetsCollection(shopId)).doc(fleetId);
        await docRef.update({
            isConnected,
            connectedAt: isConnected ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (error) {
        console.error("Error updating fleet connection:", error);
        return false;
    }
}

export async function deleteFleet(shopId: string, fleetId: string): Promise<boolean> {
    const db = adminDb();
    if (!db) return false;

    try {
        await db.collection(getFleetsCollection(shopId)).doc(fleetId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting fleet:", error);
        return false;
    }
}

export async function incrementFleetStats(
    shopId: string,
    fleetId: string,
    accepted: boolean
): Promise<void> {
    const db = adminDb();
    if (!db) return;

    try {
        const docRef = db.collection(getFleetsCollection(shopId)).doc(fleetId);
        const doc = await docRef.get();

        if (!doc.exists) return;

        const fleet = doc.data() as Fleet;

        await docRef.update({
            totalAssignments: fleet.totalAssignments + 1,
            acceptedAssignments: accepted
                ? fleet.acceptedAssignments + 1
                : fleet.acceptedAssignments,
            rejectedAssignments: !accepted
                ? fleet.rejectedAssignments + 1
                : fleet.rejectedAssignments,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error incrementing fleet stats:", error);
    }
}

// ==================== FLEET BY PHONE ====================

export async function getFleetByPhone(
    shopId: string,
    phone: string
): Promise<Fleet | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const cleanPhone = phone.replace(/\D/g, "");
        const snapshot = await db
            .collection(getFleetsCollection(shopId))
            .where("phone", "==", cleanPhone)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as Fleet;
    } catch (error) {
        console.error("Error getting fleet by phone:", error);
        return null;
    }
}

// ==================== NEXT FLEET IN ROTATION ====================

export async function getNextFleetInRotation(
    shopId: string,
    excludeFleetIds: string[] = []
): Promise<Fleet | null> {
    const db = adminDb();
    if (!db) return null;

    try {
        const connectedFleets = await getConnectedFleets(shopId);

        // Filtrar las flotas excluidas
        const availableFleets = connectedFleets.filter(
            (fleet) => !excludeFleetIds.includes(fleet.id) && fleet.isAvailable
        );

        if (availableFleets.length === 0) return null;

        // Retornar la primera por prioridad
        return availableFleets[0];
    } catch (error) {
        console.error("Error getting next fleet in rotation:", error);
        return null;
    }
}

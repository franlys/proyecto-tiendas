"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

// Configuración por defecto para asignación de pedidos
const DEFAULT_ORDER_ASSIGNMENT_CONFIG = {
    enabled: false,
    initialTimeoutMinutes: 5,
    rotationTimeoutMinutes: 8,
    maxRotations: 3,
    eligibleRoles: ["sales", "manager"],
    notifyOwnerOnExpiry: true,
    acceptKeywords: ["SI", "SÍ", "ACEPTO", "ACEPTAR", "OK", "1"],
    rejectKeywords: ["NO", "RECHAZAR", "PASO", "OCUPADO", "2"],
    businessHoursOnly: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
    createdAt: new Date().toISOString(),
};

// Configuración por defecto para reservaciones
const DEFAULT_BOOKING_CONFIG = {
    enabled: false,
    openTime: "09:00",
    closeTime: "18:00",
    slotDurationMinutes: 30,
    maxBookingsPerSlot: 1,
    closedDays: [0], // Domingo cerrado
    minAdvanceBookingHours: 2,
    maxAdvanceBookingDays: 30,
    reminderHoursBefore: 24,
    confirmKeywords: ["SI", "SÍ", "CONFIRMO", "CONFIRMAR", "OK", "1"],
    rescheduleKeywords: ["CAMBIAR", "REAGENDAR", "MOVER", "2"],
    cancelKeywords: ["NO", "CANCELAR", "CANCELO", "3"],
    notifyBusinessOnConfirm: true,
    notifyBusinessOnCancel: true,
    createdAt: new Date().toISOString(),
};

export async function createShopAction(shopData: any) {
    try {
        const db = adminDb();
        if (!db) {
            throw new Error("Could not connect to Firebase Admin. Init returned null.");
        }

        // Ensure shopData has an ID
        const shopId = shopData.id || `shop-${Date.now()}`;

        // Clean undefined values which Firestore hates
        const cleanData = JSON.parse(JSON.stringify(shopData));

        console.log(`📝 [SERVER ACTION] Writing shop ${shopId} to Firestore...`);

        // Crear el documento de la tienda
        await db.collection("shops").doc(shopId).set({
            ...cleanData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        // Crear configuraciones por defecto en subcollecciones
        // Esto hace que las subcollecciones sean visibles en Firebase Console
        await db
            .collection("shops")
            .doc(shopId)
            .collection("orderAssignmentConfig")
            .doc("config")
            .set(DEFAULT_ORDER_ASSIGNMENT_CONFIG);

        await db
            .collection("shops")
            .doc(shopId)
            .collection("bookingConfig")
            .doc("config")
            .set(DEFAULT_BOOKING_CONFIG);

        console.log(`✅ [SERVER ACTION] Shop created with default configs: ${shopId}`);

        revalidatePath("/agency");
        return { success: true, shopId };
    } catch (error) {
        console.error("❌ [SERVER ACTION] Create Shop Failed:", error);
        return { success: false, error: (error as any).message };
    }
}

/**
 * Inicializa las configuraciones por defecto para una tienda existente
 * Útil para tiendas creadas antes de que se agregaran las subcollecciones
 */
export async function initializeShopConfigsAction(shopId: string) {
    try {
        const db = adminDb();
        if (!db) {
            throw new Error("Could not connect to Firebase Admin.");
        }

        // Verificar que la tienda existe
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            throw new Error(`Shop ${shopId} not found`);
        }

        // Crear/actualizar configuración de asignación de pedidos
        const orderConfigRef = db
            .collection("shops")
            .doc(shopId)
            .collection("orderAssignmentConfig")
            .doc("config");

        const orderConfigDoc = await orderConfigRef.get();
        if (!orderConfigDoc.exists) {
            await orderConfigRef.set(DEFAULT_ORDER_ASSIGNMENT_CONFIG);
            console.log(`✅ Created orderAssignmentConfig for ${shopId}`);
        }

        // Crear/actualizar configuración de reservaciones
        const bookingConfigRef = db
            .collection("shops")
            .doc(shopId)
            .collection("bookingConfig")
            .doc("config");

        const bookingConfigDoc = await bookingConfigRef.get();
        if (!bookingConfigDoc.exists) {
            await bookingConfigRef.set(DEFAULT_BOOKING_CONFIG);
            console.log(`✅ Created bookingConfig for ${shopId}`);
        }

        return { success: true, message: "Configurations initialized" };
    } catch (error) {
        console.error("❌ [SERVER ACTION] Initialize Configs Failed:", error);
        return { success: false, error: (error as any).message };
    }
}

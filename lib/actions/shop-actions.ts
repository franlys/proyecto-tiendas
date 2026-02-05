"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createShopAction(shopData: any) {
    try {
        const db = adminDb();
        if (!db) {
            throw new Error("Could not connect to Firebase Admin. Check server credentials.");
        }

        // DEBUG: Connection Probe
        try {
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            console.log(`🔍 [SERVER ACTION] Testing Connection to Project: ${projectId}`);
            // Attempt to list collections to verify connectivity and auth
            const collections = await db.listCollections();
            console.log(`✅ [SERVER ACTION] Connection Successful! Found ${collections.length} collections.`);
        } catch (e: any) {
            console.error("❌ [SERVER ACTION] Connection Probe Failed:", e);
            // If this fails, the detailed error will be logged server-side
            if (e.code === 5 || (e.message && e.message.includes("NOT_FOUND"))) {
                throw new Error(`CRÍTICO: Error 5 NOT_FOUND. Firebase no encuentra la base de datos en el proyecto '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'. ¿La base de datos existe en la consola?`);
            }
            throw e;
        }

        // Ensure shopData has an ID
        const shopId = shopData.id || `shop-${Date.now()}`;

        // Clean undefined values which Firestore hates
        const cleanData = JSON.parse(JSON.stringify(shopData));

        console.log(`📝 [SERVER ACTION] Writing shop ${shopId} to Firestore...`);
        await db.collection("shops").doc(shopId).set(cleanData);

        console.log(`✅ [SERVER ACTION] Shop created: ${shopId}`);

        revalidatePath("/agency");
        return { success: true, shopId };
    } catch (error) {
        console.error("❌ [SERVER ACTION] Create Shop Failed:", error);
        return { success: false, error: (error as any).message };
    }
}

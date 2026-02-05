"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createShopAction(shopData: any) {
    try {
        // DIAGNOSTIC INFO
        const pKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
        console.log("🔍 [SERVER ACTION] DIAGNOSTIC INFO:");
        console.log("   - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        console.log("   - Client Email:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
        console.log("   - Private Key Length:", pKey.length);

        const db = adminDb();
        if (!db) {
            throw new Error("Could not connect to Firebase Admin. Init returned null. Check logs for missing keys.");
        }

        // DEBUG: Verify Project and Connection
        try {
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            console.log(`🔍 [SERVER ACTION] Attempting Direct Write to ${projectId}...`);
            // We skip listCollections() probe as it might give false negatives on permissions
        } catch (e: any) {
            console.error("❌ [SERVER ACTION] Setup Failed:", e);
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

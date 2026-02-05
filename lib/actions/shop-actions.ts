"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function createShopAction(shopData: any) {
    try {
        const db = adminDb();
        if (!db) {
            throw new Error("Could not connect to Firebase Admin. Check server credentials.");
        }

        // Ensure shopData has an ID
        const shopId = shopData.id || `shop-${Date.now()}`;

        // Clean undefined values which Firestore hates
        const cleanData = JSON.parse(JSON.stringify(shopData));

        await db.collection("shops").doc(shopId).set(cleanData);

        console.log(`✅ [SERVER ACTION] Shop created: ${shopId}`);

        revalidatePath("/agency");
        return { success: true, shopId };
    } catch (error) {
        console.error("❌ [SERVER ACTION] Create Shop Failed:", error);
        return { success: false, error: (error as any).message };
    }
}

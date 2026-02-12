import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { SalesOrderItem } from "@/components/shared/sales-orders-context";

/**
 * Deduct stock for a list of items using a Firestore transaction.
 * This ensures atomic updates and prevents race conditions.
 */
export async function deductStock(shopId: string, items: SalesOrderItem[]) {
    const db = adminDb();
    if (!db) throw new Error("Firebase Admin not initialized");

    try {
        await db.runTransaction(async (transaction) => {
            // 1. Read all product docs first
            const productRefs = items.map(item =>
                db.collection("shops").doc(shopId).collection("products").doc(item.productId)
            );

            const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

            // 2. Validate stock availability
            productDocs.forEach((doc, index) => {
                if (!doc.exists) {
                    throw new Error(`Product ${items[index].productId} not found`);
                }

                const currentStock = doc.data()?.stock || 0;
                const requestedQuantity = items[index].quantity;

                // Optional: Force strictly positive stock? Or allow negative?
                // Let's allow negative for now to avoid blocking sales, but log warning.
                // The user didn't specify strict blocking.
                // Actually, let's just deduct.
            });

            productDocs.forEach((doc, index) => {
                const currentStock = doc.data()?.stock || 0;
                // Simple calculation to avoid FieldValue type issues
                const newStock = currentStock - items[index].quantity;

                transaction.update(productRefs[index], {
                    stock: newStock,
                    updatedAt: new Date().toISOString()
                });
            });
        });

        console.log(`[Inventory] Deducted stock for ${items.length} items in shop ${shopId}`);
        return { success: true };

    } catch (error) {
        console.error("[Inventory] Error deducting stock:", error);
        return { success: false, error };
    }
}

/**
 * Restore stock (e.g. for cancellations)
 */
export async function restoreStock(shopId: string, items: SalesOrderItem[]) {
    const db = adminDb();
    if (!db) throw new Error("Firebase Admin not initialized");

    try {
        await db.runTransaction(async (transaction) => {
            items.forEach(item => {
                const ref = db.collection("shops").doc(shopId).collection("products").doc(item.productId);
                transaction.update(ref, {
                    stock: FieldValue.increment(item.quantity),
                    updatedAt: new Date().toISOString()
                });
            });
        });
        console.log(`[Inventory] Restored stock for ${items.length} items`);
        return { success: true };
    } catch (error) {
        console.error("[Inventory] Error restoring stock:", error);
        return { success: false, error };
    }
}

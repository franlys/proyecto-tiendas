"use server";

import { adminDb } from "@/lib/firebase-admin";
import { OrderStatus, SalesOrder } from "@/lib/types/order.types";
import { deductStock, restoreStock } from "@/lib/services/inventory.service";
import { sendInvoiceWhatsApp } from "@/lib/services/invoice.service";
import { addStampsAdmin } from "@/lib/services/loyalty-admin.service";

/**
 * Updates order status and triggers side effects (Inventory).
 */
export async function updateOrderStatusAction(shopId: string, orderId: string, status: OrderStatus) {
    const db = adminDb();
    if (!db) return { success: false, error: "Database unavailable" };

    try {
        const orderRef = db.collection("shops").doc(shopId).collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return { success: false, error: "Order not found" };
        }

        const orderData = { id: orderSnap.id, ...orderSnap.data() } as SalesOrder;
        const oldStatus = orderData.status;

        // 1. Update Status in Firestore
        const updates: any = {
            status,
            updatedAt: new Date().toISOString()
        };
        if (status === "confirmed") updates.confirmedAt = new Date().toISOString();
        if (status === "dispatched") updates.dispatchedAt = new Date().toISOString();
        if (status === "delivered") updates.deliveredAt = new Date().toISOString();

        await orderRef.update(updates);

        // 2. Handle Inventory Side Effects
        // Confirmed -> Deduct
        if (status === "confirmed" && oldStatus !== "confirmed") {
            await deductStock(shopId, orderData.items);

            // 3. Add Loyalty Stamps (if customer has phone)
            if (orderData.customerPhone) {
                const normalizedPhone = orderData.customerPhone.replace(/\D/g, "");

                // 3a. Ensure customer exists in the centralized customers collection
                if (normalizedPhone) {
                    try {
                        const customerRef = db.collection("shops").doc(shopId).collection("customers").doc(normalizedPhone);
                        const customerSnap = await customerRef.get();

                        const customerUpdate = {
                            phone: orderData.customerPhone,
                            lastActive: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };

                        if (!customerSnap.exists) {
                            await customerRef.set({
                                ...customerUpdate,
                                name: orderData.customerName || "Cliente",
                                createdAt: new Date().toISOString(),
                            });
                        } else {
                            // Only update name if we have a new one and the old one was generic
                            const existingName = customerSnap.data()?.name;
                            if (orderData.customerName && (!existingName || existingName === "Cliente")) {
                                (customerUpdate as any).name = orderData.customerName;
                            }
                            await customerRef.update(customerUpdate);
                        }
                    } catch (customerError) {
                        console.error("[Customer Sync] Error saving customer:", customerError);
                    }
                }

                try {
                    const stampResult = await addStampsAdmin(
                        shopId,
                        orderData.customerPhone,
                        orderId,
                        orderData.orderNumber || orderId.slice(-6),
                        orderData.total || 0
                    );
                    if (stampResult.success) {
                        console.log(`[Loyalty] Added ${stampResult.stampsAdded} stamp(s) for ${orderData.customerPhone}. Total: ${stampResult.newTotal}`);
                    }
                } catch (loyaltyError) {
                    // Don't fail the order if loyalty fails
                    console.error("[Loyalty] Error adding stamps:", loyaltyError);
                }
            }
        }

        // Cancelled -> Restore (if it was previously confirmed/deducted)
        // We assume if status was pending it wasn't deducted yet, so no need to restore?
        // User policy: "confirmed" triggers deduction.
        // If we cancel a "pending" order, no restore needed.
        // If we cancel a "confirmed", "preparing", "dispatched" order -> Restore.
        const wasDeducted = ["confirmed", "preparing", "dispatched", "delivered"].includes(oldStatus);
        if (status === "cancelled" && wasDeducted) {
            await restoreStock(shopId, orderData.items);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Updates payment status and triggers side effects (Invoice).
 */
export async function updatePaymentStatusAction(shopId: string, orderId: string, paymentStatus: "pending" | "paid" | "partially_paid" | "refunded") {
    const db = adminDb();
    if (!db) return { success: false, error: "Database unavailable" };

    try {
        const orderRef = db.collection("shops").doc(shopId).collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) return { success: false, error: "Order not found" };

        const orderData = { id: orderSnap.id, ...orderSnap.data() } as SalesOrder;

        await orderRef.update({
            paymentStatus,
            updatedAt: new Date().toISOString()
        });

        // Trigger Invoice if Paid
        if (paymentStatus === "paid" && orderData.paymentStatus !== "paid") {
            // Run in background / don't block?
            // We can await it to ensure it sends.
            await sendInvoiceWhatsApp(shopId, orderData);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating payment status:", error);
        return { success: false, error: String(error) };
    }
}

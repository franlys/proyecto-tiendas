/**
 * Push Notification Service
 * Sends push notifications to subscribed devices
 */

import { adminDb } from "@/lib/firebase-admin";
import webpush from "web-push";

// Types
interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, any>;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
}

interface SendResult {
    success: boolean;
    sent: number;
    failed: number;
    errors: string[];
}

// Configure VAPID keys (set these in environment variables)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@linko.app";

// Initialize web-push if keys are configured
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log("[Push Service] VAPID keys configured");
} else {
    console.warn("[Push Service] VAPID keys not configured - push notifications disabled");
}

/**
 * Get all push subscriptions for a shop
 */
export async function getShopSubscriptions(shopId: string): Promise<PushSubscriptionData[]> {
    const db = adminDb();
    if (!db) return [];

    try {
        const snapshot = await db
            .collection("shops")
            .doc(shopId)
            .collection("pushSubscriptions")
            .get();

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                endpoint: data.endpoint,
                keys: data.keys,
            };
        });
    } catch (error) {
        console.error("[Push Service] Error getting subscriptions:", error);
        return [];
    }
}

/**
 * Send push notification to all subscribed devices for a shop
 */
export async function sendPushToShop(
    shopId: string,
    payload: PushPayload
): Promise<SendResult> {
    const result: SendResult = {
        success: false,
        sent: 0,
        failed: 0,
        errors: [],
    };

    // Check if VAPID is configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        result.errors.push("VAPID keys not configured");
        console.warn("[Push Service] Skipping push - VAPID not configured");
        return result;
    }

    const subscriptions = await getShopSubscriptions(shopId);

    if (subscriptions.length === 0) {
        result.errors.push("No subscriptions found");
        return result;
    }

    console.log(`[Push Service] Sending to ${subscriptions.length} devices for shop ${shopId}`);

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/icon-72.png",
        tag: payload.tag || `linko-${Date.now()}`,
        data: payload.data || {},
        requireInteraction: payload.requireInteraction ?? false,
        actions: payload.actions || [
            { action: "view", title: "Ver" },
            { action: "close", title: "Cerrar" },
        ],
    });

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys,
                },
                notificationPayload
            );
            return { success: true };
        } catch (error: any) {
            console.error(`[Push Service] Error sending to ${sub.endpoint}:`, error.message);

            // Remove invalid subscriptions (410 Gone or 404 Not Found)
            if (error.statusCode === 410 || error.statusCode === 404) {
                await removeInvalidSubscription(shopId, sub.endpoint);
            }

            return { success: false, error: error.message };
        }
    });

    const results = await Promise.all(sendPromises);

    result.sent = results.filter((r) => r.success).length;
    result.failed = results.filter((r) => !r.success).length;
    result.success = result.sent > 0;
    result.errors = results
        .filter((r) => !r.success && r.error)
        .map((r) => r.error as string);

    console.log(`[Push Service] Sent: ${result.sent}, Failed: ${result.failed}`);

    return result;
}

/**
 * Remove an invalid subscription
 */
async function removeInvalidSubscription(shopId: string, endpoint: string): Promise<void> {
    const db = adminDb();
    if (!db) return;

    try {
        const endpointHash = Buffer.from(endpoint)
            .toString("base64")
            .replace(/[/+=]/g, "_")
            .slice(0, 50);

        await db
            .collection("shops")
            .doc(shopId)
            .collection("pushSubscriptions")
            .doc(endpointHash)
            .delete();

        console.log(`[Push Service] Removed invalid subscription for shop ${shopId}`);
    } catch (error) {
        console.error("[Push Service] Error removing invalid subscription:", error);
    }
}

/**
 * Send order notification via push
 */
export async function sendOrderPushNotification(
    shopId: string,
    orderNumber: string,
    customerName: string,
    total: number
): Promise<SendResult> {
    return sendPushToShop(shopId, {
        title: `Nuevo Pedido #${orderNumber}`,
        body: `${customerName} - $${total.toLocaleString()}`,
        icon: "/icons/icon-192.png",
        tag: `order-${orderNumber}`,
        requireInteraction: true,
        data: {
            type: "new_order",
            orderNumber,
            url: "/admin/orders",
        },
    });
}

/**
 * Send booking notification via push
 */
export async function sendBookingPushNotification(
    shopId: string,
    customerName: string,
    serviceName: string,
    date: string,
    time: string
): Promise<SendResult> {
    return sendPushToShop(shopId, {
        title: "Nueva Reservacion",
        body: `${customerName} - ${serviceName} (${date} ${time})`,
        icon: "/icons/icon-192.png",
        tag: `booking-${Date.now()}`,
        requireInteraction: true,
        data: {
            type: "new_booking",
            url: "/admin/bookings",
        },
    });
}

/**
 * Send low stock notification via push
 */
export async function sendLowStockPushNotification(
    shopId: string,
    productName: string,
    currentStock: number
): Promise<SendResult> {
    return sendPushToShop(shopId, {
        title: "Stock Bajo",
        body: `${productName} - Solo quedan ${currentStock} unidades`,
        icon: "/icons/icon-192.png",
        tag: `stock-${productName}`,
        data: {
            type: "low_stock",
            url: "/admin/inventory",
        },
    });
}

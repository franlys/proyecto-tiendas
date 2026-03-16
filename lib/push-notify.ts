/**
 * Server-side push notification utility
 * Uses web-push + VAPID to send background notifications
 * to subscribed PWA devices.
 */

import webpush from "web-push";
import type { Firestore } from "firebase-admin/firestore";

let vapidInitialized = false;

function initVapid() {
    if (vapidInitialized) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@linko.app";

    if (!publicKey || !privateKey) {
        console.warn("[Push] VAPID keys not configured — skipping push setup");
        return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, any>;
}

/**
 * Send a push notification to all subscribed devices for a shop.
 * Silently removes expired/invalid subscriptions.
 */
export async function sendPushToShop(
    db: Firestore,
    shopId: string,
    payload: PushPayload
): Promise<void> {
    initVapid();
    if (!vapidInitialized) return;

    const snap = await db
        .collection("shops")
        .doc(shopId)
        .collection("pushSubscriptions")
        .get();

    if (snap.empty) return;

    const notification = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/icon-72.png",
        tag: payload.tag || "linko",
        data: payload.data || {},
    });

    const expired: string[] = [];

    await Promise.allSettled(
        snap.docs.map(async (doc) => {
            const sub = doc.data();
            if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return;

            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
                    },
                    notification
                );
            } catch (err: any) {
                // 410 Gone = subscription expired/revoked
                if (err.statusCode === 410 || err.statusCode === 404) {
                    expired.push(doc.id);
                } else {
                    console.error("[Push] Send error:", err.message);
                }
            }
        })
    );

    // Clean up expired subscriptions
    for (const id of expired) {
        await db
            .collection("shops")
            .doc(shopId)
            .collection("pushSubscriptions")
            .doc(id)
            .delete()
            .catch(() => {});
    }

    console.log(`[Push] Sent to shop ${shopId}: ${snap.size - expired.length} delivered, ${expired.length} expired removed`);
}

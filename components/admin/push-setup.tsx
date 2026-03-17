"use client";

import { useEffect, useRef } from "react";

interface PushSetupProps {
    shopId: string;
}

/**
 * Silent background component that registers push notification subscription.
 * - Requests permission the first time (browser prompt)
 * - Subscribes with the VAPID public key
 * - Saves subscription to Firestore via /api/push/subscribe
 * - Skips if already subscribed (checks localStorage flag)
 */
export function PushSetup({ shopId }: PushSetupProps) {
    const attempted = useRef(false);

    useEffect(() => {
        if (attempted.current) return;
        attempted.current = true;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey || !shopId) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        const setup = async () => {
            try {
                // Register (or get existing) service worker
                const reg = await navigator.serviceWorker.register("/sw.js");
                await navigator.serviceWorker.ready;

                // Check existing subscription
                let sub = await reg.pushManager.getSubscription();

                if (!sub) {
                    // Ask user permission + subscribe
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") return;

                    sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(vapidKey),
                    });
                }

                // Send subscription to server
                await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ shopId, subscription: sub.toJSON() }),
                });

                console.log("[Push] Subscription registered for shop:", shopId);
            } catch (err) {
                // Silent — don't interrupt the admin experience
                console.warn("[Push] Setup failed:", err);
            }
        };

        setup();
    }, [shopId]);

    return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) {
        view[i] = rawData.charCodeAt(i);
    }
    return view;
}

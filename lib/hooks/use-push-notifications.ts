"use client";

import { useState, useEffect, useCallback } from "react";

interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
    subscription: PushSubscription | null;
}

interface UsePushNotificationsReturn extends PushSubscriptionState {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    registerServiceWorker: () => Promise<ServiceWorkerRegistration | null>;
}

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert base64 URL to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications(shopId?: string | null): UsePushNotificationsReturn {
    const [state, setState] = useState<PushSubscriptionState>({
        isSupported: false,
        isSubscribed: false,
        isLoading: true,
        error: null,
        subscription: null,
    });

    // Check if push is supported
    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window === "undefined") {
                setState((prev) => ({ ...prev, isLoading: false }));
                return;
            }

            const supported =
                "serviceWorker" in navigator &&
                "PushManager" in window &&
                "Notification" in window;

            setState((prev) => ({
                ...prev,
                isSupported: supported,
                isLoading: supported, // Keep loading if supported to check subscription
            }));

            if (supported) {
                await checkSubscription();
            }
        };

        checkSupport();
    }, []);

    // Check existing subscription
    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            setState((prev) => ({
                ...prev,
                isSubscribed: !!subscription,
                subscription,
                isLoading: false,
            }));
        } catch (error) {
            console.error("[Push] Error checking subscription:", error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "Error al verificar suscripcion",
            }));
        }
    }, []);

    // Register service worker
    const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
        if (!("serviceWorker" in navigator)) {
            console.warn("[Push] Service Worker not supported");
            return null;
        }

        try {
            // Register the service worker
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
            });

            console.log("[Push] Service Worker registered:", registration);

            // Wait for it to be ready
            await navigator.serviceWorker.ready;

            return registration;
        } catch (error) {
            console.error("[Push] Service Worker registration failed:", error);
            setState((prev) => ({
                ...prev,
                error: "Error al registrar Service Worker",
            }));
            return null;
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // First, ask for notification permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: "Permiso de notificaciones denegado",
                }));
                return false;
            }

            // Register service worker if not already
            const registration = await registerServiceWorker();
            if (!registration) {
                return false;
            }

            // Check if VAPID key is configured
            if (!VAPID_PUBLIC_KEY) {
                console.warn("[Push] VAPID key not configured, using basic notifications");
                setState((prev) => ({
                    ...prev,
                    isSubscribed: true, // Mark as subscribed for basic notifications
                    isLoading: false,
                }));
                return true;
            }

            // Subscribe to push
            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
            });

            console.log("[Push] Subscription created:", subscription);

            // Save subscription to server
            if (shopId) {
                await saveSubscription(shopId, subscription);
            }

            setState((prev) => ({
                ...prev,
                isSubscribed: true,
                subscription,
                isLoading: false,
            }));

            return true;
        } catch (error) {
            console.error("[Push] Subscription failed:", error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "Error al suscribirse a notificaciones",
            }));
            return false;
        }
    }, [shopId, registerServiceWorker]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();

                // Remove from server
                if (shopId) {
                    await removeSubscription(shopId, subscription);
                }
            }

            setState((prev) => ({
                ...prev,
                isSubscribed: false,
                subscription: null,
                isLoading: false,
            }));

            return true;
        } catch (error) {
            console.error("[Push] Unsubscribe failed:", error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: "Error al cancelar suscripcion",
            }));
            return false;
        }
    }, [shopId]);

    return {
        ...state,
        subscribe,
        unsubscribe,
        registerServiceWorker,
    };
}

// Save subscription to server
async function saveSubscription(shopId: string, subscription: PushSubscription): Promise<void> {
    try {
        await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shopId,
                subscription: subscription.toJSON(),
            }),
        });
    } catch (error) {
        console.error("[Push] Error saving subscription:", error);
    }
}

// Remove subscription from server
async function removeSubscription(shopId: string, subscription: PushSubscription): Promise<void> {
    try {
        await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                shopId,
                endpoint: subscription.endpoint,
            }),
        });
    } catch (error) {
        console.error("[Push] Error removing subscription:", error);
    }
}

// Export for external use
export type { UsePushNotificationsReturn };

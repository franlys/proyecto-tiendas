"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp,
    limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AppNotification {
    id: string;
    type: "new_order" | "order_update" | "new_booking" | "low_stock" | "system";
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    createdAt: Timestamp | string;
}

interface NotificationsContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    playNotificationSound: () => void;
    requestNotificationPermission: () => Promise<boolean>;
    hasNotificationPermission: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Audio for notification sound - using Web Audio API for a pleasant chime
let audioContext: AudioContext | null = null;

// Play a pleasant notification chime using Web Audio API
function playNotificationChime(volume: number = 0.4) {
    if (typeof window === "undefined") return;

    try {
        // Create or reuse AudioContext
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume context if suspended (browser autoplay policy)
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const now = audioContext.currentTime;

        // Create a pleasant two-tone chime
        const frequencies = [880, 1108.73]; // A5 and C#6 - pleasant major third
        const duration = 0.15;

        frequencies.forEach((freq, index) => {
            const oscillator = audioContext!.createOscillator();
            const gainNode = audioContext!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext!.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(freq, now);

            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, now + (index * 0.08));
            gainNode.gain.linearRampToValueAtTime(volume, now + (index * 0.08) + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + (index * 0.08) + duration);

            oscillator.start(now + (index * 0.08));
            oscillator.stop(now + (index * 0.08) + duration + 0.1);
        });
    } catch (err) {
        console.log("Could not play notification sound:", err);
    }
}

export function NotificationsProvider({
    children,
    shopId,
}: {
    children: ReactNode;
    shopId: string | null;
}) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
    const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

    // Check notification permission and register service worker on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check notification permission
        if ("Notification" in window) {
            setHasNotificationPermission(Notification.permission === "granted");
        }

        // Register service worker for push notifications
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js")
                .then((registration) => {
                    console.log("[Notifications] Service Worker registered:", registration.scope);
                })
                .catch((error) => {
                    console.error("[Notifications] Service Worker registration failed:", error);
                });
        }
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        playNotificationChime(0.4);
    }, []);

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return false;
        }

        if (Notification.permission === "granted") {
            setHasNotificationPermission(true);
            return true;
        }

        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            const granted = permission === "granted";
            setHasNotificationPermission(granted);
            return granted;
        }

        return false;
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((notification: AppNotification) => {
        if (!hasNotificationPermission) return;

        try {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: "/icons/icon-192.png",
                badge: "/icons/icon-192.png",
                tag: notification.id,
                requireInteraction: notification.type === "new_order",
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            // Auto close after 10 seconds
            setTimeout(() => browserNotification.close(), 10000);
        } catch (err) {
            console.error("Error showing notification:", err);
        }
    }, [hasNotificationPermission]);

    // Subscribe to Firestore notifications
    useEffect(() => {
        if (!shopId) return;

        const notificationsRef = collection(db, "shops", shopId, "notifications");
        const q = query(
            notificationsRef,
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications: AppNotification[] = [];
            let hasNewUnread = false;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const notification: AppNotification = {
                    id: doc.id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    data: data.data,
                    read: data.read,
                    createdAt: data.createdAt,
                };
                newNotifications.push(notification);

                // Check for new unread notifications
                if (!data.read && doc.id !== lastNotificationId) {
                    hasNewUnread = true;
                }
            });

            setNotifications(newNotifications);

            // Play sound and show browser notification for new unread
            if (hasNewUnread && newNotifications.length > 0) {
                const newest = newNotifications[0];
                if (!newest.read && newest.id !== lastNotificationId) {
                    setLastNotificationId(newest.id);
                    playNotificationSound();
                    showBrowserNotification(newest);
                }
            }
        }, (error) => {
            console.error("Error subscribing to notifications:", error);
        });

        return () => unsubscribe();
    }, [shopId, lastNotificationId, playNotificationSound, showBrowserNotification]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: string) => {
        if (!shopId) return;

        try {
            const notificationRef = doc(db, "shops", shopId, "notifications", id);
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, [shopId]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!shopId) return;

        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(n => {
                    const notificationRef = doc(db, "shops", shopId, "notifications", n.id);
                    return updateDoc(notificationRef, { read: true });
                })
            );
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }, [shopId, notifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                playNotificationSound,
                requestNotificationPermission,
                hasNotificationPermission,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationsProvider");
    }
    return context;
}

// Optional hook for components that may be outside the provider
export function useNotificationsOptional() {
    return useContext(NotificationsContext);
}

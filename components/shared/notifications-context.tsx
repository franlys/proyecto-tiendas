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

// Audio for notification sound
let notificationAudio: HTMLAudioElement | null = null;

// Initialize audio on client side
if (typeof window !== "undefined") {
    // Create audio element with a simple notification sound
    notificationAudio = new Audio();
    // Use a data URI for a simple beep sound (more reliable than external files)
    notificationAudio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGN0s+L/q2hHLFWJ1O/YmXVFPXahy97GhVQnOm6c1fL/uY5dJyhSgcXb5LyPaDoiQW+Vzej/0aZ2Rys+ZY7K4euthlkqKkx6r9Tm/8GcaT4nPGGIxN/vtZNkMChGcJ/N5P7EoG1BJzpdhL/c77+ZazUsQ26cyOL+yKRxRSs6XIC62+/CnG5EKThdgLvY7sKcbkQpOF2Autjuwptu";
    notificationAudio.volume = 0.5;
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

    // Check notification permission on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setHasNotificationPermission(Notification.permission === "granted");
        }
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (notificationAudio) {
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(err => {
                console.log("Could not play notification sound:", err);
            });
        }
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
                icon: "/icon-192.png",
                badge: "/icon-72.png",
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

"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Package, Calendar, AlertTriangle } from "lucide-react";
import { useNotificationsOptional, type AppNotification } from "@/components/shared/notifications-context";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, typeof Package> = {
    new_order: Package,
    order_update: Package,
    new_booking: Calendar,
    low_stock: AlertTriangle,
    system: Bell,
};

const NOTIFICATION_COLORS: Record<string, string> = {
    new_order: "text-green-400 bg-green-400/20",
    order_update: "text-blue-400 bg-blue-400/20",
    new_booking: "text-purple-400 bg-purple-400/20",
    low_stock: "text-amber-400 bg-amber-400/20",
    system: "text-slate-400 bg-slate-400/20",
};

function NotificationItem({
    notification,
    onMarkAsRead,
}: {
    notification: AppNotification;
    onMarkAsRead: (id: string) => void;
}) {
    const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
    const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.system;

    const timeAgo = notification.createdAt
        ? formatDistanceToNow(
            typeof notification.createdAt === "string"
                ? new Date(notification.createdAt)
                : notification.createdAt.toDate(),
            { addSuffix: true, locale: es }
        )
        : "";

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                notification.read
                    ? "bg-white/5 opacity-60"
                    : "bg-white/10 hover:bg-white/15"
            )}
            onClick={() => !notification.read && onMarkAsRead(notification.id)}
        >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", notification.read ? "text-slate-400" : "text-white")}>
                    {notification.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{notification.message}</p>
                <p className="text-xs text-slate-600 mt-1">{timeAgo}</p>
            </div>
            {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
            )}
        </div>
    );
}

export function NotificationBell() {
    const notifications = useNotificationsOptional();
    const [isOpen, setIsOpen] = useState(false);
    const [permissionAsked, setPermissionAsked] = useState(false);

    // If notifications context is not available, don't render
    if (!notifications) {
        return null;
    }

    const {
        notifications: notificationsList,
        unreadCount,
        markAsRead,
        markAllAsRead,
        requestNotificationPermission,
        hasNotificationPermission,
    } = notifications;

    const handleRequestPermission = async () => {
        await requestNotificationPermission();
        setPermissionAsked(true);
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-lg transition-colors",
                    isOpen ? "bg-white/10" : "hover:bg-white/10"
                )}
            >
                <Bell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-surface border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-white font-semibold">Notificaciones</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Marcar todas
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-white/10 rounded"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Permission Request */}
                        {!hasNotificationPermission && !permissionAsked && (
                            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
                                <p className="text-sm text-slate-300 mb-2">
                                    Activa las notificaciones para recibir alertas de nuevos pedidos
                                </p>
                                <button
                                    onClick={handleRequestPermission}
                                    className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                                >
                                    Activar notificaciones
                                </button>
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="overflow-y-auto max-h-[50vh]">
                            {notificationsList.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No hay notificaciones</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notificationsList.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkAsRead={markAsRead}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

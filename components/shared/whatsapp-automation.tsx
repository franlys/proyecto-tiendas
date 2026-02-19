"use client";

import { useState, useEffect, useCallback } from "react";
import {
    MessageCircle,
    Wifi,
    WifiOff,
    QrCode,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Settings,
    Bot,
    Users,
    Loader2,
    Smartphone,
    Link as LinkIcon,
    Clock,
    X,
    Trash2,
    RotateCcw,
    Activity,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type ConnectionStatus = "disconnected" | "connecting" | "scanning" | "connected" | "error";

interface WhatsAppProfile {
    name: string;
    phone: string;
    picture?: string;
}

// Hook logic moved here
// Helper to ensure consistency with backend (lib/evolution.ts)
const getInstanceNameFromSlug = (slug: string) => `shop_${slug.replace(/-/g, "_")}_v3`;

export function useWhatsAppConnection(shopSlug: string) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [profile, setProfile] = useState<WhatsAppProfile | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string>("");

    useEffect(() => {
        if (shopSlug) {
            setInstanceName(getInstanceNameFromSlug(shopSlug));
        }
    }, [shopSlug]);

    const checkStatus = useCallback(async () => {
        if (!instanceName) return;

        try {
            const res = await fetch(`/api/whatsapp/status?instanceName=${instanceName}`);
            const data = await res.json();

            setIsConfigured(data.configured);

            if (data.connected) {
                setStatus("connected");
                setProfile({
                    name: data.profile?.name || shopSlug,
                    phone: data.profile?.phone || "",
                    picture: data.profile?.picture,
                });
            } else if (data.exists) {
                setStatus("disconnected");
            } else {
                setStatus("disconnected");
            }
        } catch {
            setIsConfigured(false);
            setStatus("disconnected");
        }
    }, [instanceName, shopSlug]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    const connect = async () => {
        setStatus("connecting");
        setError(null);
        setQrCode(null);

        try {
            const createRes = await fetch("/api/whatsapp/instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopSlug, // Required by backend to use consistent naming
                    instanceName,
                    qrcode: true,
                    integration: "WHATSAPP-BAILEYS",
                }),
            });

            const createData = await createRes.json();

            if (createRes.status === 403 || createData.error?.includes("already")) {
                await getQRCode();
                return;
            }

            if (createData.qrcode?.base64) {
                setQrCode(createData.qrcode.base64);
                setStatus("scanning");
                startPolling();
                return;
            }

            await getQRCode();
        } catch (err) {
            console.error("Error connecting:", err);
            setError("Error al conectar. Verifica la configuración de Evolution API.");
            setStatus("error");
        }
    };

    const getQRCode = async () => {
        try {
            const res = await fetch(`/api/whatsapp/connect?instanceName=${instanceName}`);
            const data = await res.json();

            if (data.base64 || data.qrcode?.base64) {
                setQrCode(data.base64 || data.qrcode.base64);
                setStatus("scanning");
                startPolling();
            } else if (data.instance?.state === "open" || data.state === "open") {
                setStatus("connected");
                await checkStatus();
            } else {
                setError("No se pudo obtener el código QR");
                setStatus("error");
            }
        } catch (err) {
            console.error("Error getting QR:", err);
            setError("Error al obtener código QR");
            setStatus("error");
        }
    };

    const startPolling = () => {
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes

        const interval = setInterval(async () => {
            attempts++;

            if (attempts > maxAttempts) {
                clearInterval(interval);
                setError("Tiempo de espera agotado. Intenta de nuevo.");
                setStatus("disconnected");
                return;
            }

            try {
                const res = await fetch(`/api/whatsapp/connect?instanceName=${instanceName}`);
                const data = await res.json();

                if (data.base64 || data.qrcode?.base64) {
                    setQrCode(data.base64 || data.qrcode.base64);
                }

                if (data.instance?.state === "open" || data.state === "open") {
                    clearInterval(interval);
                    setStatus("connected");
                    setQrCode(null);
                    await checkStatus();
                }
            } catch {
                // Ignore polling errors
            }
        }, 3000);

        return () => clearInterval(interval);
    };

    const disconnect = async () => {
        try {
            await fetch(`/api/whatsapp/instances?instanceName=${instanceName}`, {
                method: "DELETE",
            });
            setStatus("disconnected");
            setQrCode(null);
            setProfile(null);
        } catch (err) {
            console.error("Error disconnecting:", err);
            setError("Error al desconectar");
        }
    };

    const refreshQR = async () => {
        setQrCode(null);
        await getQRCode();
    };

    const forceWebhookUpdate = async () => {
        try {
            // Re-use connect endpoint which enforces webhook
            const res = await fetch(`/api/whatsapp/connect?instanceName=${instanceName}&forceWebhook=true`);
            const data = await res.json();
            if (data.webhook) {
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error forcing webhook:", err);
            return false;
        }
    };

    return {
        status,
        qrCode,
        profile,
        isConfigured,
        error,
        instanceName,
        connect,
        disconnect,
        refreshQR,
        checkStatus,
        forceWebhookUpdate,
    };
}

import { useShops } from "@/components/shared";
import {
    Calendar,
    ShoppingBag,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Bell,
    Phone,
    Plus,
    UserPlus,
} from "lucide-react";

// Staff phone interface
interface StaffNotificationPhone {
    id: string;
    phone: string;
    name: string;
    enabled: boolean;
    role?: string;
}

// Interface matching the server-side WhatsAppAutoReplyConfig
interface WhatsAppAutoReplyConfig {
    enabled: boolean;
    welcomeMessage: string;
    offlineMessage?: string;
    showCatalogOption: boolean;
    showBookingOption: boolean;
    showQuestionOption: boolean;
    catalogOptionText: string;
    bookingOptionText: string;
    questionOptionText: string;
    businessHoursEnabled: boolean;
    businessHoursStart: string;
    businessHoursEnd: string;
    timezone: string;
    cooldownMinutes: number;
    ownerNotificationPhone?: string;
    notifyOwnerOnOrder?: boolean;
    staffNotificationPhones?: StaffNotificationPhone[];
}

interface ShopInfo {
    id: string;
    slug: string;
    name: string;
    businessType: string;
}

function AutoReplyConfig({ shopSlug }: { shopSlug: string }) {
    const { getShop } = useShops();
    const shop = getShop(shopSlug);

    const [config, setConfig] = useState<WhatsAppAutoReplyConfig>({
        enabled: true,
        welcomeMessage: "Gracias por contactarnos.\n\n¿En qué podemos ayudarte?",
        offlineMessage: "Gracias por tu mensaje. En este momento estamos fuera de horario, te responderemos pronto.",
        showCatalogOption: true,
        showBookingOption: false,
        showQuestionOption: true,
        catalogOptionText: "📋 *CATÁLOGO* - Ver productos",
        bookingOptionText: "📅 *CITA* - Agendar una cita",
        questionOptionText: "❓ *PREGUNTA* - Escribe tu consulta",
        businessHoursEnabled: false,
        businessHoursStart: "09:00",
        businessHoursEnd: "18:00",
        timezone: "America/Santo_Domingo",
        cooldownMinutes: 0, // Default: responder siempre
        ownerNotificationPhone: "",
        notifyOwnerOnOrder: true,
        staffNotificationPhones: [],
    });
    const [newStaffName, setNewStaffName] = useState("");
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Load config from API
    useEffect(() => {
        if (!shop?.id && !shopSlug) return;

        const loadConfig = async () => {
            setLoadingConfig(true);
            try {
                const res = await fetch(`/api/shops/${shop?.slug || shopSlug}/whatsapp-config`);
                const data = await res.json();

                if (data.success && data.config) {
                    setConfig(data.config);
                }
                if (data.shop) {
                    setShopInfo(data.shop);
                }
            } catch (error) {
                console.error("Error loading WhatsApp config:", error);
            } finally {
                setLoadingConfig(false);
            }
        };

        loadConfig();
    }, [shop?.id, shop?.slug, shopSlug]);

    const handleSave = async () => {
        if (!shop?.slug && !shopSlug) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/shops/${shop?.slug || shopSlug}/whatsapp-config`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error("Error saving WhatsApp config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Determine if shop is service-based (to suggest booking option)
    const isServiceBusiness = shopInfo?.businessType &&
        ["beauty", "repair", "health", "education", "services"].includes(shopInfo.businessType);

    // Staff management functions
    const addStaffPhone = () => {
        if (!newStaffName.trim() || !newStaffPhone.trim()) return;

        const newStaff: StaffNotificationPhone = {
            id: `staff-${Date.now()}`,
            name: newStaffName.trim(),
            phone: newStaffPhone.replace(/\D/g, ""),
            enabled: true,
        };

        setConfig({
            ...config,
            staffNotificationPhones: [...(config.staffNotificationPhones || []), newStaff],
        });
        setNewStaffName("");
        setNewStaffPhone("");
    };

    const removeStaffPhone = (id: string) => {
        setConfig({
            ...config,
            staffNotificationPhones: (config.staffNotificationPhones || []).filter(s => s.id !== id),
        });
    };

    const toggleStaffPhone = (id: string) => {
        setConfig({
            ...config,
            staffNotificationPhones: (config.staffNotificationPhones || []).map(s =>
                s.id === id ? { ...s, enabled: !s.enabled } : s
            ),
        });
    };

    if (loadingConfig) {
        return (
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    <span className="ml-2 text-slate-400">Cargando configuración...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Auto-Respuesta</h2>
                        <p className="text-sm text-slate-400">
                            {shopInfo?.businessType ? `Tipo: ${shopInfo.businessType}` : "Mensaje automático"}
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            <div className={cn("space-y-4", !config.enabled && "opacity-50 pointer-events-none")}>
                {/* Welcome Message */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mensaje de Bienvenida
                    </label>
                    <textarea
                        rows={3}
                        value={config.welcomeMessage}
                        onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        placeholder="Escribe tu mensaje de bienvenida..."
                    />
                </div>

                {/* Menu Options */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                        Opciones del Menú
                    </label>
                    <div className="space-y-3">
                        {/* Catalog Option */}
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showCatalogOption}
                                    onChange={(e) => setConfig({ ...config, showCatalogOption: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                                />
                                <ShoppingBag className="w-4 h-4 text-blue-400" />
                                <span className="text-white text-sm flex-1">Ver Catálogo</span>
                            </label>
                            {config.showCatalogOption && (
                                <input
                                    type="text"
                                    value={config.catalogOptionText}
                                    onChange={(e) => setConfig({ ...config, catalogOptionText: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="Texto del botón..."
                                />
                            )}
                        </div>

                        {/* Booking Option */}
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showBookingOption}
                                    onChange={(e) => setConfig({ ...config, showBookingOption: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                                />
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span className="text-white text-sm flex-1">Agendar Cita</span>
                                {!isServiceBusiness && config.showBookingOption && (
                                    <span className="text-xs text-amber-400">⚠️ No es negocio de servicios</span>
                                )}
                            </label>
                            {config.showBookingOption && (
                                <input
                                    type="text"
                                    value={config.bookingOptionText}
                                    onChange={(e) => setConfig({ ...config, bookingOptionText: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="Texto del botón..."
                                />
                            )}
                        </div>

                        {/* Question Option */}
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.showQuestionOption}
                                    onChange={(e) => setConfig({ ...config, showQuestionOption: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                                />
                                <HelpCircle className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm flex-1">Hacer Pregunta</span>
                            </label>
                            {config.showQuestionOption && (
                                <input
                                    type="text"
                                    value={config.questionOptionText}
                                    onChange={(e) => setConfig({ ...config, questionOptionText: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="Texto del botón..."
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
                >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>Opciones avanzadas</span>
                </button>

                {showAdvanced && (
                    <div className="space-y-4 pt-2">
                        {/* Business Hours */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    checked={config.businessHoursEnabled}
                                    onChange={(e) => setConfig({ ...config, businessHoursEnabled: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                                />
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span className="text-white text-sm">Solo en horario de atención</span>
                            </label>

                            {config.businessHoursEnabled && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Hora inicio</label>
                                            <input
                                                type="time"
                                                value={config.businessHoursStart}
                                                onChange={(e) => setConfig({ ...config, businessHoursStart: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Hora fin</label>
                                            <input
                                                type="time"
                                                value={config.businessHoursEnd}
                                                onChange={(e) => setConfig({ ...config, businessHoursEnd: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Mensaje fuera de horario</label>
                                        <textarea
                                            rows={2}
                                            value={config.offlineMessage || ""}
                                            onChange={(e) => setConfig({ ...config, offlineMessage: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                                            placeholder="Mensaje cuando estés fuera de horario..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Owner Notifications */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    checked={config.notifyOwnerOnOrder ?? true}
                                    onChange={(e) => setConfig({ ...config, notifyOwnerOnOrder: e.target.checked })}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                                />
                                <Bell className="w-4 h-4 text-green-400" />
                                <span className="text-white text-sm">Notificar pedidos por WhatsApp</span>
                            </label>

                            {config.notifyOwnerOnOrder && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">
                                            <Phone className="w-3 h-3 inline mr-1" />
                                            Teléfono personal del dueño
                                        </label>
                                        <input
                                            type="tel"
                                            value={config.ownerNotificationPhone || ""}
                                            onChange={(e) => setConfig({ ...config, ownerNotificationPhone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                                            placeholder="Ej: 8091234567"
                                        />
                                    </div>

                                    {/* Staff Phones List */}
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">
                                            <UserPlus className="w-3 h-3 inline mr-1" />
                                            Empleados para notificar (opcional)
                                        </label>

                                        {/* Existing staff */}
                                        {(config.staffNotificationPhones || []).length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {config.staffNotificationPhones!.map((staff) => (
                                                    <div
                                                        key={staff.id}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-lg border",
                                                            staff.enabled
                                                                ? "bg-green-500/10 border-green-500/20"
                                                                : "bg-white/5 border-white/10 opacity-50"
                                                        )}
                                                    >
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={staff.enabled}
                                                                onChange={() => toggleStaffPhone(staff.id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                                                        </label>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white truncate">{staff.name}</p>
                                                            <p className="text-xs text-slate-400">{staff.phone}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeStaffPhone(staff.id)}
                                                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add new staff */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newStaffName}
                                                onChange={(e) => setNewStaffName(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                placeholder="Nombre"
                                            />
                                            <input
                                                type="tel"
                                                value={newStaffPhone}
                                                onChange={(e) => setNewStaffPhone(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                                                placeholder="Teléfono"
                                            />
                                            <button
                                                onClick={addStaffPhone}
                                                disabled={!newStaffName.trim() || !newStaffPhone.trim()}
                                                className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            Todos los teléfonos activos recibirán notificaciones de pedidos
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cooldown */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <label className="block text-sm text-slate-300 mb-2">
                                Tiempo entre mensajes automáticos
                            </label>
                            <select
                                value={config.cooldownMinutes}
                                onChange={(e) => setConfig({ ...config, cooldownMinutes: Number(e.target.value) })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value={0}>🔄 Sin cooldown (responder siempre)</option>
                                <option value={1}>1 minuto</option>
                                <option value={5}>5 minutos</option>
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={60}>1 hora</option>
                                <option value={120}>2 horas</option>
                                <option value={1440}>24 horas</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                                {config.cooldownMinutes === 0
                                    ? "⚠️ Responderá a cada mensaje (puede ser spam)"
                                    : "Evita enviar múltiples mensajes automáticos al mismo contacto"}
                            </p>
                        </div>
                    </div>
                )}

                <Button onClick={handleSave} disabled={isLoading} className="w-full">
                    {saved ? (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Guardado
                        </>
                    ) : isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Settings className="w-4 h-4 mr-2" />
                            Guardar Configuración
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function QRModal({
    isOpen,
    onClose,
    qrCode,
    status,
    onRefresh,
    instanceName,
}: {
    isOpen: boolean;
    onClose: () => void;
    qrCode: string | null;
    status: ConnectionStatus;
    onRefresh: () => void;
    instanceName: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Conectar WhatsApp</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="text-center">
                    {status === "connecting" && (
                        <div className="py-12">
                            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-300">Generando código QR...</p>
                        </div>
                    )}

                    {status === "scanning" && qrCode && (
                        <>
                            <div className="bg-white p-4 rounded-xl inline-block mb-4">
                                {qrCode.startsWith("data:") ? (
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                ) : (
                                    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <p className="text-slate-300 text-sm">
                                    Abre WhatsApp en tu teléfono:
                                </p>
                                <ol className="text-left text-sm text-slate-400 space-y-2 pl-4">
                                    <li>1. Ve a <strong className="text-white">Ajustes</strong></li>
                                    <li>2. Toca <strong className="text-white">Dispositivos vinculados</strong></li>
                                    <li>3. Toca <strong className="text-white">Vincular dispositivo</strong></li>
                                    <li>4. Escanea este código QR</li>
                                </ol>
                                <div className="flex items-center justify-center gap-2 text-green-400 animate-pulse mt-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">Esperando escaneo...</span>
                                </div>
                                <button
                                    onClick={onRefresh}
                                    className="mt-4 flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Refrescar QR
                                </button>
                            </div>
                        </>
                    )}

                    {status === "connected" && (
                        <div className="py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <p className="text-white text-lg font-semibold">¡Conectado!</p>
                            <p className="text-slate-400 text-sm mt-2">WhatsApp vinculado correctamente</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="py-8">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-white text-lg font-semibold">Error de conexión</p>
                            <p className="text-slate-400 text-sm mt-2">No se pudo conectar. Intenta de nuevo.</p>
                            <Button onClick={onRefresh} className="mt-4">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reintentar
                            </Button>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-500 text-center mt-6">
                    Instancia: {instanceName}
                </p>
            </div>
        </div>
    );
}

function NotificationRouting() {
    return (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Enrutamiento de Notificaciones</h2>
                    <p className="text-sm text-slate-400">Configura quién recibe cada tipo de alerta</p>
                </div>
            </div>

            <div className="space-y-4">
                {[
                    { label: "Nuevos Pedidos", desc: "Notificar a almacén", icon: "📦" },
                    { label: "Stock Bajo", desc: "Alertar a inventario", icon: "⚠️" },
                    { label: "Consultas", desc: "Asignar a vendedor disponible", icon: "💬" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div>
                                <p className="text-white text-sm font-medium">{item.label}</p>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                        <select className="px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50 [&>option]:bg-slate-800 [&>option]:text-white">
                            <option>Automático</option>
                            <option>Manual</option>
                            <option>Desactivado</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function WhatsAppAutomationPanel({
    shopSlug,
    title = "Automatización WhatsApp",
    subtitle = "Conecta y configura tu bot de WhatsApp"
}: {
    shopSlug: string;
    title?: string;
    subtitle?: string;
}) {
    const [showQRModal, setShowQRModal] = useState(false);
    const [apiStatus, setApiStatus] = useState<"checking" | "configured" | "not_configured">("checking");

    const {
        status,
        qrCode,
        profile,
        isConfigured,
        error,
        instanceName,
        connect,
        disconnect,
        refreshQR,
        checkStatus,
        forceWebhookUpdate,
    } = useWhatsAppConnection(shopSlug);

    // Check if Evolution API is configured on mount
    useEffect(() => {
        const checkApiConfig = async () => {
            try {
                const res = await fetch("/api/whatsapp/status?instanceName=test");
                if (res.status === 503) {
                    setApiStatus("not_configured");
                } else {
                    setApiStatus("configured");
                }
            } catch {
                setApiStatus("not_configured");
            }
        };
        checkApiConfig();
    }, []);

    const handleConnect = () => {
        setShowQRModal(true);
        connect();
    };

    const handleDisconnect = async () => {
        if (confirm("¿Desconectar WhatsApp? Tendrás que escanear el QR de nuevo.")) {
            await disconnect();
        }
    };

    // Show setup guide if API is not configured
    if (apiStatus === "not_configured") {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Configuración Requerida</h2>
                            <p className="text-slate-400 text-sm">
                                Para habilitar WhatsApp, necesitas configurar Evolution API.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">1</span>
                                Instalar Evolution API
                            </h3>
                            <p className="text-sm text-slate-400 mb-2">
                                Evolution API es un servidor que maneja sesiones de WhatsApp. Instálalo con Docker:
                            </p>
                            <code className="block p-3 rounded-lg bg-black/50 text-xs text-green-400 font-mono overflow-x-auto">
                                docker run -d --name evolution -p 8080:8080 atendai/evolution-api
                            </code>
                            <a
                                href="https://doc.evolution-api.com/v2/pt/get-started/introduction"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:underline mt-2 inline-block"
                            >
                                📖 Ver documentación completa
                            </a>
                        </div>

                        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">2</span>
                                Configurar Variables de Entorno
                            </h3>
                            <p className="text-sm text-slate-400 mb-2">
                                Agrega en Vercel → Settings → Environment Variables:
                            </p>
                            <div className="space-y-2">
                                <code className="block p-2 rounded bg-black/50 text-xs text-slate-300 font-mono">
                                    EVOLUTION_API_URL=https://tu-servidor.com
                                </code>
                                <code className="block p-2 rounded bg-black/50 text-xs text-slate-300 font-mono">
                                    EVOLUTION_API_KEY=tu-api-key
                                </code>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center">3</span>
                                Alternativas de Hosting
                            </h3>
                            <ul className="text-sm text-slate-400 space-y-1">
                                <li>• <strong className="text-white">Railway.app</strong> - Deploy gratis con Docker</li>
                                <li>• <strong className="text-white">Render.com</strong> - Tier gratuito disponible</li>
                                <li>• <strong className="text-white">VPS</strong> - $5/mes en Digital Ocean o Hetzner</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <p className="text-sm text-slate-300">
                            Una vez configurado, podrás conectar WhatsApp escaneando un código QR.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (apiStatus === "checking") {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="glass-panel rounded-2xl p-8 border border-white/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="ml-3 text-slate-400">Verificando configuración...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Connection Panel */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            status === "connected"
                                ? "bg-green-500/20"
                                : "bg-white/10"
                        )}>
                            {status === "connected" ? (
                                <Wifi className="w-5 h-5 text-green-400" />
                            ) : (
                                <WifiOff className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Estado de Conexión</h2>
                            <p className="text-sm text-slate-400">
                                {status === "connected" ? "WhatsApp conectado" : "Sin conexión"}
                            </p>
                        </div>
                    </div>

                    {/* Status Display */}
                    <div className="space-y-4">
                        {status === "connected" && profile ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center overflow-hidden">
                                    {profile.picture ? (
                                        <img src={profile.picture} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Smartphone className="w-6 h-6 text-green-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{profile.name}</p>
                                    <p className="text-sm text-green-400">{profile.phone || "Conectado"}</p>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                    <QrCode className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">No conectado</p>
                                    <p className="text-sm text-slate-400">Escanea el código QR para vincular</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {status === "connected" ? (
                                <>
                                    <Button
                                        onClick={checkStatus}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Actualizar
                                    </Button>
                                    <Button
                                        onClick={handleDisconnect}
                                        variant="outline"
                                        className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Desconectar
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleConnect}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Conectar WhatsApp
                                </Button>
                            )}
                        </div>

                        {/* Instance Info */}
                        <p className="text-xs text-slate-500 text-center">
                            Instancia: {instanceName || "No configurada"}
                        </p>
                    </div>
                </div>

                {/* Auto-Reply Config */}
                <AutoReplyConfig shopSlug={shopSlug} />
            </div>

            {/* Notification Routing */}
            <div className="mt-6">
                <NotificationRouting />
            </div>

            {/* Help Section */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <h3 className="text-lg font-semibold text-white mb-3">
                    💡 ¿Cómo funciona?
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">1.</span>
                        Conecta tu WhatsApp Business escaneando el código QR
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">2.</span>
                        Configura el mensaje automático de bienvenida
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">3.</span>
                        Los clientes recibirán respuestas automáticas al escribirte
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-400">4.</span>
                        Las notificaciones de pedidos y citas se envían automáticamente
                    </li>
                </ul>
            </div>

            {/* Diagnostics Section */}
            <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-400" />
                    Diagnóstico
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-white font-medium">Estado del Webhook</p>
                        <p className="text-xs text-slate-400">
                            Si no recibes respuestas automáticas, intenta forzar la actualización del webhook.
                        </p>
                    </div>
                    <Button
                        onClick={async () => {
                            const success = await forceWebhookUpdate();
                            if (success) {
                                alert("Webhook actualizado correctamente");
                            } else {
                                alert("Error al actualizar webhook");
                            }
                        }}
                        variant="outline"
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Forzar Actualización
                    </Button>
                </div>
            </div>

            <QRModal
                isOpen={showQRModal}
                onClose={() => {
                    setShowQRModal(false);
                    if (status === "connected") {
                        checkStatus();
                    }
                }}
                qrCode={qrCode}
                status={status}
                onRefresh={refreshQR}
                instanceName={instanceName}
            />
        </div>
    );
}

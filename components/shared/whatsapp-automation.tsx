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
export function useWhatsAppConnection(shopSlug: string) {
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [profile, setProfile] = useState<WhatsAppProfile | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string>("");

    useEffect(() => {
        if (shopSlug) {
            setInstanceName(`shop_${shopSlug.replace(/-/g, "_")}`);
        }
    }, [shopSlug]);

    const checkStatus = useCallback(async () => {
        if (!instanceName) return;

        try {
            const res = await fetch(`/api/whatsapp/status?instance=${instanceName}`);
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
            const res = await fetch(`/api/whatsapp/connect?instance=${instanceName}`);
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
                const res = await fetch(`/api/whatsapp/connect?instance=${instanceName}`);
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
            await fetch(`/api/whatsapp/instances?instance=${instanceName}`, {
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
    };
}

import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useShops } from "@/components/shared";

// ... existing imports ...

// Connection Status and Hook (useWhatsAppConnection) remains the same ...

// Components Logic

interface AutoReplySettings {
    enabled: boolean;
    welcomeMessage: string;
    includeShopLink: boolean;
    alwaysSendWelcome: boolean;
    businessHoursOnly: boolean;
    startHour: string;
    endHour: string;
}

function AutoReplyConfig({ shopSlug }: { shopSlug: string }) {
    const { getShop } = useShops();
    // Resolve shop to get the real ID (slug might be passed)
    const shop = getShop(shopSlug);

    const [settings, setSettings] = useState<AutoReplySettings>({
        enabled: true,
        welcomeMessage: "¡Hola! 👋 Gracias por contactarnos.\n\nVisita nuestra tienda para ver todos nuestros productos y servicios.",
        includeShopLink: true,
        alwaysSendWelcome: true,
        businessHoursOnly: false,
        startHour: "09:00",
        endHour: "18:00",
    });
    const [saved, setSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load from Firestore
    useEffect(() => {
        if (!shop?.id) return;

        const loadSettings = async () => {
            try {
                const shopRef = doc(db, "shops", shop.id);
                const snap = await getDoc(shopRef);

                if (snap.exists()) {
                    const data = snap.data();
                    if (data.whatsappConfig) {
                        setSettings(prev => ({
                            ...prev,
                            ...data.whatsappConfig
                        }));
                    }
                }
            } catch (error) {
                console.error("Error loading WhatsApp config:", error);
            }
        };

        loadSettings();
    }, [shop?.id]);

    const handleSave = async () => {
        if (!shop?.id) return;

        setIsLoading(true);
        try {
            const shopRef = doc(db, "shops", shop.id);
            // Save to a specific field 'whatsappConfig'
            await setDoc(shopRef, {
                whatsappConfig: settings
            }, { merge: true });

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving WhatsApp config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Auto-Respuesta</h2>
                        <p className="text-sm text-slate-400">Mensaje automático para nuevos contactos</p>
                    </div>
                </div>
                {/* Checkbox for Enable/Disable */}
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            <div className={cn("space-y-4", !settings.enabled && "opacity-50 pointer-events-none")}>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mensaje de Bienvenida
                    </label>
                    <textarea
                        rows={4}
                        value={settings.welcomeMessage}
                        onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                        placeholder="Escribe tu mensaje de bienvenida..."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Tip: Usa emojis para hacer el mensaje más amigable 👋
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.includeShopLink}
                            onChange={(e) => setSettings({ ...settings, includeShopLink: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                        />
                        <div className="flex-1">
                            <p className="text-white text-sm">Incluir link de la tienda</p>
                            <p className="text-xs text-slate-500">Agrega automáticamente el link a tu tienda</p>
                        </div>
                        <LinkIcon className="w-4 h-4 text-slate-400" />
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.alwaysSendWelcome}
                            onChange={(e) => setSettings({ ...settings, alwaysSendWelcome: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                        />
                        <div className="flex-1">
                            <p className="text-white text-sm">Responder siempre (Modo Portal)</p>
                            <p className="text-xs text-slate-500">Envía el mensaje en cada interacción</p>
                        </div>
                        <RotateCcw className="w-4 h-4 text-slate-400" />
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.businessHoursOnly}
                            onChange={(e) => setSettings({ ...settings, businessHoursOnly: e.target.checked })}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                        />
                        <div className="flex-1">
                            <p className="text-white text-sm">Solo en horario de atención</p>
                            <p className="text-xs text-slate-500">Responder solo durante horas laborales</p>
                        </div>
                        <Clock className="w-4 h-4 text-slate-400" />
                    </label>
                </div>

                {settings.businessHoursOnly && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Hora inicio</label>
                            <input
                                type="time"
                                value={settings.startHour}
                                onChange={(e) => setSettings({ ...settings, startHour: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Hora fin</label>
                            <input
                                type="time"
                                value={settings.endHour}
                                onChange={(e) => setSettings({ ...settings, endHour: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                            />
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
                        <select className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500/50">
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
    } = useWhatsAppConnection(shopSlug);

    const handleConnect = () => {
        setShowQRModal(true);
        connect();
    };

    const handleDisconnect = async () => {
        if (confirm("¿Desconectar WhatsApp? Tendrás que escanear el QR de nuevo.")) {
            await disconnect();
        }
    };

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

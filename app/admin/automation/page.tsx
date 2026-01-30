"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Bot,
  Send,
  Users,
  Loader2,
  Smartphone,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/shared";
import { AccessDenied } from "@/components/admin/access-denied";
import { cn } from "@/lib/utils";

type ConnectionStatus = "disconnected" | "connecting" | "scanning" | "connected";

// Simulated state for demo (will use real Evolution API when configured)
function useWhatsAppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; phone: string; picture: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check if Evolution API is configured
  useEffect(() => {
    // In real implementation, this would check the server
    const checkConfig = async () => {
      try {
        const res = await fetch("/api/whatsapp/status");
        if (res.ok) {
          const data = await res.json();
          setIsConfigured(data.configured);
          if (data.connected) {
            setStatus("connected");
            setProfile(data.profile);
          }
        }
      } catch {
        // API not available yet - demo mode
        setIsConfigured(false);
      }
    };
    checkConfig();
  }, []);

  const connect = async () => {
    setStatus("connecting");

    // Demo: Simulate QR generation
    setTimeout(() => {
      setStatus("scanning");
      // This would be a real base64 QR from Evolution API
      setQrCode("demo-qr-placeholder");
    }, 1500);
  };

  const disconnect = async () => {
    setStatus("disconnected");
    setQrCode(null);
    setProfile(null);
  };

  // Demo: Simulate successful scan
  const simulateConnect = () => {
    setStatus("connected");
    setQrCode(null);
    setProfile({
      name: "Mi Negocio",
      phone: "+52 55 1234 5678",
      picture: "https://ui-avatars.com/api/?name=Mi+Negocio&background=25D366&color=fff",
    });
  };

  return { status, qrCode, profile, isConfigured, connect, disconnect, simulateConnect };
}

// Auto-Reply Configuration
interface AutoReplySettings {
  enabled: boolean;
  welcomeMessage: string;
  includeShopLink: boolean;
  businessHoursOnly: boolean;
  startHour: string;
  endHour: string;
}

function AutoReplyConfig() {
  const [settings, setSettings] = useState<AutoReplySettings>({
    enabled: true,
    welcomeMessage: "¡Hola! 👋 Gracias por contactarnos.\n\nVisita nuestra tienda para ver todos nuestros productos y servicios.",
    includeShopLink: true,
    businessHoursOnly: false,
    startHour: "09:00",
    endHour: "18:00",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage for demo
    localStorage.setItem("autoReplySettings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        {/* Welcome Message */}
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

        {/* Options */}
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

        {/* Business Hours */}
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

        <Button onClick={handleSave} className="w-full">
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardado
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

export default function AutomationPage() {
  const { canConfigureWhatsApp, isLoading: authLoading } = useAuth();
  const { status, qrCode, profile, isConfigured, connect, disconnect, simulateConnect } = useWhatsAppConnection();

  // Only SUPER_ADMIN can configure WhatsApp
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!canConfigureWhatsApp) {
    return (
      <AccessDenied
        title="Configuración de WhatsApp"
        message="La configuración de WhatsApp Business es gestionada por tu asesor digital. Contacta con el equipo de soporte para solicitar cambios en la automatización."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Automatización WhatsApp
                </h1>
                <p className="text-slate-400 text-sm">
                  Conecta y configura tu bot de WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                <p className={cn(
                  "text-sm",
                  status === "connected" ? "text-green-400" : "text-slate-400"
                )}>
                  {status === "disconnected" && "Desconectado"}
                  {status === "connecting" && "Conectando..."}
                  {status === "scanning" && "Esperando escaneo..."}
                  {status === "connected" && "Conectado"}
                </p>
              </div>
            </div>

            {/* Not Configured Warning */}
            {!isConfigured && status === "disconnected" && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium text-sm">
                      Evolution API no configurada
                    </p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      Configura EVOLUTION_API_URL y EVOLUTION_API_KEY en tu archivo .env para habilitar la conexión real.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Disconnected State */}
            {status === "disconnected" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-6">
                  Conecta tu WhatsApp Business para activar el bot automático
                </p>
                <Button onClick={connect} className="bg-green-500 hover:bg-green-600">
                  <QrCode className="w-4 h-4 mr-2" />
                  Generar Código QR
                </Button>
              </div>
            )}

            {/* Connecting State */}
            {status === "connecting" && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Generando código QR...</p>
              </div>
            )}

            {/* QR Code State */}
            {status === "scanning" && qrCode && (
              <div className="text-center">
                <div className="w-64 h-64 mx-auto mb-4 rounded-2xl bg-white p-4 flex items-center justify-center">
                  {/* In real implementation, this would show the actual QR */}
                  <div className="text-center">
                    <QrCode className="w-32 h-32 text-slate-800 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Demo Mode</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  Abre WhatsApp en tu teléfono y escanea este código
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={connect}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar
                  </Button>
                  {/* Demo button - remove in production */}
                  <Button size="sm" onClick={simulateConnect} className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Simular Conexión
                  </Button>
                </div>
              </div>
            )}

            {/* Connected State */}
            {status === "connected" && profile && (
              <div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
                  <img
                    src={profile.picture}
                    alt={profile.name}
                    className="w-14 h-14 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{profile.name}</p>
                    <p className="text-green-400 text-sm">{profile.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-400">Mensajes hoy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-400">Contactos nuevos</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-slate-400">Auto-respuestas</p>
                  </div>
                </div>

                <Button variant="outline" onClick={disconnect} className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Desconectar WhatsApp
                </Button>
              </div>
            )}
          </div>

          {/* Auto-Reply Configuration */}
          <AutoReplyConfig />
        </div>

        {/* Notification Routing Preview */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Enrutamiento de Notificaciones</h2>
              <p className="text-sm text-slate-400">Configura quién recibe qué tipo de alertas</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white font-medium text-sm">Nuevos Pedidos</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Notificar al personal de almacén</p>
              <input
                type="text"
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-white font-medium text-sm">Stock Bajo</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Alertar al gerente de compras</p>
              <input
                type="text"
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-white font-medium text-sm">Consultas</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">Derivar a vendedor disponible</p>
              <input
                type="text"
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-4">
            Las notificaciones se envían por WhatsApp para que lleguen aunque tengas el celular bloqueado
          </p>
        </div>
      </main>
    </div>
  );
}

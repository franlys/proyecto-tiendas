"use client";

import { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  X,
  Mail,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useAgency } from "@/components/shared";
import { cn } from "@/lib/utils";

interface SupportWidgetProps {
  shopName?: string;
  userName?: string;
}

export function SupportWidget({ shopName, userName }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Phase 24: Use agency context for white-label support
  const { config, isLoaded } = useAgency();

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, soy ${userName || "un usuario"}${shopName ? ` de ${shopName}` : ""}. Necesito ayuda con...`
    );
    window.open(`https://wa.me/${config.whatsapp}?text=${message}`, "_blank");
    setIsOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      `Soporte - ${shopName || config.name}`
    );
    const body = encodeURIComponent(
      `Hola,\n\nNecesito ayuda con:\n\n[Describe tu problema aquí]\n\nTienda: ${shopName || "N/A"}\nUsuario: ${userName || "N/A"}`
    );
    window.open(`mailto:${config.email}?subject=${subject}&body=${body}`, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 glass-panel rounded-2xl p-4 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {isLoaded ? config.logoInitial : "N"}
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">¿Necesitas ayuda?</p>
                <p className="text-slate-400 text-xs">
                  {isLoaded ? config.name : "Soporte"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {/* WhatsApp - Primary */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">WhatsApp</p>
                <p className="text-green-400 text-xs">Respuesta inmediata</p>
              </div>
              <ExternalLink className="w-4 h-4 text-green-400" />
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Email</p>
                <p className="text-slate-400 text-xs">
                  {isLoaded ? config.email : "soporte@linko.app"}
                </p>
              </div>
            </button>

            {/* Documentation */}
            <a
              href="/legal/terms"
              target="_blank"
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium text-sm">Documentación</p>
                <p className="text-slate-400 text-xs">Términos y ayuda</p>
              </div>
            </a>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-4">
            Horario: Lun-Vie 9am-6pm
          </p>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
          isOpen
            ? "bg-white/10 rotate-90"
            : "bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-110 hover:shadow-cyan-500/25"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <HelpCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Pulse Animation (when closed) */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-20 pointer-events-none" />
      )}
    </div>
  );
}

"use client";

import { MessageCircle, Phone, Mail, Palette, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useAgency } from "@/components/shared";

interface AgencyContactCardProps {
  // Props can override context values if needed
  agencyName?: string;
  agencyPhone?: string;
  agencyEmail?: string;
  agencyWhatsApp?: string;
}

export function AgencyContactCard({
  agencyName,
  agencyPhone,
  agencyEmail,
  agencyWhatsApp,
}: AgencyContactCardProps) {
  // Phase 24: Use agency context for white-label support
  const { config, isLoaded } = useAgency();

  // Use props if provided, otherwise fall back to context values
  const name = agencyName || config.name;
  const phone = agencyPhone || config.phone;
  const email = agencyEmail || config.email;
  const whatsapp = agencyWhatsApp || config.whatsapp;
  const logoInitial = config.logoInitial;

  const handleWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsapp}?text=${encodedMessage}`, "_blank");
  };

  // Show skeleton while loading
  if (!isLoaded) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10" />
          <div className="space-y-2">
            <div className="w-24 h-3 bg-white/10 rounded" />
            <div className="w-32 h-4 bg-white/10 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 bg-white/10 rounded" />
          <div className="w-3/4 h-3 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Agency Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xl font-bold">{logoInitial}</span>
          )}
        </div>
        <div>
          <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
            Tu Asesor Digital
          </p>
          <p className="text-white font-semibold">{name}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4">
        Tu marca y diseño visual son gestionados por profesionales.
        Contacta con tu asesor para cualquier cambio o mejora.
      </p>

      {/* Quick Actions */}
      <div className="space-y-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left"
          onClick={() => handleWhatsApp("Hola, me gustaría solicitar cambios de diseño en mi tienda.")}
        >
          <Palette className="w-4 h-4 mr-2 text-purple-400" />
          <span className="flex-1">Solicitar cambios de diseño</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-left"
          onClick={() => handleWhatsApp("Hola, necesito ayuda con mi tienda.")}
        >
          <HelpCircle className="w-4 h-4 mr-2 text-amber-400" />
          <span className="flex-1">Soporte técnico</span>
        </Button>
      </div>

      {/* Contact Info */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span>{phone}</span>
        </a>

        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>{email}</span>
        </a>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/shared";
import { AccessDenied } from "@/components/admin/access-denied";
import { WhatsAppAutomationPanel } from "@/components/shared/whatsapp-automation";

export default function AutomationPage() {
  const { canConfigureWhatsApp, isLoading: authLoading, user } = useAuth();

  // Usar el shopId del usuario o un identificador para la agencia
  const shopSlug = user?.shopId || "nexo-agency";

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

      <main className="container mx-auto px-4 py-8">
        <WhatsAppAutomationPanel shopSlug={shopSlug} />
      </main>
    </div>
  );
}

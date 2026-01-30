"use client";

import { ShieldAlert, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showContactButton?: boolean;
  showBackButton?: boolean;
  backUrl?: string;
}

export function AccessDenied({
  title = "Acceso Restringido",
  message = "No tienes permisos para acceder a esta sección.",
  showContactButton = true,
  showBackButton = true,
  backUrl = "/admin",
}: AccessDeniedProps) {
  const handleContact = () => {
    const whatsappMessage = encodeURIComponent(
      "Hola, necesito ayuda con mi tienda. Me gustaría hacer cambios de diseño."
    );
    window.open(`https://wa.me/5215512345678?text=${whatsappMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="glass-panel rounded-2xl p-8 text-center border border-amber-500/20">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-amber-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>

          {/* Message */}
          <p className="text-slate-400 mb-6">{message}</p>

          {/* Actions */}
          <div className="space-y-3">
            {showContactButton && (
              <Button onClick={handleContact} className="w-full bg-green-600 hover:bg-green-500">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar a mi Asesor
              </Button>
            )}

            {showBackButton && (
              <Link href={backUrl}>
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Panel
                </Button>
              </Link>
            )}
          </div>

          {/* Helper text */}
          <p className="text-xs text-slate-500 mt-6">
            Los cambios de diseño son gestionados por tu asesor digital para
            mantener la coherencia de tu marca.
          </p>
        </div>
      </div>
    </div>
  );
}

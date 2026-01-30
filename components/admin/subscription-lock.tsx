"use client";

import { useRouter } from "next/navigation";
import {
  Lock,
  AlertTriangle,
  CreditCard,
  MessageCircle,
  Calendar,
  ArrowRight,
  Clock,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui";
import { type ManagedShop } from "@/components/shared";

interface SubscriptionLockProps {
  shop: ManagedShop;
  onContactSupport?: () => void;
}

export function SubscriptionLock({ shop, onContactSupport }: SubscriptionLockProps) {
  const router = useRouter();

  const isPastDue = shop.subscriptionStatus === "past_due";
  const isCanceled = shop.subscriptionStatus === "canceled";

  const statusConfig = {
    past_due: {
      icon: AlertTriangle,
      color: "amber",
      title: "Tu suscripción ha vencido",
      description:
        "Para continuar administrando tu tienda, por favor realiza el pago pendiente.",
      badge: "Pago Pendiente",
    },
    canceled: {
      icon: Lock,
      color: "red",
      title: "Suscripción cancelada",
      description:
        "Tu suscripción ha sido cancelada. Contacta con soporte para reactivarla.",
      badge: "Cancelada",
    },
  };

  const config = isPastDue ? statusConfig.past_due : statusConfig.canceled;
  const Icon = config.icon;

  const handlePayment = () => {
    if (shop.paymentLink) {
      window.open(shop.paymentLink, "_blank");
    } else {
      // Default WhatsApp contact
      const message = encodeURIComponent(
        `Hola, quiero pagar mi suscripción de ${shop.name}. Mi tienda es /${shop.slug}`
      );
      window.open(`https://wa.me/5215512345678?text=${message}`, "_blank");
    }
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      const message = encodeURIComponent(
        `Hola, necesito ayuda con mi suscripción de ${shop.name}. Mi tienda es /${shop.slug}`
      );
      window.open(`https://wa.me/5215512345678?text=${message}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main Card */}
        <div className="glass-panel rounded-3xl p-8 border border-amber-500/20">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isPastDue
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.badge}
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                isPastDue ? "bg-amber-500/20" : "bg-red-500/20"
              }`}
            >
              <Lock
                className={`w-10 h-10 ${
                  isPastDue ? "text-amber-400" : "text-red-400"
                }`}
              />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-white mb-3">
              {config.title}
            </h1>
            <p className="text-slate-400">{config.description}</p>
          </div>

          {/* Shop Info */}
          <div className="glass-panel rounded-xl p-4 mb-6 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{shop.name}</p>
                <p className="text-sm text-slate-400">/{shop.slug}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 text-slate-400">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Monto a pagar</span>
              </div>
              <span className="text-white font-bold">
                ${shop.monthlyPrice} MXN/mes
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Fecha de vencimiento</span>
              </div>
              <span className="text-amber-400 font-medium">
                {new Date(shop.nextPaymentDate).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {shop.lastPaymentDate && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Último pago</span>
                </div>
                <span className="text-slate-300 text-sm">
                  {new Date(shop.lastPaymentDate).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isPastDue && (
              <Button
                onClick={handlePayment}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleContactSupport}
              className="w-full py-3"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar Soporte
            </Button>
          </div>

          {/* Note */}
          <p className="text-center text-slate-500 text-xs mt-6">
            Tu tienda pública sigue funcionando. Tus clientes pueden seguir
            agendando citas.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Powered by{" "}
          <span className="text-gradient-primary font-semibold">
            NEXO
          </span>
        </p>
      </div>
    </div>
  );
}

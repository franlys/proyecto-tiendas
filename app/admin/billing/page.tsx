"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  MessageCircle,
  Receipt,
  Shield,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  AuthProvider,
  useAuth,
  ShopsProvider,
  useShops,
  type SubscriptionStatus,
} from "@/components/shared";
import { SubscriptionLock } from "@/components/admin";
import { cn } from "@/lib/utils";

function BillingContent() {
  const router = useRouter();
  const { user, isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { shops, getShop } = useShops();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isSuperAdmin) {
        router.push("/agency");
      } else {
        setIsLoaded(true);
      }
    }
  }, [isAuthenticated, isSuperAdmin, authLoading, router]);

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Cargando...</div>
      </div>
    );
  }

  const shop = user?.shopId ? getShop(user.shopId) : null;

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-slate-400">Tienda no encontrada</p>
      </div>
    );
  }

  // Show lock screen if subscription is past_due or canceled
  if (shop.subscriptionStatus === "past_due" || shop.subscriptionStatus === "canceled") {
    return <SubscriptionLock shop={shop} />;
  }

  const statusConfig: Record<SubscriptionStatus, { color: string; label: string; icon: typeof CheckCircle }> = {
    active: { color: "green", label: "Activa", icon: CheckCircle },
    trial: { color: "blue", label: "Prueba", icon: Sparkles },
    past_due: { color: "amber", label: "Vencida", icon: AlertTriangle },
    canceled: { color: "red", label: "Cancelada", icon: AlertTriangle },
  };

  const status = statusConfig[shop.subscriptionStatus];
  const StatusIcon = status.icon;

  const handlePayment = () => {
    if (shop.paymentLink) {
      window.open(shop.paymentLink, "_blank");
    } else {
      const message = encodeURIComponent(
        `Hola, quiero pagar mi suscripción de ${shop.name}. Mi tienda es /${shop.slug}`
      );
      window.open(`https://wa.me/5215512345678?text=${message}`, "_blank");
    }
  };

  // Mock payment history
  const paymentHistory = [
    { date: "2026-01-15", amount: 299, status: "paid" },
    { date: "2025-12-15", amount: 299, status: "paid" },
    { date: "2025-11-15", amount: 299, status: "paid" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    Facturación
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Gestiona tu suscripción
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Current Plan */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                Tu Plan Actual
              </h2>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    Plan Profesional
                  </p>
                  <p className="text-slate-400">
                    Todas las funciones incluidas
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                    status.color === "green" && "bg-green-500/20 text-green-400",
                    status.color === "blue" && "bg-blue-500/20 text-blue-400",
                    status.color === "amber" && "bg-amber-500/20 text-amber-400",
                    status.color === "red" && "bg-red-500/20 text-red-400"
                  )}
                >
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Precio mensual</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    RD$ {shop.monthlyPrice || 0}{" "}
                    <span className="text-sm text-slate-400 font-normal">
                      DOP/mes
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Próximo cobro</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {new Date(shop.nextPaymentDate).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                {shop.subscriptionStatus === "trial"
                  ? "Activar Suscripción"
                  : "Pagar Ahora"}
              </Button>
            </div>

            {/* Payment History */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gold" />
                Historial de Pagos
              </h2>

              <div className="space-y-3">
                {paymentHistory.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Pago mensual
                        </p>
                        <p className="text-sm text-slate-400">
                          {new Date(payment.date).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">${payment.amount}</p>
                      <span className="text-xs text-green-400">Pagado</span>
                    </div>
                  </div>
                ))}
              </div>

              {paymentHistory.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay pagos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shop Info */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Tu Tienda
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{shop.name}</p>
                  <p className="text-sm text-slate-400">/{shop.slug}</p>
                </div>
              </div>
              <Link href={`/${shop.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  Ver tienda
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-white text-sm mb-4">
                Estamos disponibles para ayudarte con cualquier duda sobre tu
                facturación.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const message = encodeURIComponent(
                    `Hola, tengo una consulta sobre la facturación de ${shop.name}`
                  );
                  window.open(
                    `https://wa.me/5215512345678?text=${message}`,
                    "_blank"
                  );
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Button>
            </div>

            {/* Plan Features */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Plan incluye
              </h3>
              <ul className="space-y-2">
                {[
                  "Tienda web personalizable",
                  "Sistema de reservas WhatsApp",
                  "Panel de administración",
                  "Inventario de productos",
                  "Generador de promos",
                  "CRM de clientes",
                  "Reportes y analytics",
                  "Soporte prioritario",
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-white"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <AuthProvider>
      <ShopsProvider>
        <BillingContent />
      </ShopsProvider>
    </AuthProvider>
  );
}

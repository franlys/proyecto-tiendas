"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Search,
  Sparkles,
  Gift,
  ShoppingBag,
  Calendar,
  ArrowLeft,
  Clock,
  CheckCircle,
  Heart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useClients, ClientsProvider, OrdersProvider } from "@/components/shared";

// Customer order type for display
interface CustomerOrder {
  id: string;
  shopName: string;
  items: string[];
  total: number;
  date: string;
}

// Customer profile type
interface CustomerProfile {
  name: string;
  phone: string;
  stamps: number;
  totalVisits: number;
  favoriteShop: string;
  orders: CustomerOrder[];
}

function LoyaltyCardDisplay({
  stamps,
  totalStamps = 10,
  shopName,
}: {
  stamps: number;
  totalStamps?: number;
  shopName: string;
}) {
  const [cardNumber] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const isComplete = stamps >= totalStamps;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-primary via-rose-600 to-orange-500",
        "shadow-2xl shadow-primary/30",
        isComplete && "from-gold via-gold-light to-amber-400"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-display text-xl font-bold">
            {shopName}
          </h3>
          <p className="text-white/80 text-sm">Tarjeta de Fidelidad</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          {isComplete ? (
            <Gift className="w-6 h-6 text-white" />
          ) : (
            <Heart className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      {/* Stamps Grid */}
      <div className="relative grid grid-cols-5 gap-3 mb-6">
        {Array.from({ length: totalStamps }).map((_, index) => {
          const isFilled = index < stamps;

          return (
            <div
              key={index}
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center",
                "transition-all duration-300",
                isFilled
                  ? "bg-white shadow-lg"
                  : "bg-white/20 border-2 border-dashed border-white/40"
              )}
            >
              {isFilled && (
                <div className="text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm">
            {isComplete ? "¡Felicidades!" : "Progreso"}
          </p>
          <p className="text-white font-bold text-lg">
            {isComplete ? "Servicio Gratis" : `${stamps} / ${totalStamps} sellos`}
          </p>
        </div>

        {isComplete && (
          <button className="px-4 py-2 bg-white text-primary font-bold rounded-lg shadow-lg">
            Canjear
          </button>
        )}
      </div>

      {/* Card Number */}
      <div className="absolute bottom-4 right-6 text-white/30 text-xs font-mono">
        **** **** **** {cardNumber}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { clients } = useClients();
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    setNotFound(false);

    // Simulate API delay
    setTimeout(() => {
      // Normalize phone (remove non-digits)
      const normalizedPhone = phone.replace(/\D/g, "");

      const found = clients.find(c => c.phone.replace(/\D/g, "") === normalizedPhone);

      if (found) {
        // Map Context Client to Page View Structure
        // Calculating stamps logic (e.g. 1 stamp per visit/order)
        const stamps = found.totalVisits % 10; // Simple cyclical logic for demo

        setCustomer({
          name: found.name,
          phone: found.phone,
          stamps: stamps === 0 && found.totalVisits > 0 ? 10 : stamps,
          totalVisits: found.totalVisits,
          favoriteShop: "Mi Tienda", // Should calculate from orders
          orders: found.orders.map(o => ({
            id: o.id,
            shopName: o.shopName,
            items: o.items.map(i => i.name),
            total: o.total,
            date: o.date
          }))
        });
      } else {
        setCustomer(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && phone.length >= 10) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-panel">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Mi Perfil
              </span>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {!customer ? (
          /* Phone Input Section */
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-400 mb-6 shadow-lg shadow-primary/25">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Accede a tu Perfil
              </h1>
              <p className="text-slate-400">
                Ingresa tu número de teléfono para ver tu tarjeta de fidelidad y pedidos
              </p>
            </div>

            {/* Phone Input Card */}
            <div className="glass-panel rounded-2xl p-8 border border-white/10">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Número de Teléfono
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setNotFound(false);
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="555-123-4567"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={phone.length < 10 || isSearching}
                  className="px-6 bg-gradient-to-r from-primary to-orange-400 hover:from-rose-400 hover:to-orange-300"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Not Found Message */}
              {notFound && (
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-400 text-sm">
                    No encontramos tu perfil. ¿Es tu primera visita? Acércate a cualquiera de nuestras tiendas para registrarte.
                  </p>
                </div>
              )}

              {/* Demo Hint */}
              <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-cyan-400 text-sm font-medium mb-2">
                  Teléfonos de demostración:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPhone("5551234567")}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors"
                  >
                    555-123-4567
                  </button>
                  <button
                    onClick={() => setPhone("5559876543")}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors"
                  >
                    555-987-6543
                  </button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-5 border border-white/5">
                <Gift className="w-8 h-8 text-gold mb-3" />
                <h3 className="font-semibold text-white mb-1">Tarjeta de Fidelidad</h3>
                <p className="text-sm text-slate-400">Acumula sellos y gana premios</p>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-white/5">
                <ShoppingBag className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-white mb-1">Historial de Pedidos</h3>
                <p className="text-sm text-slate-400">Revisa tus visitas anteriores</p>
              </div>
            </div>
          </div>
        ) : (
          /* Customer Profile Section */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Header */}
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                ¡Hola, {customer.name.split(" ")[0]}!
              </h1>
              <p className="text-slate-400">
                Bienvenido a tu perfil de fidelidad
              </p>
              <button
                onClick={() => {
                  setCustomer(null);
                  setPhone("");
                }}
                className="mt-3 text-sm text-primary hover:text-rose-300 transition-colors"
              >
                ← Usar otro teléfono
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel rounded-xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-white">{customer.stamps}</p>
                <p className="text-xs text-slate-400">Sellos</p>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-gold">{customer.totalVisits}</p>
                <p className="text-xs text-slate-400">Visitas</p>
              </div>
              <div className="glass-panel rounded-xl p-4 text-center border border-white/5">
                <p className="text-2xl font-bold text-primary">{customer.orders.length}</p>
                <p className="text-xs text-slate-400">Pedidos</p>
              </div>
            </div>

            {/* Loyalty Card */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-gold" />
                Tu Tarjeta de Fidelidad
              </h2>
              <LoyaltyCardDisplay
                stamps={customer.stamps}
                shopName={customer.favoriteShop}
              />
              <p className="text-center text-slate-500 text-sm mt-3">
                {10 - customer.stamps} sellos más para tu próxima recompensa
              </p>
            </div>

            {/* Order History */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Historial de Pedidos
              </h2>
              <div className="space-y-3">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-panel rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-white">
                            {order.shopName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(order.date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gold font-bold">${order.total}</p>
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Completado
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-lg bg-white/5 text-slate-300 text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel rounded-xl p-6 border border-white/10 text-center">
              <h3 className="font-semibold text-white mb-4">¿Quieres agendar una cita?</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/estetica-lola">
                  <Button>
                    <Store className="w-4 h-4 mr-2" />
                    Estética Lola
                  </Button>
                </Link>
                <Link href="/barberia-classic">
                  <Button variant="outline">
                    <Store className="w-4 h-4 mr-2" />
                    Barbería Classic
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          Powered by{" "}
          <span className="text-gradient-primary font-semibold">
            NEXO
          </span>
        </div>
      </footer>
    </div>
  );
}

// Wrapper to provide contexts since this is a standalone page
export default function WrappedProfilePage() {
  return (
    <OrdersProvider>
      <ClientsProvider orders={[]}>
        <ProfilePage />
      </ClientsProvider>
    </OrdersProvider>
  );
}

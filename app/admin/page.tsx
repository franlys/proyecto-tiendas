"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Image,
  Store,
  Plus,
  ArrowRight,
  LogOut,
  Shield,
  Users,
  CreditCard,
  Package,
  Bot,
} from "lucide-react";
import { OrdersProvider, useOrders, useAuth, ShopsProvider, useShops, AgencyProvider } from "@/components/shared";
import { DashboardKPIs, SalesChart, SubscriptionLock, SupportWidget, AgencyContactCard } from "@/components/admin";
import { DailyReportCard } from "@/components/admin";
import { DatabaseSeeder } from "@/components/admin/database-seeder";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Button } from "@/components/ui";

// Demo data generator for when there's no real data
function generateDemoData() {
  const data = [];
  const baseAmount = 800;

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    // Random variation
    const variation = Math.random() * 600 - 200;
    const sales = Math.max(0, Math.round(baseAmount + variation));
    const orders = Math.max(0, Math.round(sales / 300));

    data.push({
      date: date.toISOString().split("T")[0],
      day: days[date.getDay()],
      sales,
      orders,
    });
  }

  return data;
}

function DashboardContent({ isSuperAdmin, shop }: { isSuperAdmin: boolean; shop?: { slug: string; name: string } | null }) {
  const { getTodayStats, getLast7DaysStats, getTodayOrders, orders } = useOrders();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Cargando dashboard...</div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  const chartData = getLast7DaysStats();
  const todayOrders = getTodayOrders();

  // Mix demo data with real data if no orders exist
  const hasRealData = orders.length > 0;
  const displayChartData = hasRealData ? chartData : generateDemoData();

  return (
    <div className="space-y-8">
      {/* Phase 21: Hide financial widgets for Super Admin (privacy) */}
      {!isSuperAdmin ? (
        <>
          {/* KPI Cards */}
          <DashboardKPIs
            totalSales={todayStats.totalSales}
            totalOrders={todayStats.totalOrders}
            averageTicket={todayStats.averageTicket}
            topService={todayStats.topService}
          />

          {/* Charts and Report Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sales Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <SalesChart data={displayChartData} />
              {!hasRealData && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  📊 Datos de demostración - Las gráficas se actualizarán con ventas reales
                </p>
              )}
            </div>

            {/* Daily Report */}
            <div>
              <DailyReportCard
                shopName={shop?.name || "Mi Tienda"}
                orders={todayOrders}
                totalSales={todayStats.totalSales}
                totalOrders={todayStats.totalOrders}
                topService={todayStats.topService}
                ownerPhone="+34600123456"
              />
            </div>
          </div>
        </>
      ) : (
        /* Super Admin sees technical maintenance view */
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-8 text-center border border-cyan-500/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Vista de Mantenimiento</h2>
            <p className="text-slate-400 mb-6">
              Como administrador de agencia, los reportes financieros individuales de cada tienda
              son privados. Accede al panel de Agencia para ver el estado de suscripciones.
            </p>
            <Link href="/agency">
              <Button>
                <Shield className="w-4 h-4 mr-2" />
                Ir al Panel de Agencia
              </Button>
            </Link>
          </div>

          <DatabaseSeeder />
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/${shop?.slug || "demo"}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Ver Tienda</p>
              <p className="text-xs text-slate-400">{shop?.name || "Mi Tienda"}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </Link>

          <Link
            href="/admin/promos"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Image className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Crear Promo</p>
              <p className="text-xs text-slate-400">Stories Instagram</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </Link>

          {/* Phase 21: Settings only for Super Admin */}
          {isSuperAdmin ? (
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Configuración</p>
                <p className="text-xs text-slate-400">Tema y visuales</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          ) : (
            <Link
              href="/admin/billing"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mi Suscripción</p>
                <p className="text-xs text-slate-400">Ver facturación</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {!isSuperAdmin ? (
            <Link
              href="/admin/profile"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mi Negocio</p>
                <p className="text-xs text-slate-400">Logo, horarios, redes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          ) : (
            <button
              onClick={() => {
                alert(`💡 Tip: Ve a /${shop?.slug || "tu-tienda"}, selecciona servicios y haz clic en 'Agendar' para ver datos reales aquí.`);
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Probar Sistema</p>
                <p className="text-xs text-slate-400">Simular venta</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* Phase 21: Agency Contact Card for Shop Owners */}
      {!isSuperAdmin && (
        <div className="max-w-md">
          <AgencyContactCard />
        </div>
      )}
    </div>
  );
}

function AdminDashboardWithSubscription() {
  const router = useRouter();
  const { user, logout, isSuperAdmin } = useAuth();
  const { getShop, isSubscriptionActive } = useShops();

  // Redirect Super Admin to Agency Panel immediately
  useEffect(() => {
    if (isSuperAdmin) {
      router.replace("/agency");
    }
  }, [isSuperAdmin, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-slate-400">
          <Shield className="w-8 h-8 text-cyan-500" />
          <p>Accediendo al Panel de Agencia...</p>
        </div>
      </div>
    );
  }

  // Check subscription status for shop owners (not super admin)
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const hasActiveSubscription = shop && isSubscriptionActive(shop.slug);

  // Show subscription lock if not active
  if (shop && !hasActiveSubscription) {
    return <SubscriptionLock shop={shop} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Dashboard
                </h1>
                <p className="text-slate-400 text-sm">
                  {user?.name} · {isSuperAdmin ? "Super Admin" : "Shop Owner"}
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              {isSuperAdmin && (
                <Link href="/agency">
                  <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 px-2 sm:px-3">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Agency</span>
                  </Button>
                </Link>
              )}
              <Link href="/admin/inventory">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Inventario</span>
                </Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">CRM</span>
                </Button>
              </Link>
              <Link href="/admin/automation">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Bot WA</span>
                </Button>
              </Link>
              <Link href="/admin/promos">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Promos</span>
                </Button>
              </Link>
              {/* Phase 21: Settings only visible to Super Admin */}
              {isSuperAdmin && (
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Config</span>
                  </Button>
                </Link>
              )}
              {/* Shop Profile for Shop Owners */}
              {!isSuperAdmin && (
                <Link href="/admin/profile">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Store className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Mi Negocio</span>
                  </Button>
                </Link>
              )}
              {/* Phase 21: Billing redirects based on role */}
              <Link href={isSuperAdmin ? "/agency" : "/admin/billing"}>
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{isSuperAdmin ? "Clientes" : "Billing"}</span>
                </Button>
              </Link>
              {/* Notification Bell */}
              <NotificationBell />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Salir</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <OrdersProvider>
          <DashboardContent isSuperAdmin={isSuperAdmin} shop={shop} />
        </OrdersProvider>
      </main>

      {/* Floating Support Widget */}
      <SupportWidget shopName={shop?.name} userName={user?.name} />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ShopsProvider>
      <AgencyProvider>
        <AdminDashboardWithSubscription />
      </AgencyProvider>
    </ShopsProvider>
  );
}

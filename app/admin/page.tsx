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
  Megaphone,
  ShoppingBag,
  CheckCircle,
  ChevronRight,
  Phone,
  Calendar,
  Wrench,
  Car,
  UtensilsCrossed,
  Briefcase,
  AlertTriangle,
  Truck,
  Sparkles,
  Heart,
  Clock,
  Palette,
  Dumbbell,
} from "lucide-react";
import { useAuth, ShopsProvider, useShops, AgencyProvider, SalesOrdersProvider, useSalesOrders, ORDER_STATUS_CONFIG, type OrderStatus, type SalesOrder } from "@/components/shared";
import { DashboardKPIs, SalesChart, SubscriptionLock, SupportWidget, AgencyContactCard } from "@/components/admin";
import { getBookingsForDate, confirmBooking, cancelBooking } from "@/lib/services/booking.service";
import type { Booking, BookingStatus } from "@/lib/types/booking.types";
import { DailyReportCard } from "@/components/admin";
import { DatabaseSeeder } from "@/components/admin/database-seeder";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Button } from "@/components/ui";
import { useCombinedBusinessFeatures, type CombinedBusinessFeatures } from "@/lib/hooks/use-business-features";
import type { BusinessType } from "@/lib/types/business.types";

// Upcoming Bookings Widget for Dashboard
function BookingsWidget({ shopId, features }: { shopId: string; features: CombinedBusinessFeatures }) {
  const bookingLabel = features.labels.booking || "Cita";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Fetch upcoming bookings (next 7 days)
  useEffect(() => {
    async function fetchBookings() {
      if (!shopId || shopId === "default") {
        setIsLoading(false);
        return;
      }

      try {
        const allBookings: Booking[] = [];

        // Get bookings for the next 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const dayBookings = await getBookingsForDate(shopId, dateStr);
          allBookings.push(...dayBookings);
        }

        // Sort by date and time
        allBookings.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });

        setBookings(allBookings.slice(0, 5));
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
    // Refresh every minute
    const interval = setInterval(fetchBookings, 60000);
    return () => clearInterval(interval);
  }, [shopId]);

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking(shopId, bookingId);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: "confirmed" as BookingStatus } : b
      ));
    } catch (error) {
      console.error("Error confirming booking:", error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    try {
      await cancelBooking(shopId, bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const styles: Record<BookingStatus, string> = {
      pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
      rescheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      no_show: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels: Record<BookingStatus, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      rescheduled: "Reagendada",
      cancelled: "Cancelada",
      completed: "Completada",
      no_show: "No asistió",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (dateStr === today) return "Hoy";
    if (dateStr === tomorrowStr) return "Mañana";
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es", { weekday: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Próximas {bookingLabel}s</h3>
        </div>
        <div className="text-center py-8 text-slate-400">Cargando...</div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Próximas {bookingLabel}s
          </h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay {bookingLabel.toLowerCase()}s programadas</p>
          <p className="text-xs mt-1">Las {bookingLabel.toLowerCase()}s aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Próximas {bookingLabel}s
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
            {bookings.length}
          </span>
        </h3>
        <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => {
          const isExpanded = expandedBooking === booking.id;

          return (
            <div
              key={booking.id}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-slate-400">{formatDate(booking.date)}</p>
                      <p className="text-lg font-bold text-white">{booking.time}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{booking.customerName}</p>
                      <p className="text-sm text-slate-400">{booking.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div className="text-sm text-slate-400">
                    <p>📱 {booking.customerPhone}</p>
                    <p>⏱️ {booking.serviceDuration} min - ${booking.servicePrice.toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(booking.id);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                    )}
                    {(booking.status === "pending" || booking.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(booking.id);
                        }}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        Cancelar
                      </Button>
                    )}
                    {booking.customerPhone && (
                      <a
                        href={`https://wa.me/${booking.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${booking.customerName}, sobre tu ${bookingLabel.toLowerCase()} del ${formatDate(booking.date)} a las ${booking.time}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pending Orders Widget for Dashboard
function PendingOrdersWidget({ shopId, features }: { shopId: string; features: CombinedBusinessFeatures }) {
  const { orders, updateOrderStatus, getPendingOrders } = useSalesOrders();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const orderLabel = features.labels.order || "Pedido";

  // Get orders that need attention (pending, confirmed, preparing)
  const activeOrders = orders.filter(o =>
    ["pending", "confirmed", "preparing", "dispatched"].includes(o.status)
  ).slice(0, 5); // Show max 5

  const statusOrder: OrderStatus[] = ["pending", "confirmed", "preparing", "dispatched", "delivered"];

  const handleAdvance = async (order: SalesOrder) => {
    const currentIndex = statusOrder.indexOf(order.status);
    if (currentIndex < statusOrder.length - 1 && order.status !== "cancelled") {
      const nextStatus = statusOrder[currentIndex + 1];
      await updateOrderStatus(order.id, nextStatus);

      // Send notification to customer if they have phone
      if (order.customerPhone) {
        try {
          await fetch("/api/orders/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopId,
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerPhone: order.customerPhone,
              customerName: order.customerName,
              status: nextStatus,
              total: order.total,
            }),
          });
        } catch (e) {
          console.error("Error sending notification:", e);
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      preparing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      dispatched: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      delivered: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-400";
  };

  if (activeOrders.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            {orderLabel}s Activos
          </h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay {orderLabel.toLowerCase()}s pendientes</p>
          <p className="text-xs mt-1">Los nuevos {orderLabel.toLowerCase()}s aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          {orderLabel}s Activos
          {activeOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              {activeOrders.length}
            </span>
          )}
        </h3>
        <Link href="/admin/orders" className="text-sm text-primary hover:underline">
          Ver todos
        </Link>
      </div>

      <div className="space-y-3">
        {activeOrders.map((order) => {
          const config = ORDER_STATUS_CONFIG[order.status];
          const currentIndex = statusOrder.indexOf(order.status);
          const canAdvance = currentIndex < statusOrder.length - 1 && order.status !== "cancelled";
          const nextStatus = canAdvance ? statusOrder[currentIndex + 1] : null;
          const isExpanded = expandedOrder === order.id;

          return (
            <div
              key={order.id}
              className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
              {/* Order Header */}
              <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className="font-semibold text-white">#{order.orderNumber}</p>
                      <p className="text-sm text-slate-400">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {config.label}
                    </span>
                    <span className="font-bold text-emerald-400">${order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  {/* Items */}
                  <div className="text-sm text-slate-400">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx}>• {item.productName} x{item.quantity}</p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-slate-500">+{order.items.length - 3} más...</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {canAdvance && nextStatus && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvance(order);
                        }}
                        className="flex-1"
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        {ORDER_STATUS_CONFIG[nextStatus].label}
                      </Button>
                    )}
                    {order.customerPhone && (
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${order.customerName}, sobre tu pedido #${order.orderNumber}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

function DashboardContent({ isSuperAdmin, shop, features }: { isSuperAdmin: boolean; shop?: any | null; features: CombinedBusinessFeatures }) {
  const { orders, getTodayOrders } = useSalesOrders();
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

  // Calculate Stats
  const todayOrders = getTodayOrders();
  const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const paidSales = todayOrders
    .filter(o => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = todayOrders.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Calculate Top Service
  const serviceCount: Record<string, number> = {};
  todayOrders.forEach((order) => {
    order.items.forEach((item) => {
      serviceCount[item.productName] = (serviceCount[item.productName] || 0) + 1;
    });
  });

  let topService: string | null = null;
  let maxCount = 0;
  Object.entries(serviceCount).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topService = name;
    }
  });

  const todayStats = {
    totalSales,
    paidSales,
    totalOrders,
    averageTicket,
    topService
  };

  // Calculate Last 7 Days Stats
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr));

    chartData.push({
      date: dateStr,
      day: days[d.getDay()],
      sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length
    });
  }


  // Mix demo data with real data if no orders exist
  const hasRealData = orders.length > 0;
  const displayChartData = hasRealData ? chartData : generateDemoData();

  return (
    <div className="space-y-8">
      {/* Phase 21: Hide financial widgets for Super Admin (privacy) */}
      {!isSuperAdmin ? (
        <>
          {/* Dashboard Content */}
          <DashboardKPIs
            totalSales={todayStats.totalSales}
            paidSales={todayStats.paidSales}
            totalOrders={todayStats.totalOrders}
            averageTicket={todayStats.averageTicket}
            topService={todayStats.topService}
            businessType={shop?.businessType}
          />

          {/* Orders and Bookings Widgets - Based on business type */}
          <div className="grid lg:grid-cols-2 gap-6">
            {features.dashboardWidgets.pendingOrders && (
              <PendingOrdersWidget shopId={shop?.slug || "default"} features={features} />
            )}
            {features.dashboardWidgets.upcomingBookings && (
              <BookingsWidget shopId={shop?.slug || "default"} features={features} />
            )}
            {/* If neither orders nor bookings, show a placeholder */}
            {!features.dashboardWidgets.pendingOrders && !features.dashboardWidgets.upcomingBookings && (
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
                <p className="text-slate-400">Panel de {features.config.label}</p>
                <p className="text-xs text-slate-500 mt-1">Configura tu negocio desde Mi Negocio</p>
              </div>
            )}
          </div>

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
                shopId={shop?.slug || ""}
                shopName={shop?.name || "Mi Tienda"}
                orders={todayOrders}
                totalSales={todayStats.totalSales}
                totalOrders={todayStats.totalOrders}
                topService={todayStats.topService}
                ownerPhone={shop?.contact?.phone || ""}
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

      {/* Quick Actions - Based on business features */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ver Tienda - Siempre visible */}
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

          {/* Calendario - Solo si tiene bookings */}
          {features.hasBookings && (
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Calendario de {features.labels.booking}s</p>
                <p className="text-xs text-slate-400">Gestionar agenda</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Inventario - Solo si tiene catálogo o inventario */}
          {features.adminModules.inventory && (
            <Link
              href="/admin/inventory"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{features.labels.products}</p>
                <p className="text-xs text-slate-400">Gestionar catálogo</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Reparaciones - Solo si tiene repairs */}
          {features.hasRepairs && (
            <Link
              href="/admin/repair"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{features.labels.services}</p>
                <p className="text-xs text-slate-400">Órdenes de reparación</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Rentas - Solo si tiene rentals */}
          {features.hasRentals && (
            <Link
              href="/admin/rentals"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Rentas</p>
                <p className="text-xs text-slate-400">Gestionar alquileres</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}


          {/* Mesas - Solo si tiene tables */}
          {features.hasTables && (
            <Link
              href="/admin/tables"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mesas</p>
                <p className="text-xs text-slate-400">Gestionar reservas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Promos - Siempre visible */}
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

          {/* Settings - Siempre visible */}
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Diseño Visual</p>
              <p className="text-xs text-slate-400">Colores, fondo, efectos</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </Link>

          {/* Billing - Solo para Shop Owner */}
          {!isSuperAdmin && (
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

          {/* Mi Negocio - Solo para Shop Owner */}
          {!isSuperAdmin && (
            <Link
              href="/admin/profile"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:to-cyan-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Información de Contacto</p>
                <p className="text-xs text-slate-400">Teléfono, redes sociales, dirección</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Horarios - Acceso directo a Configuración de Citas */}
          {!isSuperAdmin && features.hasBookings && (
            <Link
              href="/admin/bookings/settings"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Horarios de Atención</p>
                <p className="text-xs text-slate-400">Configura disponibilidad y citas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Paquetes de Entrenamiento - Para gimnasios y entrenadores */}
          {(shop?.businessTypes?.some((t: string) =>
            ["gimnasio", "crossfit", "entrenador_personal", "yoga", "pilates", "artes_marciales", "boxeo", "meal_prep"].includes(t)
          ) || ["gimnasio", "crossfit", "entrenador_personal", "yoga", "pilates", "artes_marciales", "boxeo", "meal_prep"].includes(shop?.businessType || "")) && (
              <Link
                href="/admin/training-packages"
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/20 hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Paquetes de Entrenamiento</p>
                  <p className="text-xs text-slate-400">Planes, precios y distancia</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </Link>
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

  // Get shop for business features
  const shop = user?.shopId ? getShop(user.shopId) : null;
  // Use combined features to support multi-type businesses
  const businessTypes = shop?.businessTypes || (shop?.businessType ? [shop.businessType] : []);
  const features = useCombinedBusinessFeatures(businessTypes);

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

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto mask-linear-fade">
                {/* Agency - Solo Super Admin */}
                {isSuperAdmin && (
                  <Link href="/agency">
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 px-2 sm:px-3">
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Agency</span>
                    </Button>
                  </Link>
                )}

                {/* Pedidos/Órdenes - Solo si tiene orders */}
                {features.adminModules.orders && (
                  <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-amber-400 hover:text-amber-300">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">{features.labels.order}s</span>
                    </Button>
                  </Link>
                )}

                {/* Citas/Reservaciones - Solo si tiene bookings */}
                {features.adminModules.bookings && (
                  <Link href="/admin/bookings">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-purple-400 hover:text-purple-300">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">{features.labels.booking}s</span>
                    </Button>
                  </Link>
                )}

                {/* Pre-consultas de belleza - Solo para negocios de belleza */}
                {features.adminModules.beautyConsultations && (
                  <Link href="/admin/beauty-consultations">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-pink-400 hover:text-pink-300">
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Pre-consultas</span>
                    </Button>
                  </Link>
                )}

                {/* Inventario/Catálogo - Solo si tiene inventory */}
                {features.adminModules.inventory && (
                  <Link href="/admin/inventory">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-blue-400 hover:text-blue-300">
                      <Package className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">{features.labels.products}</span>
                    </Button>
                  </Link>
                )}

                {/* Reparaciones - Solo si tiene repairs */}
                {features.adminModules.repairs && (
                  <Link href="/admin/repair">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-orange-400 hover:text-orange-300">
                      <Wrench className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">{features.labels.services}</span>
                    </Button>
                  </Link>
                )}

                {/* Rentas - Solo si tiene rentals */}
                {features.adminModules.rentals && (
                  <Link href="/admin/rentals">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-cyan-400 hover:text-cyan-300">
                      <Car className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Rentas</span>
                    </Button>
                  </Link>
                )}

                {/* Mesas - Solo si tiene tables */}
                {features.adminModules.tables && (
                  <Link href="/admin/tables">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-amber-400 hover:text-amber-300">
                      <UtensilsCrossed className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Mesas</span>
                    </Button>
                  </Link>
                )}

                {/* CRM - Siempre visible */}
                <Link href="/admin/clients">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">CRM</span>
                  </Button>
                </Link>

                {/* Lealtad - Siempre visible */}
                <Link href="/admin/loyalty">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-rose-400 hover:text-rose-300">
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Lealtad</span>
                  </Button>
                </Link>

                {/* Bot WA - Siempre visible */}
                <Link href="/admin/automation">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Bot className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Bot WA</span>
                  </Button>
                </Link>

                {/* Marketing - Siempre visible */}
                <Link href="/admin/marketing">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Megaphone className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Marketing</span>
                  </Button>
                </Link>

                {/* Promos - Siempre visible */}
                <Link href="/admin/promos">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Promos</span>
                  </Button>
                </Link>

                {/* Diseño Visual - Siempre visible */}
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <Palette className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Diseño</span>
                  </Button>
                </Link>

                {/* Perfil (Mi Negocio) - Solo para Shop Owner */}
                {!isSuperAdmin && (
                  <Link href="/admin/profile">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-purple-400 hover:text-purple-300">
                      <Store className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Perfil</span>
                    </Button>
                  </Link>
                )}

                {/* Billing - Basado en rol */}
                <Link href={isSuperAdmin ? "/agency" : "/admin/billing"}>
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                    <CreditCard className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">{isSuperAdmin ? "Clientes" : "Billing"}</span>
                  </Button>
                </Link>

                {/* Logout */}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Salir</span>
                </Button>
              </nav>
              {/* Notification Bell - Outside nav to avoid overflow clipping */}
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SalesOrdersProvider shopId={user?.shopId || "default"}>
          <DashboardContent isSuperAdmin={isSuperAdmin} shop={shop} features={features} />
        </SalesOrdersProvider>
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


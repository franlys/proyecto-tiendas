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
  Building2,
  MessageSquarePlus,
  MessageCircle,
  ClipboardList,
  BarChart3,
  ImageIcon,
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
      completed: "bg-slate-500/20 text-white/50 border-slate-500/30",
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
        <div className="text-center py-8 text-white/50">Cargando...</div>
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
        <div className="text-center py-8 text-white/50">
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
                      <p className="text-xs text-white/50">{formatDate(booking.date)}</p>
                      <p className="text-lg font-bold text-white">{booking.time}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{booking.customerName}</p>
                      <p className="text-sm text-white/50">{booking.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
                  <div className="text-sm text-white/50">
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

// Training Enrollments Widget for Dashboard
function TrainingEnrollmentsWidget({ shopId }: { shopId: string }) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingWA, setSendingWA] = useState<string | null>(null);

  const handleWhatsApp = async (enrollment: any) => {
    setSendingWA(enrollment.id);
    try {
      const res = await fetch("/api/training/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          enrollmentId: enrollment.id,
          customerPhone: enrollment.customerPhone,
          customerName: enrollment.customerName,
          packageName: enrollment.packageName,
          status: "contact",
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Bot sent it automatically — nothing else needed
      } else if (data.whatsappUrl) {
        // Fallback: Evolution not configured, open manual wa.me
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (e) {
      console.error("Error sending WhatsApp:", e);
    } finally {
      setSendingWA(null);
    }
  };

  useEffect(() => {
    async function fetchEnrollments() {
      if (!shopId || shopId === "default") {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/training/enrollments?shopId=${shopId}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setEnrollments((data.enrollments || []).slice(0, 5));
        }
      } catch (e) {
        console.error("Error fetching enrollments:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEnrollments();
  }, [shopId]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-slate-500/20 text-white/50 border-slate-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      active: "Activo",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    const style = styles[status] || "bg-slate-500/20 text-white/50 border-slate-500/30";
    const label = labels[status] || status;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Próximas Inscripciones</h3>
        </div>
        <div className="text-center py-8 text-white/50">Cargando...</div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            Próximas Inscripciones
          </h3>
        </div>
        <div className="text-center py-8 text-white/50">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay inscripciones recientes</p>
          <p className="text-xs mt-1">Las inscripciones aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-orange-400" />
          Próximas Inscripciones
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
            {enrollments.length}
          </span>
        </h3>
        <Link href="/admin/training" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="space-y-3">
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="rounded-xl bg-white/5 border border-white/10 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{enrollment.customerName}</p>
                <p className="text-sm text-white/50">{enrollment.packageName}</p>
                {enrollment.startDate && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Inicio: {new Date(enrollment.startDate + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(enrollment.status || "pending")}
                {enrollment.customerPhone && (
                  <button
                    onClick={() => handleWhatsApp(enrollment)}
                    disabled={sendingWA === enrollment.id}
                    className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Phone className="w-3 h-3" />
                    {sendingWA === enrollment.id ? "Enviando..." : "WhatsApp"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
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
    return colors[status] || "bg-slate-500/20 text-white/50";
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
        <div className="text-center py-8 text-white/50">
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
                      <p className="text-sm text-white/50">{order.customerName}</p>
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
                  <div className="text-sm text-white/50">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <p key={idx}>• {item.productName} x{item.quantity}</p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-white/40">+{order.items.length - 3} más...</p>
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
  const { user } = useAuth();
  const { orders, getTodayOrders } = useSalesOrders();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Cargando dashboard...</div>
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
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.getDate() === d.getDate() &&
        orderDate.getMonth() === d.getMonth() &&
        orderDate.getFullYear() === d.getFullYear()
      );
    });

    // Provide a generic string date just for potential console logging or keys
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

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
            orderLabel={features.hasBookings ? features.labels.booking : features.labels.order}
            productLabel={features.hasBookings ? features.labels.services : features.labels.products}
          />

          {/* Orders and Bookings Widgets - Based on business type */}
          <div className="grid lg:grid-cols-2 gap-6">
            {features.dashboardWidgets.pendingOrders && (
              <PendingOrdersWidget shopId={shop?.id || shop?.slug || "default"} features={features} />
            )}
            {features.hasTraining && (
              <TrainingEnrollmentsWidget shopId={shop?.id || shop?.slug || "default"} />
            )}
            {features.dashboardWidgets.upcomingBookings && !features.hasTraining && (
              <BookingsWidget shopId={shop?.id || shop?.slug || "default"} features={features} />
            )}
            {/* If neither orders nor bookings nor training, show a placeholder */}
            {!features.dashboardWidgets.pendingOrders && !features.dashboardWidgets.upcomingBookings && !features.hasTraining && (
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-white/50 opacity-50" />
                <p className="text-white/70">Panel de {features.config.label}</p>
                <p className="text-xs text-white/50 mt-1">Configura tu negocio desde Mi Negocio</p>
              </div>
            )}
          </div>

          {/* Charts and Report Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sales Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <SalesChart
                data={displayChartData}
                orderLabel={features.hasBookings ? features.labels.booking : features.labels.order}
              />
              {!hasRealData && (
                <p className="text-xs text-white/40 text-center mt-2">
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
                orderLabel={features.hasBookings ? features.labels.booking : features.labels.order}
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
            <p className="text-white/70 mb-6">
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
            href={shop?.slug ? `/${shop.slug}` : "#"}
            onClick={(e) => !shop?.slug && e.preventDefault()}
            className={`flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group ${!shop?.slug ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Ver Tienda</p>
              <p className="text-xs text-white/60">{shop?.name || "Mi Tienda"}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </Link>

          {/* Calendario - Solo si tiene bookings y NO es negocio de entrenamiento */}
          {features.hasBookings && !features.hasTraining && (
            <Link
              href="/admin/bookings"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Calendario de {features.labels.booking}s</p>
                <p className="text-xs text-white/60">Gestionar agenda</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
                <p className="text-xs text-white/60">Gestionar catálogo</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Reparaciones - Solo si tiene repairs */}
          {features.hasRepairs && (
            <>
              <Link
                href="/admin/repair"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{features.labels.services}</p>
                  <p className="text-xs text-white/60">Órdenes de reparación</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/admin/services"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Servicios del Taller</p>
                  <p className="text-xs text-white/60">Configura precios y tiempos</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </Link>
            </>
          )}

          {/* Entrenamiento - Solo si es negocio fitness */}
          {features.hasTraining && (
            <>
              <Link
                href="/admin/training"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Inscripciones</p>
                  <p className="text-xs text-white/60">Clientes y horarios de entrenamiento</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/admin/training/packages"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Planes de Entrenamiento</p>
                  <p className="text-xs text-white/60">Configura tus planes y precios</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </Link>
            </>
          )}

          {/* Mayoristas - Solo si el negocio tiene wholesale */}
          {features.hasWholesale && (
            <Link
              href="/admin/wholesale"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mayoristas</p>
                <p className="text-xs text-white/60">Gestionar distribuidores y códigos</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Solicitudes Mayoristas - Solo si tiene wholesale */}
          {features.hasWholesale && (
            <Link
              href="/admin/wholesale-requests"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Solicitudes Mayoristas</p>
                <p className="text-xs text-white/60">Nuevos distribuidores</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Cotizaciones - Solo si está habilitado */}
          {shop?.requestQuoteEnabled && (
            <Link
              href="/admin/quote-requests"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <MessageSquarePlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Cotizaciones</p>
                <p className="text-xs text-white/60">Solicitudes de clientes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Chat en Vivo - Siempre visible */}
          <Link
            href="/admin/chat"
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Chat en Vivo</p>
              <p className="text-xs text-white/60">Atender clientes en tiempo real</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </Link>

          {/* Financiamiento - Solo si está habilitado */}
          {shop?.financingEnabled && (
            <Link
              href="/admin/financing"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Financiamiento</p>
                <p className="text-xs text-white/60">Solicitudes BANFONDESA</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Página de Inicio - Visible si usa tech-premium-v2 */}
          {shop?.templateType === "tech-premium-v2" && (
            <Link
              href="/admin/homepage"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Página de Inicio</p>
                <p className="text-xs text-white/60">Editar tarjetas y descripciones</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Sucursales - Solo si tiene multiLocation habilitado */}
          {shop?.enabledFeatures?.includes("multiLocation") && (
            <Link
              href="/admin/branches"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Sucursales</p>
                <p className="text-xs text-white/60">Gestionar ubicaciones</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Finanzas — Solo dueño/admin */}
          {(user?.role === "SHOP_OWNER" || user?.role === "SUPER_ADMIN") && (
            <Link
              href="/admin/finanzas"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Finanzas</p>
                <p className="text-xs text-white/60">Resumen financiero por sucursal</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Cuadres — Dueño ve todos, Empleado ve el suyo */}
          {user?.role === "SHOP_OWNER" || user?.role === "SUPER_ADMIN" ? (
            <Link
              href="/admin/cuadres"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Cuadres</p>
                <p className="text-xs text-white/60">Revisión de actividad por empleado</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          ) : user?.role === "SHOP_STAFF" ? (
            <Link
              href="/admin/mi-cuadre"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Mi Cuadre</p>
                <p className="text-xs text-white/60">Registrar ventas, reparaciones y servicios</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          ) : null}

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
                <p className="text-xs text-white/60">Gestionar alquileres</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Meal Prep - Solo si es negocio meal prep */}
          {shop?.businessType === "meal_prep" && (
            <Link
              href="/admin/settings/meal-prep"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group border-indigo-500/30"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Meal Prep</p>
                <p className="text-xs text-white/60">Reglas y Categorías</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
                <p className="text-xs text-white/60">Gestionar reservas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
              <p className="text-xs text-white/60">Stories Instagram</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
              <p className="text-xs text-white/60">Colores, fondo, efectos</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </Link>

          {/* Fotos — Solo Viora Premium */}
          {shop?.templateType === "viora-premium" && (
            <Link
              href="/admin/viora-fotos"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-pink-500/20 hover:border-pink-500/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Fotos del Sitio</p>
                <p className="text-xs text-white/60">Cambiar fotos de portada y secciones</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

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
                <p className="text-xs text-white/60">Ver facturación</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
                <p className="text-xs text-white/60">Teléfono, redes sociales, dirección</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </Link>
          )}

          {/* Horarios - Acceso directo a Configuración de Citas */}
          {!isSuperAdmin && features.hasBookings && !features.hasTraining && (
            <Link
              href="/admin/bookings/settings"
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Horarios de Atención</p>
                <p className="text-xs text-white/60">Configura disponibilidad y citas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
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
        <div className="animate-pulse flex flex-col items-center gap-4 text-white/50">
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
                <p className="text-white/70 text-sm">
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

                {/* Cotizaciones - Solo si está habilitado */}
                {shop?.requestQuoteEnabled && (
                  <Link href="/admin/quote-requests">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-emerald-400 hover:text-emerald-300">
                      <MessageSquarePlus className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Cotizaciones</span>
                    </Button>
                  </Link>
                )}

                {/* Chat en Vivo */}
                <Link href="/admin/chat">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-sky-400 hover:text-sky-300">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Chat</span>
                  </Button>
                </Link>

                {/* Financiamiento - Solo si está habilitado */}
                {shop?.financingEnabled && (
                  <Link href="/admin/financing">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-blue-400 hover:text-blue-300">
                      <CreditCard className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Financiamiento</span>
                    </Button>
                  </Link>
                )}

                {/* Página de Inicio */}
                {shop?.templateType === "tech-premium-v2" && (
                  <Link href="/admin/homepage">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-violet-400 hover:text-violet-300">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Inicio</span>
                    </Button>
                  </Link>
                )}

                {/* Fotos — Solo Viora Premium */}
                {shop?.templateType === "viora-premium" && (
                  <Link href="/admin/viora-fotos">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-pink-400 hover:text-pink-300">
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Fotos</span>
                    </Button>
                  </Link>
                )}

                {/* Citas/Reservaciones - Solo si tiene bookings y NO es entrenamiento */}
                {features.adminModules.bookings && !features.hasTraining && (
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
                  <>
                    <Link href="/admin/repair">
                      <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-orange-400 hover:text-orange-300">
                        <Wrench className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">{features.labels.services}</span>
                      </Button>
                    </Link>
                    <Link href="/admin/services">
                      <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-amber-400 hover:text-amber-300">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Servicios</span>
                      </Button>
                    </Link>
                  </>
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

                {/* Cuadres — visible según rol */}
                {(user?.role === "SHOP_OWNER" || user?.role === "SUPER_ADMIN") && (
                  <Link href="/admin/cuadres">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-emerald-400 hover:text-emerald-300">
                      <ClipboardList className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Cuadres</span>
                    </Button>
                  </Link>
                )}
                {user?.role === "SHOP_STAFF" && (
                  <Link href="/admin/mi-cuadre">
                    <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-emerald-400 hover:text-emerald-300">
                      <ClipboardList className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Mi Cuadre</span>
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


"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  Sparkles,
  Ban,
  UserX,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import {
  getBookingsForDate,
  getBookingConfig,
  confirmBooking,
  cancelBooking,
  updateBooking,
  getBookingsForDateRange,
} from "@/lib/services/booking.service";
import type { Booking, BookingStatus, BookingConfig } from "@/lib/types/booking.types";

// Status configuration
const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "Confirmada", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle className="w-4 h-4" /> },
  rescheduled: { label: "Reagendada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <RefreshCw className="w-4 h-4" /> },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-4 h-4" /> },
  completed: { label: "Completada", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <CheckCircle className="w-4 h-4" /> },
  no_show: { label: "No asistió", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <UserX className="w-4 h-4" /> },
};

// Day names
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function CalendarView({
  currentMonth,
  selectedDate,
  bookingsByDate,
  onDateSelect,
  onMonthChange,
}: {
  currentMonth: Date;
  selectedDate: string;
  bookingsByDate: Record<string, number>;
  onDateSelect: (date: string) => void;
  onMonthChange: (delta: number) => void;
}) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onMonthChange(-1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => onMonthChange(1)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = date.toISOString().split("T")[0];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const bookingCount = bookingsByDate[dateStr] || 0;
          const isPast = dateStr < today;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
                isSelected
                  ? "bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-slate-900"
                  : isToday
                    ? "bg-white/10 text-white font-bold"
                    : isPast
                      ? "text-slate-600 hover:bg-white/5"
                      : "text-slate-300 hover:bg-white/10"
              )}
            >
              <span>{date.getDate()}</span>
              {bookingCount > 0 && (
                <div className={cn(
                  "absolute bottom-1 flex gap-0.5",
                  isSelected ? "opacity-80" : ""
                )}>
                  {bookingCount <= 3 ? (
                    Array.from({ length: bookingCount }).map((_, i) => (
                      <div key={i} className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-white" : "bg-primary"
                      )} />
                    ))
                  ) : (
                    <span className={cn(
                      "text-[10px] font-bold",
                      isSelected ? "text-white" : "text-primary"
                    )}>
                      {bookingCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  isLoading,
}: {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  isLoading: boolean;
}) {
  const config = STATUS_CONFIG[booking.status];
  const isPast = booking.date < new Date().toISOString().split("T")[0];
  const canConfirm = booking.status === "pending";
  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canComplete = booking.status === "confirmed" && isPast;
  const canMarkNoShow = booking.status === "confirmed" && isPast;

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-white font-medium">{booking.serviceName}</p>
            <p className="text-xs text-slate-400">{booking.serviceDuration} min • ${booking.servicePrice}</p>
          </div>
        </div>
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1", config.color)}>
          {config.icon}
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{booking.time} - {booking.endTime}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <User className="w-4 h-4 text-slate-500" />
          <span>{booking.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 col-span-2">
          <Phone className="w-4 h-4 text-slate-500" />
          <span>{booking.customerPhone}</span>
          <a
            href={`https://wa.me/${booking.customerPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-green-400 hover:text-green-300"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>

      {booking.notes && (
        <p className="text-xs text-slate-400 mb-3 p-2 rounded bg-white/5">
          📝 {booking.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {canConfirm && (
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500 text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmar
          </Button>
        )}
        {canComplete && (
          <Button
            size="sm"
            onClick={onComplete}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
          </Button>
        )}
        {canMarkNoShow && (
          <Button
            size="sm"
            variant="outline"
            onClick={onNoShow}
            disabled={isLoading}
            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 text-xs"
          >
            <UserX className="w-3 h-3 mr-1" />
            No asistió
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
          >
            <Ban className="w-3 h-3 mr-1" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}

function BookingsPageContent() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const shopId = shop?.slug || user?.shopId || "";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsByDate, setBookingsByDate] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [config, setConfig] = useState<BookingConfig | null>(null);

  // Load config
  useEffect(() => {
    if (shopId) {
      getBookingConfig(shopId).then(setConfig);
    }
  }, [shopId]);

  // Load bookings for the month (to show dots on calendar)
  useEffect(() => {
    async function loadMonthBookings() {
      if (!shopId) return;

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Format dates as YYYY-MM-DD
      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      // Get all bookings for the month
      const monthBookings = await getBookingsForDateRange(shopId, startDate, endDate);

      const counts: Record<string, number> = {};
      monthBookings.forEach((b) => {
        if (b.status !== "cancelled") {
          counts[b.date] = (counts[b.date] || 0) + 1;
        }
      });

      setBookingsByDate(counts);
    }

    loadMonthBookings();
  }, [shopId, currentMonth]);

  // Load bookings for selected date
  useEffect(() => {
    async function loadDayBookings() {
      if (!shopId) return;

      setIsLoading(true);
      try {
        const dayBookings = await getBookingsForDate(shopId, selectedDate);
        setBookings(dayBookings);
      } catch (error) {
        console.error("Error loading bookings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDayBookings();
  }, [shopId, selectedDate]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  // Actions
  const handleConfirm = async (bookingId: string) => {
    setIsActionLoading(bookingId);
    try {
      await confirmBooking(shopId, bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" as BookingStatus } : b))
      );
    } catch (error) {
      console.error("Error confirming booking:", error);
      alert("Error al confirmar la cita");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("¿Cancelar esta cita?")) return;

    setIsActionLoading(bookingId);
    try {
      await cancelBooking(shopId, bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" as BookingStatus } : b))
      );
      // Update count for calendar
      setBookingsByDate((prev) => ({
        ...prev,
        [selectedDate]: Math.max(0, (prev[selectedDate] || 1) - 1),
      }));
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Error al cancelar la cita");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setIsActionLoading(bookingId);
    try {
      await updateBooking(shopId, bookingId, { status: "completed" });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "completed" as BookingStatus } : b))
      );
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Error al completar la cita");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleNoShow = async (bookingId: string) => {
    if (!confirm("¿Marcar como no asistió?")) return;

    setIsActionLoading(bookingId);
    try {
      await updateBooking(shopId, bookingId, { status: "no_show" });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "no_show" as BookingStatus } : b))
      );
    } catch (error) {
      console.error("Error marking no-show:", error);
      alert("Error al marcar como no asistió");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleMonthChange = (delta: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const formatSelectedDate = () => {
    const date = new Date(selectedDate + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Calendario de Citas
              </h1>
              <p className="text-xs text-slate-400">{shop?.name || "Mi Negocio"}</p>
            </div>
          </div>

          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              Configurar Horarios
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <CalendarView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              bookingsByDate={bookingsByDate}
              onDateSelect={setSelectedDate}
              onMonthChange={handleMonthChange}
            />

            {/* Quick Stats */}
            <div className="mt-6 glass-panel rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Resumen del día</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{bookings.length}</p>
                  <p className="text-xs text-slate-400">Total citas</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-500/10">
                  <p className="text-2xl font-bold text-green-400">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-xs text-slate-400">Confirmadas</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-400">
                    {bookings.filter((b) => b.status === "pending").length}
                  </p>
                  <p className="text-xs text-slate-400">Pendientes</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-primary/10">
                  <p className="text-2xl font-bold text-primary">
                    ${bookings.filter((b) => !["cancelled", "no_show"].includes(b.status)).reduce((sum, b) => sum + b.servicePrice, 0)}
                  </p>
                  <p className="text-xs text-slate-400">Ingresos est.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-2xl p-6">
              {/* Date Header & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white capitalize">
                    {formatSelectedDate()}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {filteredBookings.length} cita{filteredBookings.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                    <option value="no_show">No asistió</option>
                  </select>
                </div>
              </div>

              {/* Bookings */}
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-slate-400">Cargando citas...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No hay citas para este día</p>
                  <p className="text-sm text-slate-500">
                    Las citas aparecerán aquí cuando los clientes las agenden
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onConfirm={() => handleConfirm(booking.id)}
                        onCancel={() => handleCancel(booking.id)}
                        onComplete={() => handleComplete(booking.id)}
                        onNoShow={() => handleNoShow(booking.id)}
                        isLoading={isActionLoading === booking.id}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BookingsPage() {
  return <BookingsPageContent />;
}

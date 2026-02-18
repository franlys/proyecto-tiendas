"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Bell,
  Settings,
  Save,
  Check,
  Loader2,
  CalendarRange,
  Timer,
  AlertTriangle,
  Phone,
  ToggleLeft,
  ToggleRight,
  CalendarX,
  Plus,
  X,
  Trash2,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { BookingConfig } from "@/lib/types/booking.types";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking.types";

// Days of the week
const DAYS_OF_WEEK = [
  { id: 0, name: "Domingo", short: "Dom" },
  { id: 1, name: "Lunes", short: "Lun" },
  { id: 2, name: "Martes", short: "Mar" },
  { id: 3, name: "Miércoles", short: "Mié" },
  { id: 4, name: "Jueves", short: "Jue" },
  { id: 5, name: "Viernes", short: "Vie" },
  { id: 6, name: "Sábado", short: "Sáb" },
];

// Time options for select inputs
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

// Duration options (in minutes) - expanded for different business types
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
  { value: 150, label: "2.5 horas" },
  { value: 180, label: "3 horas" },
  { value: 210, label: "3.5 horas" },
  { value: 240, label: "4 horas" },
];

// Buffer options
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30];

export default function BookingSettingsPage() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const shopId = shop?.slug || user?.shopId || "";

  const [config, setConfig] = useState<BookingConfig>(DEFAULT_BOOKING_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClosedDate, setNewClosedDate] = useState("");

  // Load config from API
  useEffect(() => {
    async function loadConfig() {
      if (!shopId) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/bookings/config?shopId=${shopId}`);
        if (response.ok) {
          const data = await response.json();
          setConfig({ ...DEFAULT_BOOKING_CONFIG, ...data.config });
        }
      } catch (err) {
        console.error("Error loading config:", err);
        setError("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [shopId]);

  // Save config
  const handleSave = async () => {
    if (!shopId) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...config }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Error saving config:", err);
      setError("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Update config
  const updateConfig = (updates: Partial<BookingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setIsSaved(false);
  };

  // Toggle closed day
  const toggleClosedDay = (dayId: number) => {
    setConfig((prev) => {
      const newClosedDays = prev.closedDays.includes(dayId)
        ? prev.closedDays.filter((d) => d !== dayId)
        : [...prev.closedDays, dayId];
      return { ...prev, closedDays: newClosedDays };
    });
    setIsSaved(false);
  };

  // Add closed date (one-time closure)
  const addClosedDate = () => {
    if (!newClosedDate) return;

    const closedDates = config.closedDates || [];
    if (!closedDates.includes(newClosedDate)) {
      setConfig((prev) => ({
        ...prev,
        closedDates: [...(prev.closedDates || []), newClosedDate].sort(),
      }));
      setIsSaved(false);
    }
    setNewClosedDate("");
  };

  // Remove closed date
  const removeClosedDate = (date: string) => {
    setConfig((prev) => ({
      ...prev,
      closedDates: (prev.closedDates || []).filter((d) => d !== date),
    }));
    setIsSaved(false);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Calculate max appointments per day based on schedule
  const calculateMaxAppointments = () => {
    const [openH, openM] = config.openTime.split(":").map(Number);
    const [closeH, closeM] = config.closeTime.split(":").map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    let totalMinutes = closeMinutes - openMinutes;

    // Subtract break time if enabled
    if (config.breakEnabled && config.breakStartTime && config.breakEndTime) {
      const [breakStartH, breakStartM] = config.breakStartTime.split(":").map(Number);
      const [breakEndH, breakEndM] = config.breakEndTime.split(":").map(Number);
      const breakStart = breakStartH * 60 + breakStartM;
      const breakEnd = breakEndH * 60 + breakEndM;
      const breakDuration = breakEnd - breakStart;
      if (breakDuration > 0) {
        totalMinutes -= breakDuration;
      }
    }

    const slotWithBuffer = config.slotDurationMinutes + config.bufferMinutes;

    if (slotWithBuffer <= 0) return 0;

    return Math.floor(totalMinutes / slotWithBuffer);
  };

  // Calculate working hours
  const calculateWorkingHours = () => {
    const [openH, openM] = config.openTime.split(":").map(Number);
    const [closeH, closeM] = config.closeTime.split(":").map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    let totalMinutes = closeMinutes - openMinutes;

    // Subtract break time if enabled
    if (config.breakEnabled && config.breakStartTime && config.breakEndTime) {
      const [breakStartH, breakStartM] = config.breakStartTime.split(":").map(Number);
      const [breakEndH, breakEndM] = config.breakEndTime.split(":").map(Number);
      const breakStart = breakStartH * 60 + breakStartM;
      const breakEnd = breakEndH * 60 + breakEndM;
      const breakDuration = breakEnd - breakStart;
      if (breakDuration > 0) {
        totalMinutes -= breakDuration;
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  if (!shopId || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/bookings"
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    Configuración del Calendario
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Horarios, duración de citas y recordatorios
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaved || isSaving}>
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enable/Disable Booking */}
            <div className="glass-panel rounded-2xl p-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => updateConfig({ enabled: !config.enabled })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      config.enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-slate-400"
                    )}
                  >
                    {config.enabled ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">
                      Sistema de Reservaciones
                    </h2>
                    <p className="text-sm text-slate-400">
                      {config.enabled
                        ? "Los clientes pueden agendar citas"
                        : "Las reservaciones están desactivadas"}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-colors",
                    config.enabled ? "bg-green-500" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform",
                      config.enabled ? "translate-x-8" : "translate-x-1"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                Horario de Atención
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Open Time */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Hora de Apertura
                  </label>
                  <select
                    value={config.openTime}
                    onChange={(e) => updateConfig({ openTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time} className="bg-slate-800">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Close Time */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Hora de Cierre
                  </label>
                  <select
                    value={config.closeTime}
                    onChange={(e) => updateConfig({ closeTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time} className="bg-slate-800">
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Closed Days */}
              <div className="mt-6">
                <label className="block text-sm text-slate-400 mb-3">
                  Días Cerrados
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isClosed = config.closedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleClosedDay(day.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg border transition-all",
                          isClosed
                            ? "bg-red-500/20 border-red-500/30 text-red-400"
                            : "bg-white/5 border-white/10 text-slate-300 hover:border-white/30"
                        )}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Los días marcados no estarán disponibles para reservar
                </p>
              </div>

              {/* Break Time */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors mb-4"
                  onClick={() => updateConfig({ breakEnabled: !config.breakEnabled })}
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Horario de Descanso</p>
                      <p className="text-xs text-slate-500">
                        {config.breakEnabled
                          ? `${config.breakStartTime} - ${config.breakEndTime}`
                          : "Sin horario de descanso configurado"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      config.breakEnabled ? "bg-amber-500" : "bg-white/20"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        config.breakEnabled ? "translate-x-7" : "translate-x-1"
                      )}
                    />
                  </div>
                </div>

                {config.breakEnabled && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Inicio del descanso
                      </label>
                      <select
                        value={config.breakStartTime}
                        onChange={(e) => updateConfig({ breakStartTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time} className="bg-slate-800">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Fin del descanso
                      </label>
                      <select
                        value={config.breakEndTime}
                        onChange={(e) => updateConfig({ breakEndTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                      >
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time} className="bg-slate-800">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Temporary Closures (Specific Dates) */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CalendarX className="w-4 h-4 text-gold" />
                Cierres Temporales
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Cierra días específicos sin cambiar tu horario regular
              </p>

              {/* Add new date */}
              <div className="flex gap-2 mb-4">
                <input
                  type="date"
                  value={newClosedDate}
                  onChange={(e) => setNewClosedDate(e.target.value)}
                  min={getTodayDate()}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
                <Button
                  onClick={addClosedDate}
                  disabled={!newClosedDate}
                  variant="outline"
                  className="px-4"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* List of closed dates */}
              {config.closedDates && config.closedDates.length > 0 ? (
                <div className="space-y-2">
                  {config.closedDates
                    .filter((d) => d >= getTodayDate())
                    .sort()
                    .map((date) => (
                      <div
                        key={date}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <CalendarX className="w-4 h-4 text-red-400" />
                          <span className="text-white">{formatDate(date)}</span>
                        </div>
                        <button
                          onClick={() => removeClosedDate(date)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <CalendarX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay cierres temporales programados</p>
                </div>
              )}

              <p className="text-xs text-slate-500 mt-4">
                Tip: También puedes cerrar días desde WhatsApp con el comando "Cerrar mañana" o "Cerrar 20 de febrero"
              </p>
            </div>

            {/* Slot Configuration */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Timer className="w-4 h-4 text-gold" />
                Configuración de Citas
              </h2>

              <p className="text-sm text-slate-400 mb-4">
                Configura el tiempo promedio que tardas en atender a cada cliente.
                Por ejemplo: uñas (2h), maquillaje (1.5h), corte de pelo (45min), etc.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Slot Duration */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Duración promedio de cada cita
                  </label>
                  <select
                    value={config.slotDurationMinutes}
                    onChange={(e) =>
                      updateConfig({ slotDurationMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-800">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Tiempo que dura atender a un cliente
                  </p>
                </div>

                {/* Buffer Time */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Tiempo de preparación
                  </label>
                  <select
                    value={config.bufferMinutes}
                    onChange={(e) =>
                      updateConfig({ bufferMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    {BUFFER_OPTIONS.map((buffer) => (
                      <option key={buffer} value={buffer} className="bg-slate-800">
                        {buffer === 0 ? "Sin descanso" : `${buffer} minutos`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Tiempo para preparar el espacio entre citas
                  </p>
                </div>
              </div>

              {/* Calculated Max Appointments */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-gold/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Citas máximas por día</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Jornada de {calculateWorkingHours()} con citas de {formatDuration(config.slotDurationMinutes)}
                      {config.bufferMinutes > 0 && ` + ${config.bufferMinutes}min preparación`}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {calculateMaxAppointments()}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Limits */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-gold" />
                Límites de Reservación
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Max Advance Days */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Máximo días de anticipación
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={config.maxAdvanceBookingDays}
                      onChange={(e) =>
                        updateConfig({
                          maxAdvanceBookingDays: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      días
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Hasta cuántos días en el futuro se puede reservar
                  </p>
                </div>

                {/* Min Advance Hours */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Mínimo horas de anticipación
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="72"
                      value={config.minAdvanceBookingHours}
                      onChange={(e) =>
                        updateConfig({
                          minAdvanceBookingHours: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      horas
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tiempo mínimo antes de la cita para reservar
                  </p>
                </div>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-gold" />
                Recordatorios
              </h2>

              {/* Enable Reminders */}
              <div
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() =>
                  updateConfig({ reminderEnabled: !config.reminderEnabled })
                }
              >
                <div>
                  <p className="text-white font-medium">
                    Enviar recordatorios por WhatsApp
                  </p>
                  <p className="text-xs text-slate-500">
                    Notificar a los clientes antes de su cita
                  </p>
                </div>
                <div
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    config.reminderEnabled ? "bg-primary" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      config.reminderEnabled ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </div>
              </div>

              {config.reminderEnabled && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Enviar recordatorio
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={config.reminderHoursBefore}
                      onChange={(e) =>
                        updateConfig({
                          reminderHoursBefore: parseInt(e.target.value),
                        })
                      }
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="1" className="bg-slate-800">1 hora</option>
                      <option value="2" className="bg-slate-800">2 horas</option>
                      <option value="4" className="bg-slate-800">4 horas</option>
                      <option value="12" className="bg-slate-800">12 horas</option>
                      <option value="24" className="bg-slate-800">24 horas (1 día)</option>
                      <option value="48" className="bg-slate-800">48 horas (2 días)</option>
                    </select>
                    <span className="text-slate-400">antes de la cita</span>
                  </div>
                </div>
              )}
            </div>

            {/* Business Notifications */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                Notificaciones al Negocio
              </h2>

              {/* Phone Number */}
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Teléfono para notificaciones
                </label>
                <input
                  type="tel"
                  value={config.businessNotificationPhone}
                  onChange={(e) =>
                    updateConfig({ businessNotificationPhone: e.target.value })
                  }
                  placeholder="521234567890"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Número con código de país (ej: 521234567890)
                </p>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3">
                {[
                  {
                    key: "notifyBusinessOnConfirm",
                    label: "Cuando un cliente confirma su cita",
                  },
                  {
                    key: "notifyBusinessOnCancel",
                    label: "Cuando un cliente cancela su cita",
                  },
                  {
                    key: "notifyBusinessOnReschedule",
                    label: "Cuando un cliente reagenda su cita",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() =>
                      updateConfig({
                        [item.key]: !config[item.key as keyof BookingConfig],
                      } as Partial<BookingConfig>)
                    }
                  >
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <div
                      className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        config[item.key as keyof BookingConfig]
                          ? "bg-primary"
                          : "bg-white/20"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          config[item.key as keyof BookingConfig]
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview / Summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gold" />
                Resumen
              </h2>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Estado</span>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      config.enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {config.enabled ? "Activo" : "Desactivado"}
                  </span>
                </div>

                {/* Hours */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Horario</span>
                  <span className="text-white font-medium">
                    {config.openTime} - {config.closeTime}
                  </span>
                </div>

                {/* Break Time */}
                {config.breakEnabled && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Coffee className="w-3 h-3 text-amber-400" />
                      Descanso
                    </span>
                    <span className="text-amber-400 font-medium">
                      {config.breakStartTime} - {config.breakEndTime}
                    </span>
                  </div>
                )}

                {/* Slot Duration */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Duración cita</span>
                  <span className="text-white font-medium">
                    {formatDuration(config.slotDurationMinutes)}
                  </span>
                </div>

                {/* Max Appointments */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-slate-400">Citas por día</span>
                  <span className="text-primary font-bold text-lg">
                    {calculateMaxAppointments()}
                  </span>
                </div>

                {/* Closed Days */}
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400 block mb-2">Días cerrados</span>
                  <div className="flex flex-wrap gap-1">
                    {config.closedDays.length === 0 ? (
                      <span className="text-slate-500 text-sm">
                        Abierto todos los días
                      </span>
                    ) : (
                      config.closedDays
                        .sort((a, b) => a - b)
                        .map((dayId) => (
                          <span
                            key={dayId}
                            className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs"
                          >
                            {DAYS_OF_WEEK.find((d) => d.id === dayId)?.short}
                          </span>
                        ))
                    )}
                  </div>
                </div>

                {/* Temporary Closures */}
                {config.closedDates && config.closedDates.filter(d => d >= getTodayDate()).length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-slate-400 block mb-2">Cierres temporales</span>
                    <div className="flex flex-wrap gap-1">
                      {config.closedDates
                        .filter(d => d >= getTodayDate())
                        .slice(0, 3)
                        .map((date) => (
                          <span
                            key={date}
                            className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs"
                          >
                            {formatDate(date)}
                          </span>
                        ))}
                      {config.closedDates.filter(d => d >= getTodayDate()).length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-white/10 text-slate-400 text-xs">
                          +{config.closedDates.filter(d => d >= getTodayDate()).length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Reminders */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Recordatorios</span>
                  <span className="text-white font-medium">
                    {config.reminderEnabled
                      ? `${config.reminderHoursBefore}h antes`
                      : "Desactivados"}
                  </span>
                </div>

                {/* Booking Window */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-slate-400">Ventana de reserva</span>
                  <span className="text-white font-medium text-sm">
                    {config.minAdvanceBookingHours}h - {config.maxAdvanceBookingDays}d
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-slate-400 text-sm mb-3">Acciones rápidas</p>
                <div className="space-y-2">
                  <Link
                    href="/admin/bookings/services"
                    className="block w-full px-4 py-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold text-sm text-center transition-colors"
                  >
                    Configurar Servicios
                  </Link>
                  <Link
                    href="/admin/bookings"
                    className="block w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm text-center transition-colors"
                  >
                    Ver Calendario de Citas
                  </Link>
                  <Link
                    href={`/${shopId}/book`}
                    target="_blank"
                    className="block w-full px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm text-center transition-colors"
                  >
                    Vista del Cliente
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

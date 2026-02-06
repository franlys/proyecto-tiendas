"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  Calendar,
  Clock,
  Bell,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Phone,
} from "lucide-react";
import type { BookingConfig } from "@/lib/types/booking.types";
import { DEFAULT_BOOKING_CONFIG } from "@/lib/types/booking.types";

interface BookingConfigPanelProps {
  shopId: string;
}

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

export function BookingConfigPanel({ shopId }: BookingConfigPanelProps) {
  const [config, setConfig] = useState<BookingConfig>(DEFAULT_BOOKING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [shopId]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/bookings/config?shopId=${shopId}`);
      const data = await res.json();
      if (data.config) {
        setConfig({ ...DEFAULT_BOOKING_CONFIG, ...data.config });
      }
    } catch (error) {
      console.error("Error fetching booking config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/bookings/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...config }),
      });

      if (res.ok) {
        alert("Configuracion guardada");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleClosedDay = (day: number) => {
    setConfig((prev) => ({
      ...prev,
      closedDays: prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day],
    }));
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Sistema de Reservaciones
            </h3>
            <p className="text-slate-400 text-sm">
              Permite a clientes agendar citas online
            </p>
          </div>
        </div>

        <button
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className="flex items-center gap-2"
        >
          {config.enabled ? (
            <ToggleRight className="w-10 h-10 text-green-400" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-slate-500" />
          )}
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-6">
          {/* Schedule */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horario de Atencion
            </h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Hora de Apertura
                </label>
                <input
                  type="time"
                  value={config.openTime}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, openTime: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  value={config.closeTime}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, closeTime: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Duracion Slot (min)
                </label>
                <select
                  value={config.slotDurationMinutes}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      slotDurationMinutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                </select>
              </div>
            </div>
          </div>

          {/* Closed Days */}
          <div>
            <label className="block text-sm text-slate-400 mb-3">
              Dias Cerrado
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleClosedDay(day.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.closedDays.includes(day.value)
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-surface text-slate-400 border border-white/10 hover:border-white/30"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="p-4 rounded-xl bg-surface/50 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-white font-medium">Recordatorios WhatsApp</p>
                  <p className="text-sm text-slate-400">
                    Enviar recordatorio antes de la cita
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    reminderEnabled: !prev.reminderEnabled,
                  }))
                }
              >
                {config.reminderEnabled ? (
                  <ToggleRight className="w-8 h-8 text-green-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-500" />
                )}
              </button>
            </div>

            {config.reminderEnabled && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Horas antes de la cita
                </label>
                <select
                  value={config.reminderHoursBefore}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      reminderHoursBefore: parseInt(e.target.value),
                    }))
                  }
                  className="w-full sm:w-48 px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                >
                  <option value={2}>2 horas</option>
                  <option value={4}>4 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>48 horas</option>
                </select>
              </div>
            )}
          </div>

          {/* Business Notifications */}
          <div className="p-4 rounded-xl bg-surface/50 border border-white/10 space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Notificaciones al Negocio
            </h4>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                WhatsApp del Negocio
              </label>
              <input
                type="tel"
                value={config.businessNotificationPhone}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    businessNotificationPhone: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div className="space-y-3">
              {[
                { key: "notifyBusinessOnConfirm", label: "Cuando cliente confirma" },
                { key: "notifyBusinessOnCancel", label: "Cuando cliente cancela" },
                { key: "notifyBusinessOnReschedule", label: "Cuando cliente reagenda" },
              ].map((opt) => (
                <div key={opt.key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{opt.label}</span>
                  <button
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        [opt.key]: !prev[opt.key as keyof BookingConfig],
                      }))
                    }
                  >
                    {config[opt.key as keyof BookingConfig] ? (
                      <ToggleRight className="w-6 h-6 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Palabras Confirmar
              </label>
              <input
                type="text"
                value={config.confirmKeywords.join(", ")}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    confirmKeywords: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white text-sm"
                placeholder="SI, CONFIRMO"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Palabras Reagendar
              </label>
              <input
                type="text"
                value={config.rescheduleKeywords.join(", ")}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rescheduleKeywords: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white text-sm"
                placeholder="CAMBIAR, MOVER"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Palabras Cancelar
              </label>
              <input
                type="text"
                value={config.cancelKeywords.join(", ")}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    cancelKeywords: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white text-sm"
                placeholder="CANCELAR, NO VOY"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={saveConfig} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuracion
              </>
            )}
          </Button>
        </div>
      )}

      {!config.enabled && (
        <p className="text-slate-500 text-sm">
          Activa esta funcion para permitir que tus clientes agenden citas desde tu pagina web.
        </p>
      )}
    </div>
  );
}

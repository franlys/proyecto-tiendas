"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  X,
  Clock,
  Calendar,
  Sparkles,
  Star,
  Loader2,
  Check,
  Save,
  Palmtree,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button, PhoneInput, type PhoneInputValue } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  type BeautyStaff,
  type BeautyStaffRole,
  type WeeklySchedule,
  type DaySchedule,
  type TimeOff,
  type TimeOffType,
  BEAUTY_STAFF_ROLES,
  TIME_OFF_TYPES,
  DEFAULT_WEEKLY_SCHEDULE,
} from "@/lib/types/staff.types";
import { useAuth } from "@/components/shared";

// Types for local state
interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  role: BeautyStaffRole;
  services: string[];
  schedule: WeeklySchedule;
  avatar?: string;
  commissionRate?: number;
}

interface BookingService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

const DAY_NAMES: Record<keyof Omit<WeeklySchedule, "breakEnabled" | "breakStartTime" | "breakEndTime">, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

// Staff Modal Component
function StaffModal({
  isOpen,
  onClose,
  editStaff,
  shopId,
  availableServices,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  editStaff?: BeautyStaff;
  shopId: string;
  availableServices: BookingService[];
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    role: "stylist",
    services: [],
    schedule: { ...DEFAULT_WEEKLY_SCHEDULE },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "services" | "schedule" | "timeoff">("info");
  const [timeOffList, setTimeOffList] = useState<TimeOff[]>([]);
  const [newTimeOff, setNewTimeOff] = useState<{
    type: TimeOffType;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    type: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isAddingTimeOff, setIsAddingTimeOff] = useState(false);

  // Reset form when opening/closing or changing staff
  useEffect(() => {
    if (editStaff) {
      setFormData({
        name: editStaff.name,
        email: editStaff.email || "",
        phone: editStaff.phone || "",
        role: editStaff.role,
        services: editStaff.services || [],
        schedule: editStaff.schedule || { ...DEFAULT_WEEKLY_SCHEDULE },
        avatar: editStaff.avatar || undefined,
        commissionRate: editStaff.commissionRate || undefined,
      });
      setTimeOffList(editStaff.timeOff || []);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "stylist",
        services: [],
        schedule: { ...DEFAULT_WEEKLY_SCHEDULE },
      });
      setTimeOffList([]);
    }
    setActiveTab("info");
    setNewTimeOff({ type: "vacation", startDate: "", endDate: "", reason: "" });
    setIsAddingTimeOff(false);
  }, [editStaff, isOpen]);

  // Add time-off
  const handleAddTimeOff = async () => {
    if (!editStaff || !newTimeOff.startDate || !newTimeOff.endDate) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/staff/${editStaff.id}/time-off`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          ...newTimeOff,
          approved: true, // Auto-approve when adding from admin
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTimeOffList([...timeOffList, data.timeOff]);
        setNewTimeOff({ type: "vacation", startDate: "", endDate: "", reason: "" });
        setIsAddingTimeOff(false);
      } else {
        const data = await response.json();
        alert(data.error || "Error al agregar ausencia");
      }
    } catch (error) {
      console.error("Error adding time-off:", error);
      alert("Error al agregar ausencia");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete time-off
  const handleDeleteTimeOff = async (timeOffId: string) => {
    if (!editStaff) return;

    try {
      const response = await fetch(
        `/api/staff/${editStaff.id}/time-off?shopId=${shopId}&timeOffId=${timeOffId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setTimeOffList(timeOffList.filter((t) => t.id !== timeOffId));
      }
    } catch (error) {
      console.error("Error deleting time-off:", error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editStaff
        ? `/api/staff/${editStaff.id}?shopId=${shopId}`
        : `/api/staff`;

      const body = editStaff
        ? { shopId, ...formData }
        : { shopId, ...formData };

      const response = await fetch(url, {
        method: editStaff ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || "Error al guardar");
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Error al guardar el empleado");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const updateDaySchedule = (
    day: keyof Omit<WeeklySchedule, "breakEnabled" | "breakStartTime" | "breakEndTime">,
    updates: Partial<DaySchedule>
  ) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], ...updates },
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editStaff ? "Editar Empleado" : "Nuevo Empleado"}
              </h2>
              <p className="text-sm text-white/50">
                {editStaff ? "Modifica los datos del empleado" : "Agrega un nuevo miembro al equipo"}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 flex-wrap">
            {[
              { id: "info", label: "Información", icon: Users },
              { id: "services", label: "Servicios", icon: Sparkles },
              { id: "schedule", label: "Horario", icon: Clock },
              ...(editStaff ? [{ id: "timeoff", label: "Ausencias", icon: Palmtree }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                  placeholder="María García"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    placeholder="maria@salon.com"
                  />
                </div>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value: PhoneInputValue) =>
                    setFormData({ ...formData, phone: value.fullPhone })
                  }
                  label="Teléfono"
                  variant="dark"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Rol *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BEAUTY_STAFF_ROLES) as [BeautyStaffRole, typeof BEAUTY_STAFF_ROLES.owner][]).map(
                    ([key, role]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: key })}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all",
                          formData.role === key
                            ? "border-primary bg-primary/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{role.icon}</span>
                          <span className="text-white font-medium text-sm">{role.label}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">{role.description}</p>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Tasa de Comisión (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commissionRate || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || undefined })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                  placeholder="15"
                />
              </div>
            </div>
          )}

          {/* Tab: Services */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm mb-4">
                Selecciona los servicios que este empleado puede realizar:
              </p>

              {availableServices.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/50">No hay servicios configurados</p>
                  <p className="text-white/40 text-sm mt-1">
                    Primero configura los servicios en la sección de citas
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableServices.map((service) => {
                    const isSelected = formData.services.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{service.name}</span>
                          {isSelected && <Check className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs text-white/50">
                          <span>{service.duration} min</span>
                          <span>${service.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm text-white/70">
                  <strong className="text-white">{formData.services.length}</strong> servicios seleccionados
                </p>
              </div>
            </div>
          )}

          {/* Tab: Schedule */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm mb-4">
                Configura el horario de trabajo semanal:
              </p>

              <div className="space-y-3">
                {(Object.keys(DAY_NAMES) as (keyof typeof DAY_NAMES)[]).map((day) => {
                  const daySchedule = formData.schedule[day];
                  return (
                    <div
                      key={day}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        daySchedule.isWorking
                          ? "border-white/10 bg-white/5"
                          : "border-white/5 bg-white/2 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{DAY_NAMES[day]}</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs text-white/50">
                            {daySchedule.isWorking ? "Trabaja" : "Libre"}
                          </span>
                          <div
                            className={cn(
                              "w-10 h-6 rounded-full transition-colors relative",
                              daySchedule.isWorking ? "bg-primary" : "bg-slate-600"
                            )}
                            onClick={() => updateDaySchedule(day, { isWorking: !daySchedule.isWorking })}
                          >
                            <div
                              className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                daySchedule.isWorking ? "translate-x-5" : "translate-x-1"
                              )}
                            />
                          </div>
                        </label>
                      </div>

                      {daySchedule.isWorking && (
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-xs text-white/50 mb-1">Entrada</label>
                            <input
                              type="time"
                              value={daySchedule.open || "09:00"}
                              onChange={(e) => updateDaySchedule(day, { open: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-white/50 mb-1">Salida</label>
                            <input
                              type="time"
                              value={daySchedule.close || "18:00"}
                              onChange={(e) => updateDaySchedule(day, { close: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Break Time */}
              <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Hora de descanso</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-white/50">
                      {formData.schedule.breakEnabled ? "Activo" : "Sin descanso"}
                    </span>
                    <div
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative cursor-pointer",
                        formData.schedule.breakEnabled ? "bg-primary" : "bg-slate-600"
                      )}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          schedule: { ...prev.schedule, breakEnabled: !prev.schedule.breakEnabled },
                        }))
                      }
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          formData.schedule.breakEnabled ? "translate-x-5" : "translate-x-1"
                        )}
                      />
                    </div>
                  </label>
                </div>

                {formData.schedule.breakEnabled && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Inicio</label>
                      <input
                        type="time"
                        value={formData.schedule.breakStartTime || "13:00"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            schedule: { ...prev.schedule, breakStartTime: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Fin</label>
                      <input
                        type="time"
                        value={formData.schedule.breakEndTime || "14:00"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            schedule: { ...prev.schedule, breakEndTime: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Time Off */}
          {activeTab === "timeoff" && editStaff && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 text-sm">
                  Gestiona las ausencias del empleado:
                </p>
                {!isAddingTimeOff && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTimeOff(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>

              {/* Add new time-off form */}
              {isAddingTimeOff && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Nueva Ausencia</h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingTimeOff(false)}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Tipo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(TIME_OFF_TYPES) as [TimeOffType, typeof TIME_OFF_TYPES.vacation][]).map(
                        ([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setNewTimeOff({ ...newTimeOff, type: key })}
                            className={cn(
                              "p-2 rounded-lg border text-center transition-all",
                              newTimeOff.type === key
                                ? "border-primary bg-primary/20"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            )}
                          >
                            <span className="text-lg">{config.icon}</span>
                            <p className="text-xs text-white mt-1">{config.label}</p>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Desde</label>
                      <input
                        type="date"
                        value={newTimeOff.startDate}
                        onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Hasta</label>
                      <input
                        type="date"
                        value={newTimeOff.endDate}
                        onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Motivo (opcional)</label>
                    <input
                      type="text"
                      value={newTimeOff.reason}
                      onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                      placeholder="Ej: Vacaciones de verano"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddTimeOff}
                    disabled={!newTimeOff.startDate || !newTimeOff.endDate || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Agregar Ausencia
                  </Button>
                </div>
              )}

              {/* List of time-offs */}
              {timeOffList.length === 0 ? (
                <div className="text-center py-8">
                  <Palmtree className="w-12 h-12 text-white/40 mx-auto mb-3" />
                  <p className="text-white/50">No hay ausencias registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeOffList.map((timeOff) => {
                    const typeConfig = TIME_OFF_TYPES[timeOff.type];
                    const startDate = new Date(timeOff.startDate + "T12:00:00");
                    const endDate = new Date(timeOff.endDate + "T12:00:00");
                    const isPast = endDate < new Date();
                    const isCurrent = startDate <= new Date() && endDate >= new Date();

                    return (
                      <div
                        key={timeOff.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          isPast
                            ? "border-white/5 bg-white/2 opacity-50"
                            : isCurrent
                            ? "border-primary/30 bg-primary/10"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{typeConfig.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium">{typeConfig.label}</p>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary">
                                    Activo
                                  </span>
                                )}
                                {timeOff.approved ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                )}
                              </div>
                              <p className="text-xs text-white/50">
                                {startDate.toLocaleDateString("es-MX", {
                                  day: "numeric",
                                  month: "short",
                                })}
                                {" - "}
                                {endDate.toLocaleDateString("es-MX", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              {timeOff.reason && (
                                <p className="text-xs text-white/40 mt-1">{timeOff.reason}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTimeOff(timeOff.id)}
                            className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <Button type="submit" className="w-full" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {editStaff ? "Guardar Cambios" : "Agregar Empleado"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Staff Card Component
function StaffCard({
  staff,
  onEdit,
  onDelete,
  onToggle,
}: {
  staff: BeautyStaff;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const roleConfig = BEAUTY_STAFF_ROLES[staff.role];

  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-4 border transition-all",
        staff.isActive ? "border-white/10" : "border-red-500/20 opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: `${roleConfig.color}20` }}
        >
          {staff.avatar ? (
            <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{roleConfig.icon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium truncate">{staff.name}</p>
            {!staff.isActive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                Inactivo
              </span>
            )}
          </div>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1"
            style={{ backgroundColor: `${roleConfig.color}20`, color: roleConfig.color }}
          >
            <span>{roleConfig.icon}</span>
            <span>{roleConfig.label}</span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 glass-panel rounded-xl border border-white/10 py-1 shadow-xl">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onToggle();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 flex items-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  {staff.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar este empleado?")) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-3 space-y-1">
        {staff.email && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Mail className="w-3 h-3" />
            <span className="truncate">{staff.email}</span>
          </div>
        )}
        {staff.phone && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Phone className="w-3 h-3" />
            <span>{staff.phone}</span>
          </div>
        )}
      </div>

      {/* Services */}
      {staff.services && staff.services.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>{staff.services.length} servicios</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {staff.totalBookings > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{staff.totalBookings}</p>
            <p className="text-[10px] text-white/40">Citas</p>
          </div>
          {staff.rating && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold text-white">{staff.rating.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-white/40">{staff.reviewCount} reseñas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function StaffPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Determine shopId from auth or URL
  const shopId = user?.shopId || searchParams.get("shopId") || "";

  const [staff, setStaff] = useState<BeautyStaff[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<BeautyStaff | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<BeautyStaffRole | "all">("all");

  // Fetch staff and services
  const fetchData = async () => {
    if (!shopId) return;

    setIsLoading(true);
    try {
      // Fetch staff
      const staffRes = await fetch(`/api/staff?shopId=${shopId}`);
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff || []);
      }

      // Fetch services for assignment
      const servicesRes = await fetch(`/api/bookings?shopId=${shopId}`);
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.config?.services || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const handleDelete = async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/${staffId}?shopId=${shopId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  const handleToggle = async (staffMember: BeautyStaff) => {
    try {
      const response = await fetch(`/api/staff/${staffMember.id}?shopId=${shopId}&action=toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staffMember.isActive }),
      });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error toggling staff:", error);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staff.filter((s) => s.isActive).length;

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No se encontró tienda</p>
          <p className="text-white/50 text-sm">Inicia sesión o selecciona una tienda</p>
        </div>
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
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Personal</h1>
                  <p className="text-white/50 text-sm">Gestión de empleados y horarios</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  <span className="text-2xl font-bold text-white">{activeStaff}</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Empleados Activos</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-white">{services.length}</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Servicios Disponibles</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span className="text-2xl font-bold text-cyan-400">
                    {staff.reduce((sum, s) => sum + s.totalBookings, 0)}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-1">Citas Totales</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as BeautyStaffRole | "all")}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
              >
                <option value="all">Todos los roles</option>
                {Object.entries(BEAUTY_STAFF_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.icon} {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  onEdit={() => {
                    setEditingStaff(member);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(member.id)}
                  onToggle={() => handleToggle(member)}
                />
              ))}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl border border-white/10">
                <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Sin empleados</p>
                <p className="text-white/50 text-sm">
                  {searchTerm || filterRole !== "all"
                    ? "No hay empleados que coincidan con los filtros"
                    : "Agrega tu primer empleado al equipo"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Staff Modal */}
      <StaffModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingStaff(undefined);
        }}
        editStaff={editingStaff}
        shopId={shopId}
        availableServices={services}
        onSave={fetchData}
      />
    </div>
  );
}

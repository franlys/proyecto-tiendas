"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Loader2,
  User,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useCart, type ServiceCartItem } from "@/components/shared/cart-context";
import { useShop } from "@/components/shared";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";
import type { BeautyStaff, BeautyStaffRole, BEAUTY_STAFF_ROLES } from "@/lib/types/staff.types";

// Staff role labels in Spanish
const ROLE_LABELS: Record<BeautyStaffRole, string> = {
  owner: "Dueño(a)",
  manager: "Gerente",
  stylist: "Estilista",
  colorist: "Colorista",
  nail_tech: "Manicurista",
  esthetician: "Esteticista",
  massage_therapist: "Masajista",
  makeup_artist: "Maquillista",
  barber: "Barbero",
  receptionist: "Recepcionista",
};

interface AvailableStaffMember {
  id: string;
  name: string;
  role: BeautyStaffRole;
  avatar?: string;
  rating?: number;
  availableSlots: string[];
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  shopPhone: string;
}

// Generate available time slots
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 9; hour <= 19; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 19) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return slots;
}

// Format duration in minutes to readable string
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

// Get next 14 days for selection
function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Skip Sundays (optional - can be configured per shop)
    if (date.getDay() !== 0) {
      dates.push(date);
    }
  }
  return dates;
}

export function AppointmentModal({
  isOpen,
  onClose,
  shopName,
  shopPhone,
}: AppointmentModalProps) {
  const { services, totalDuration, totalPrice, clearCart, tableId } = useCart();
  const shop = useShop(); // Get full shop data for slug and owner phone

  // Check if multi-staff mode is enabled (feature is in the features array)
  const multiStaffEnabled = shop?.features?.includes("multiStaff") ?? false;
  const totalSteps = multiStaffEnabled ? 5 : 4;

  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<AvailableStaffMember | null>(null);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; endTime: string; available: boolean }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{ id: string, number: string } | null>(null);

  const defaultTimeSlots = useMemo(() => generateTimeSlots(), []);
  const availableDates = useMemo(() => getAvailableDates(), []);

  // Fetch available staff when services change (multi-staff mode)
  useEffect(() => {
    if (!multiStaffEnabled || !shop?.slug || services.length === 0) {
      setAvailableStaff([]);
      return;
    }

    const fetchStaff = async () => {
      setIsLoadingStaff(true);
      try {
        const serviceIds = services.map(s => s.id).join(",");
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

        const response = await fetch(
          `/api/staff/available?shopId=${shop.id || shop.slug}&services=${serviceIds}&date=${dateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          setAvailableStaff(data.staff || []);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [multiStaffEnabled, shop?.slug, services]);

  // Fetch available slots when date and staff are selected
  useEffect(() => {
    if (!shop?.slug || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
        const day = selectedDate.getDate().toString().padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        let url = `/api/bookings/slots?shopId=${shop.id || shop.slug}&date=${dateStr}&duration=${totalDuration}`;

        // Add staffId if multi-staff mode and staff selected
        if (multiStaffEnabled && selectedStaff) {
          url += `&staffId=${selectedStaff.id}`;
        }

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.slots || []);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [shop?.slug, selectedDate, selectedStaff, multiStaffEnabled, totalDuration]);

  // Reset selections when staff changes
  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
  }, [selectedStaff]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
    });
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !shop?.slug) return;

    setIsSubmitting(true);

    try {
      const dateStr = formatDate(selectedDate);
      // Generate unique reference code
      const refCode = `${Date.now().toString(36).toUpperCase().slice(-5)}`;

      // Format date as YYYY-MM-DD using LOCAL date (not UTC to avoid timezone issues)
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      const isoDate = `${year}-${month}-${day}`;

      // Combine all services into one booking
      const combinedServiceName = services.map(s => s.name).join(", ");

      // Create proper booking via API
      const bookingPayload: Record<string, unknown> = {
        shopId: shop.id || shop.slug,
        customerName: "Cliente WhatsApp", // Will be updated when WhatsApp message is received
        customerPhone: "", // Will be updated when WhatsApp message is received
        serviceId: services.length === 1 ? services[0].id : "multi-service",
        serviceName: combinedServiceName,
        serviceDuration: totalDuration,
        servicePrice: totalPrice,
        date: isoDate,
        time: selectedTime,
        notes: `Referencia: ${refCode}${notes ? `\nNotas: ${notes}` : ""}\nPendiente confirmación por WhatsApp`,
        referenceCode: refCode,
        source: "web-whatsapp",
      };

      // Add staff info if multi-staff mode
      if (multiStaffEnabled && selectedStaff) {
        bookingPayload.assignedStaffId = selectedStaff.id;
        bookingPayload.assignedStaffName = selectedStaff.name;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingPayload,
          customerName,
          customerPhone: customerPhone || "pending",
          customerEmail: customerEmail || "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create booking");
      }

      console.log("✅ Booking created:", result.booking.id);

      // Set success state
      setBookingSuccess({
        id: result.booking.id,
        number: result.booking.orderNumber || result.booking.referenceCode || result.booking.id.slice(-6).toUpperCase()
      });

      // WhatsApp manual open removed.
      // Notifications are now handled by the server (Evolution API) if configured.

      // Clear cart
      clearCart();

      // We don't close the modal here, so the user can see the bookingSuccess screen
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Hubo un error al agendar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = services.length > 0;
  const canProceedToStaffStep = services.length > 0;
  const canProceedToDateStep = multiStaffEnabled ? selectedStaff !== null : true;
  const canProceedToConfirm = selectedDate !== null && selectedTime !== null;

  // Get current step context
  const getStepLabel = (stepNum: number): string => {
    if (multiStaffEnabled) {
      switch (stepNum) {
        case 1: return "Servicios";
        case 2: return "Empleado";
        case 3: return "Fecha y Hora";
        case 4: return "Confirmar";
        default: return "";
      }
    } else {
      switch (stepNum) {
        case 1: return "Servicios";
        case 2: return "Fecha y Hora";
        case 3: return "Confirmar";
        default: return "";
      }
    }
  };

  const canProceedFromCurrentStep = (): boolean => {
    if (multiStaffEnabled) {
      switch (step) {
        case 1: return canProceedToStep2;
        case 2: return selectedStaff !== null;
        case 3: return canProceedToConfirm;
        case 4: return !!(customerName && customerPhone.length >= 10 && customerEmail);
        default: return true;
      }
    } else {
      switch (step) {
        case 1: return canProceedToStep2;
        case 2: return canProceedToConfirm;
        case 3: return !!(customerName && customerPhone.length >= 10 && customerEmail);
        default: return true;
      }
    }
  };

  const isDateTimeStep = multiStaffEnabled ? step === 3 : step === 2;
  const isInfoStep = multiStaffEnabled ? step === 4 : step === 3;
  const isConfirmStep = step === totalSteps;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="relative w-full max-w-lg bg-surface border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Agendar Cita</h2>
                <p className="text-xs text-slate-400">{shopName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      step >= s
                        ? "bg-primary text-white"
                        : "bg-white/10 text-slate-400"
                    )}
                  >
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                  {s < totalSteps && (
                    <div
                      className={cn(
                        multiStaffEnabled ? "w-12 sm:w-16 h-0.5 mx-1.5" : "w-16 sm:w-24 h-0.5 mx-2",
                        step > s ? "bg-primary" : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <span key={s}>{getStepLabel(s)}</span>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {/* Step 1: Services Summary */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white mb-4">
                  <Sparkles className="w-5 h-5 text-gold" />
                  <span className="font-medium">Servicios seleccionados</span>
                </div>

                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No has seleccionado ningún servicio</p>
                    <Button variant="ghost" className="mt-4" onClick={onClose}>
                      Volver a elegir
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{service.name}</p>
                              <p className="text-xs text-slate-400">
                                {service.duration}min
                              </p>
                            </div>
                          </div>
                          <p className="text-white font-bold">${service.price}</p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex justify-between text-sm text-slate-300 mb-2">
                        <span>Duración total</span>
                        <span className="font-medium">{formatDuration(totalDuration)}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span className="font-medium">Total aproximado</span>
                        <span className="text-xl font-bold">${totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Staff Selection (multi-staff only) */}
            {multiStaffEnabled && step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white mb-4">
                  <User className="w-5 h-5 text-gold" />
                  <span className="font-medium">Elige tu especialista</span>
                </div>

                {isLoadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 text-slate-400">Cargando...</span>
                  </div>
                ) : availableStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No hay especialistas disponibles para estos servicios</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableStaff.map((staff) => {
                      const isSelected = selectedStaff?.id === staff.id;
                      return (
                        <button
                          key={staff.id}
                          onClick={() => setSelectedStaff(staff)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left",
                            isSelected
                              ? "bg-primary/20 border-2 border-primary"
                              : "bg-white/5 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-orange-400/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {staff.avatar ? (
                              <img
                                src={staff.avatar}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7 text-white/70" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <p className="text-white font-medium">{staff.name}</p>
                            <p className="text-sm text-slate-400">
                              {ROLE_LABELS[staff.role] || staff.role}
                            </p>
                            {staff.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-slate-300">{staff.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Date & Time Selection Step */}
            {isDateTimeStep && (
              <div className="space-y-6">
                {/* Show selected staff if multi-staff */}
                {multiStaffEnabled && selectedStaff && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {selectedStaff.avatar ? (
                        <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Con {selectedStaff.name}</p>
                      <p className="text-xs text-slate-400">{ROLE_LABELS[selectedStaff.role]}</p>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <div className="flex items-center gap-2 text-white mb-4">
                    <Calendar className="w-5 h-5 text-gold" />
                    <span className="font-medium">Elige una fecha</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {availableDates.map((date) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null); // Reset time when date changes
                          }}
                          className={cn(
                            "p-2 sm:p-3 rounded-xl text-center transition-all",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-white/5 text-slate-300 hover:bg-white/10"
                          )}
                        >
                          <p className="text-[10px] sm:text-xs opacity-70">
                            {date.toLocaleDateString("es-MX", { weekday: "short" })}
                          </p>
                          <p className="text-base sm:text-lg font-bold">{date.getDate()}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <div className="flex items-center gap-2 text-white mb-4">
                    <Clock className="w-5 h-5 text-gold" />
                    <span className="font-medium">Elige una hora</span>
                  </div>

                  {!selectedDate ? (
                    <p className="text-slate-500 text-sm">Selecciona una fecha primero</p>
                  ) : isLoadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="ml-2 text-slate-400 text-sm">Cargando horarios...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">No hay horarios disponibles para esta fecha</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={cn(
                              "py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all",
                              isSelected
                                ? "bg-primary text-white"
                                : slot.available
                                  ? "bg-white/5 text-slate-300 hover:bg-white/10"
                                  : "bg-white/5 text-slate-600 cursor-not-allowed line-through"
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Customer Info */}
            {isInfoStep && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-white mb-2">
                  <User className="w-5 h-5 text-gold" />
                  <span className="font-medium">Tus datos de contacto</span>
                </div>
                <p className="text-sm text-slate-400">Para confirmarte la cita y enviarte recordatorios.</p>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">Nombre Completo</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej: María García"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">WhatsApp (10 dígitos)</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej: 8097654321"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">Correo Electrónico</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Ej: correo@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Step */}
            {isConfirmStep && selectedDate && selectedTime && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-medium mb-4">Resumen de tu cita</h3>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-slate-300">{formatDate(selectedDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-slate-300">{selectedTime}</span>
                    </div>
                    {multiStaffEnabled && selectedStaff && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <span className="text-slate-300">
                          Con {selectedStaff.name} ({ROLE_LABELS[selectedStaff.role]})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-gold" />
                      <span className="text-slate-300">
                        {services.length} servicio{services.length > 1 ? "s" : ""} ({formatDuration(totalDuration)})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                    <span className="text-slate-400">Total</span>
                    <span className="text-xl font-bold text-white">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Tengo alergia a ciertos productos..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 resize-none"
                    rows={3}
                  />
                </div>

                {/* WhatsApp Info */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    Tu cita se registrará automáticamente en nuestro sistema y recibirás un aviso por WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {/* Success State */}
            {bookingSuccess && (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center animate-in zoom-in-95">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">¡Cita Solicitada!</h3>
                  <p className="text-slate-400 mt-2">Hemos registrado tu cita correctamente.</p>
                </div>
                <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">ID de Cita</p>
                  <p className="text-3xl font-mono font-bold text-primary">{bookingSuccess.number}</p>
                </div>
                <p className="text-sm text-slate-400 max-w-xs">
                  Te contactaremos pronto para confirmar la disponibilidad final.
                </p>
                <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90">
                  Cerrar
                </Button>
              </div>
            )}
          </div>

          {/* Footer (Hide if success) */}
          {!bookingSuccess && (
            <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-white/10 px-6 py-4">
              <div className="flex gap-3">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                )}

                {!isConfirmStep ? (
                  <Button
                    onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
                    disabled={!canProceedFromCurrentStep()}
                    className="flex-1"
                  >
                    Continuar
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-500 h-14"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    {isSubmitting ? "Procesando..." : "Confirmar Cita"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui";
import { useCart, type ServiceCartItem } from "@/components/shared/cart-context";
import { useShop } from "@/components/shared";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";

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

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const availableDates = useMemo(() => getAvailableDates(), []);

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
      const bookingPayload = {
        shopId: shop.slug,
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

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      const { booking } = await response.json();
      console.log("✅ Booking created:", booking.id);

      // Build WhatsApp message
      const servicesList = services
        .map((s) => `- ${s.name}`)
        .join("\n");

      let message = `Hola ${shopName}, quiero agendar una cita:
🆔 Ref: ${refCode}

📅 *Fecha:* ${dateStr}
🕐 *Hora:* ${selectedTime}

💇‍♀️ *Servicios:*
${servicesList}

⏱️ *Duración estimada:* ${formatDuration(totalDuration)}
💰 *Total aproximado:* $${totalPrice.toLocaleString()}
${notes ? `\n📝 *Notas:* ${notes}` : ""}

¡Gracias!`;

      // Open WhatsApp (use ownerNotificationPhone if available)
      const targetPhone = shop.ownerNotificationPhone || shopPhone;
      const cleanPhone = formatPhoneForWhatsApp(targetPhone);
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");

      // Clear cart and close
      clearCart();
      onClose();
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes("");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Hubo un error al agendar la cita.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = services.length > 0;
  const canProceedToStep3 = selectedDate !== null && selectedTime !== null;

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
              {[1, 2, 3].map((s) => (
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
                  {s < 3 && (
                    <div
                      className={cn(
                        "w-16 sm:w-24 h-0.5 mx-2",
                        step > s ? "bg-primary" : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Servicios</span>
              <span>Fecha y Hora</span>
              <span>Confirmar</span>
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

            {/* Step 2: Date & Time Selection */}
            {step === 2 && (
              <div className="space-y-6">
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
                          onClick={() => setSelectedDate(date)}
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-white/5 text-slate-300 hover:bg-white/10"
                          )}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && selectedDate && selectedTime && (
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
                <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <MessageCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    Al confirmar, se abrirá WhatsApp con tu solicitud de cita lista para enviar.
                    El negocio confirmará tu horario.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-white/10 px-6 py-4">
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => (s > 1 ? (s - 1) as 1 | 2 : s))}
                  className="flex-1"
                >
                  Atrás
                </Button>
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => (s < 3 ? (s + 1) as 2 | 3 : s))}
                  disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
                  className="flex-1"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Confirmar en WhatsApp
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

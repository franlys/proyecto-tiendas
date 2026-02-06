"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { useShop } from "@/components/shared";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Phone,
  Mail,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_SERVICES, type Service } from "@/lib/constants";
import { cn } from "@/lib/utils";

type BookingStep = "service" | "date" | "time" | "info" | "confirm";

interface AvailableSlot {
  time: string;
  endTime: string;
  available: boolean;
}

interface BookingData {
  service: Service | null;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export default function BookingPage() {
  const shop = useShop();
  const params = useParams();
  const shopId = params.shopId as string;

  const [step, setStep] = useState<BookingStep>("service");
  const [bookingData, setBookingData] = useState<BookingData>({
    service: null,
    date: "",
    time: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get services for this shop
  const services = useMemo(() => MOCK_SERVICES[shopId] || [], [shopId]);

  // Generate calendar dates
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

  // Fetch available slots when date changes
  useEffect(() => {
    if (bookingData.date) {
      setSlotsLoading(true);
      fetch(`/api/bookings/slots?shopId=${shopId}&date=${bookingData.date}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.slots) {
            setSlots(data.slots);
          } else {
            // Generate default slots if API fails
            const defaultSlots: AvailableSlot[] = [];
            for (let h = 9; h < 18; h++) {
              for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                defaultSlots.push({
                  time,
                  endTime: `${h.toString().padStart(2, "0")}:${(m + 30).toString().padStart(2, "0")}`,
                  available: true,
                });
              }
            }
            setSlots(defaultSlots);
          }
        })
        .catch(() => {
          // Generate default slots on error
          const defaultSlots: AvailableSlot[] = [];
          for (let h = 9; h < 18; h++) {
            for (let m = 0; m < 60; m += 30) {
              const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
              defaultSlots.push({
                time,
                endTime: `${h.toString().padStart(2, "0")}:${(m + 30).toString().padStart(2, "0")}`,
                available: true,
              });
            }
          }
          setSlots(defaultSlots);
        })
        .finally(() => setSlotsLoading(false));
    }
  }, [bookingData.date, shopId]);

  const handleServiceSelect = (service: Service) => {
    setBookingData((prev) => ({ ...prev, service }));
    setStep("date");
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setBookingData((prev) => ({ ...prev, date: dateStr, time: "" }));
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setBookingData((prev) => ({ ...prev, time }));
    setStep("info");
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("confirm");
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.service) return;

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          customerEmail: bookingData.customerEmail || undefined,
          serviceId: bookingData.service.id,
          serviceName: bookingData.service.name,
          serviceDuration: bookingData.service.duration,
          servicePrice: bookingData.service.price,
          date: bookingData.date,
          time: bookingData.time,
        }),
      });

      if (response.ok) {
        setBookingComplete(true);
      } else {
        alert("Error al crear la reserva. Por favor intenta de nuevo.");
      }
    } catch {
      alert("Error de conexion. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    const steps: BookingStep[] = ["service", "date", "time", "info", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable past dates and Sundays
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Booking Complete View
  if (bookingComplete) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="glass-panel rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>

            <h1 className="font-display text-3xl font-bold text-white mb-4">
              Reserva Confirmada
            </h1>

            <p className="text-slate-400 mb-6">
              Te hemos enviado los detalles de tu cita por WhatsApp.
            </p>

            <div className="bg-surface/50 rounded-xl p-6 mb-8 text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Servicio</span>
                <span className="text-white font-medium">
                  {bookingData.service?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha</span>
                <span className="text-white font-medium capitalize">
                  {formatDate(bookingData.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hora</span>
                <span className="text-white font-medium">{bookingData.time}</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="text-primary font-bold text-lg">
                  ${bookingData.service?.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href={`/${shopId}`}>
                <Button className="w-full">Volver a {shop?.name}</Button>
              </Link>
              <p className="text-xs text-slate-500">
                Te enviaremos un recordatorio antes de tu cita
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <button
          onClick={step === "service" ? undefined : goBack}
          className={cn(
            "inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6",
            step === "service" && "pointer-events-none"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {step === "service" ? (
            <Link href={`/${shopId}`}>Volver a {shop?.name}</Link>
          ) : (
            "Atras"
          )}
        </button>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { key: "service", label: "Servicio" },
            { key: "date", label: "Fecha" },
            { key: "time", label: "Hora" },
            { key: "info", label: "Datos" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step === s.key
                    ? "bg-primary text-white"
                    : arr.findIndex((x) => x.key === step) > i
                    ? "bg-green-500 text-white"
                    : "bg-surface text-slate-400"
                )}
              >
                {arr.findIndex((x) => x.key === step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm hidden sm:block",
                  step === s.key ? "text-white" : "text-slate-500"
                )}
              >
                {s.label}
              </span>
              {i < arr.length - 1 && (
                <div
                  className={cn(
                    "w-8 sm:w-16 h-0.5 mx-2",
                    arr.findIndex((x) => x.key === step) > i
                      ? "bg-green-500"
                      : "bg-surface"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8">
          {/* Step 1: Select Service */}
          {step === "service" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-white mb-2">
                  Selecciona un Servicio
                </h1>
                <p className="text-slate-400">
                  Elige el tratamiento que deseas reservar
                </p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-4 rounded-xl bg-surface/50 hover:bg-surface border border-white/10 hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex gap-4">
                      {service.image && (
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-primary font-bold">
                            ${service.price.toLocaleString()}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors self-center" />
                    </div>
                  </button>
                ))}
              </div>

              {services.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">
                    No hay servicios disponibles para reserva en este momento.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 2: Select Date */}
          {step === "date" && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">
                  Selecciona una Fecha
                </h2>
                <p className="text-slate-400 text-sm">
                  {bookingData.service?.name} - {bookingData.service?.duration} min
                </p>
              </div>

              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                  disabled={
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear()
                  }
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-white capitalize">
                  {currentMonth.toLocaleDateString("es-MX", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs text-slate-500 py-2"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((date, i) => (
                  <div key={i} className="aspect-square">
                    {date && (
                      <button
                        onClick={() => handleDateSelect(date)}
                        disabled={isDateDisabled(date)}
                        className={cn(
                          "w-full h-full rounded-lg text-sm font-medium transition-all",
                          isDateDisabled(date)
                            ? "text-slate-600 cursor-not-allowed"
                            : "text-white hover:bg-primary/20 hover:text-primary"
                        )}
                      >
                        {date.getDate()}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Select Time */}
          {step === "time" && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">
                  Selecciona una Hora
                </h2>
                <p className="text-slate-400 text-sm capitalize">
                  {formatDate(bookingData.date)}
                </p>
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={cn(
                        "py-3 px-4 rounded-lg text-sm font-medium transition-all",
                        slot.available
                          ? bookingData.time === slot.time
                            ? "bg-primary text-white"
                            : "bg-surface text-white hover:bg-primary/20"
                          : "bg-surface/50 text-slate-600 cursor-not-allowed"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}

              {!slotsLoading && slots.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    No hay horarios disponibles para esta fecha.
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setStep("date")}
                    className="mt-4"
                  >
                    Elegir otra fecha
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step 4: Customer Info */}
          {step === "info" && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">
                  Tus Datos
                </h2>
                <p className="text-slate-400 text-sm">
                  Para confirmar tu reserva
                </p>
              </div>

              <form onSubmit={handleSubmitInfo} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={bookingData.customerName}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={bookingData.customerPhone}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Email (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="email"
                      value={bookingData.customerEmail}
                      onChange={(e) =>
                        setBookingData((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-white/10 text-white placeholder-slate-500 focus:border-primary focus:outline-none"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6">
                  Revisar Reserva
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          )}

          {/* Step 5: Confirm */}
          {step === "confirm" && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-white mb-2">
                  Confirma tu Reserva
                </h2>
                <p className="text-slate-400 text-sm">Revisa los detalles</p>
              </div>

              <div className="bg-surface/50 rounded-xl p-6 mb-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Servicio</span>
                  <span className="text-white font-medium">
                    {bookingData.service?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duracion</span>
                  <span className="text-white">
                    {bookingData.service?.duration} minutos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha</span>
                  <span className="text-white capitalize">
                    {formatDate(bookingData.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hora</span>
                  <span className="text-white">{bookingData.time}</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente</span>
                    <span className="text-white">{bookingData.customerName}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-slate-400">WhatsApp</span>
                    <span className="text-white">{bookingData.customerPhone}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between">
                  <span className="text-slate-400 font-medium">Total</span>
                  <span className="text-primary font-bold text-xl">
                    ${bookingData.service?.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Reserva
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center mt-4">
                Al confirmar, aceptas recibir un recordatorio por WhatsApp
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, PhoneInput } from "@/components/ui";
import { useShop } from "@/components/shared";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  User,
  Phone,
  Mail,
  Target,
  MapPin,
  Monitor,
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TrainingPackage, DayOfWeek } from "@/lib/types/training-package.types";
import {
  DAY_LABELS,
  DURATION_LABELS,
  BILLING_CYCLE_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/types/training-package.types";

// ─────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────

type TrainingStep = "plan" | "days" | "start" | "time" | "info" | "confirm";

const STEPS: TrainingStep[] = ["plan", "days", "start", "time", "info", "confirm"];
const STEP_LABELS: Record<TrainingStep, string> = {
  plan: "Plan",
  days: "Días",
  start: "Inicio",
  time: "Horario",
  info: "Datos",
  confirm: "Confirmar",
};

// All days of week in display order
const WEEK_DAYS: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

// Map DayOfWeek → JS getDay() index (0 = Sunday)
const DAY_TO_JS: Record<DayOfWeek, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00",
];

interface EnrollmentData {
  packageId: string;
  packageName: string;
  packagePrice: number;
  packageBillingCycle: string;
  sessionsPerWeek: number;
  sessionDuration: number;
  locationType: string;
  preferredDays: DayOfWeek[];
  startDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fitnessGoals: string;
}

const EMPTY_ENROLLMENT: EnrollmentData = {
  packageId: "", packageName: "", packagePrice: 0, packageBillingCycle: "monthly",
  sessionsPerWeek: 3, sessionDuration: 60, locationType: "in_person",
  preferredDays: [], startDate: "", preferredTime: "",
  customerName: "", customerPhone: "", customerEmail: "", fitnessGoals: "",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatDate(isoDate: string) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function formatPrice(price: number, cycle: string) {
  const cycleLabels: Record<string, string> = { monthly: "/mes", weekly: "/semana", biweekly: "/quincenal" };
  return `$${price.toLocaleString()}${cycleLabels[cycle] || ""}`;
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function TrainingBookingPage() {
  const shop = useShop();
  const params = useParams();
  const shopId = params.shopId as string;

  const [step, setStep] = useState<TrainingStep>("plan");
  const [data, setData] = useState<EnrollmentData>(EMPTY_ENROLLMENT);
  const [packages, setPackages] = useState<TrainingPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [phoneValue, setPhoneValue] = useState("");

  // Calendar state
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 28);
    return d;
  }, [today]);

  // Load training packages
  useEffect(() => {
    if (!shop?.id) return;
    fetch(`/api/training/packages?shopId=${shop.id}`)
      .then(r => r.json())
      .then(({ packages: pkgs }) => {
        setPackages((pkgs || []).filter((p: TrainingPackage) => p.isActive !== false));
      })
      .catch(console.error)
      .finally(() => setPackagesLoading(false));
  }, [shop?.id]);

  // ── Step helpers ──────────────────────────────
  const stepIndex = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[stepIndex + 1]);
  const goBack = () => setStep(STEPS[stepIndex - 1]);

  // ── Plan selection ────────────────────────────
  const selectPlan = (pkg: TrainingPackage) => {
    setData(prev => ({
      ...prev,
      packageId: pkg.id,
      packageName: pkg.name,
      packagePrice: pkg.price,
      packageBillingCycle: pkg.billingCycle,
      sessionsPerWeek: pkg.sessionsPerWeek,
      sessionDuration: pkg.sessionDuration,
      locationType: pkg.locationType,
      preferredDays: [],
    }));
    goNext();
  };

  // ── Days selection ────────────────────────────
  const toggleDay = (day: DayOfWeek) => {
    setData(prev => {
      const already = prev.preferredDays.includes(day);
      if (already) return { ...prev, preferredDays: prev.preferredDays.filter(d => d !== day) };
      if (prev.preferredDays.length >= prev.sessionsPerWeek) return prev; // max reached
      return { ...prev, preferredDays: [...prev.preferredDays, day] };
    });
  };

  // ── Calendar (start date) ─────────────────────
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calMonth]);

  const selectStartDate = (date: Date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    setData(prev => ({ ...prev, startDate: iso }));
  };

  // ── Submit ────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/training/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shop?.id, ...data, customerPhone: phoneValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEnrollmentId(json.enrollment.id);
      setDone(true);
    } catch (err: any) {
      alert("Error al enviar la solicitud: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (done) {
    return <SuccessScreen shop={shop} data={data} enrollmentId={enrollmentId} shopId={shopId} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${shopId}`}>
            <button className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            {shop?.logo && (
              <img src={shop.logo} alt={shop.name} className="w-10 h-10 rounded-xl object-cover" />
            )}
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">{shop?.name || "Agendar Entrenamiento"}</h1>
              <p className="text-slate-400 text-xs">Inscripción a programa de entrenamiento</p>
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                i < stepIndex ? "bg-green-500 text-white" :
                i === stepIndex ? "bg-primary text-white" :
                "bg-white/10 text-slate-500"
              )}>
                {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 transition-all",
                  i < stepIndex ? "bg-green-500" : "bg-white/10"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm">Paso {stepIndex + 1} de {STEPS.length}</p>
          <h2 className="text-white text-xl font-bold">
            {step === "plan" && "Elige tu Plan"}
            {step === "days" && `Selecciona tus ${data.sessionsPerWeek} días de entreno`}
            {step === "start" && "¿Cuándo quieres empezar?"}
            {step === "time" && "Elige tu horario preferido"}
            {step === "info" && "Tus datos"}
            {step === "confirm" && "Confirma tu inscripción"}
          </h2>
        </div>

        {/* ── STEP: PLAN ── */}
        {step === "plan" && (
          <div className="space-y-4">
            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No hay planes disponibles por el momento.</p>
              </div>
            ) : (
              packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => selectPlan(pkg)}
                  className="w-full text-left p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">
                        {pkg.name}
                      </h3>
                      {pkg.description && (
                        <p className="text-slate-400 text-sm mt-1">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="flex items-center gap-1.5 text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-full">
                          <CalendarDays className="w-3 h-3" />
                          {FREQUENCY_LABELS[pkg.sessionsPerWeek]}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {DURATION_LABELS[pkg.sessionDuration]}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                          {pkg.locationType === "online" ? <Monitor className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {pkg.locationType === "in_person" ? "Presencial" : pkg.locationType === "online" ? "Virtual" : "Presencial / Virtual"}
                        </span>
                      </div>
                      {pkg.includes?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {pkg.includes.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                              <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-primary font-bold text-xl">${pkg.price.toLocaleString()}</p>
                      <p className="text-slate-500 text-xs">{BILLING_CYCLE_LABELS[pkg.billingCycle]}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── STEP: DAYS ── */}
        {step === "days" && (
          <div>
            <p className="text-slate-400 text-sm mb-4">
              Tu plan incluye <span className="text-white font-semibold">{data.sessionsPerWeek} sesiones</span> a la semana.
              Selecciona exactamente {data.sessionsPerWeek} días.
            </p>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {WEEK_DAYS.map(day => {
                const selected = data.preferredDays.includes(day);
                const full = !selected && data.preferredDays.length >= data.sessionsPerWeek;
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    disabled={full}
                    className={cn(
                      "flex flex-col items-center py-3 rounded-xl border text-xs font-semibold transition-all",
                      selected
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                        : full
                        ? "bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <span>{DAY_SHORT[day]}</span>
                    {selected && <Check className="w-3 h-3 mt-1" />}
                  </button>
                );
              })}
            </div>

            {data.preferredDays.length > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-6">
                <p className="text-primary text-sm font-medium">
                  Días seleccionados: {data.preferredDays.map(d => DAY_LABELS[d]).join(", ")}
                </p>
                {data.preferredDays.length < data.sessionsPerWeek && (
                  <p className="text-primary/70 text-xs mt-1">
                    Falta{data.sessionsPerWeek - data.preferredDays.length > 1 ? "n" : ""}{" "}
                    {data.sessionsPerWeek - data.preferredDays.length} día{data.sessionsPerWeek - data.preferredDays.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button
                onClick={goNext}
                disabled={data.preferredDays.length !== data.sessionsPerWeek}
                className="flex-1"
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: START DATE ── */}
        {step === "start" && (
          <div>
            <p className="text-slate-400 text-sm mb-4">
              Puedes iniciar tu programa hoy o hasta <span className="text-white font-semibold">28 días</span> adelante.
            </p>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                disabled={calMonth <= new Date(today.getFullYear(), today.getMonth(), 1)}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <p className="text-white font-semibold capitalize">
                {calMonth.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </p>
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-white/10 text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
                <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {calDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const isoParts = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const isPast = date < today;
                const isBeyond = date > maxDate;
                const isDisabled = isPast || isBeyond;
                const isSelected = data.startDate === isoParts;
                // Highlight if the day matches a training day
                const dayName = JS_TO_DAY(date.getDay());
                const isTrainingDay = data.preferredDays.includes(dayName);

                return (
                  <button
                    key={i}
                    onClick={() => !isDisabled && selectStartDate(date)}
                    disabled={isDisabled}
                    className={cn(
                      "h-10 rounded-xl text-sm font-medium transition-all relative",
                      isSelected
                        ? "bg-primary text-white font-bold shadow-lg shadow-primary/40"
                        : isDisabled
                        ? "text-slate-700 cursor-not-allowed"
                        : isTrainingDay
                        ? "bg-primary/15 text-primary hover:bg-primary/30 border border-primary/20"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {data.startDate && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-6">
                <p className="text-green-400 text-sm font-medium capitalize">
                  Inicio: {formatDate(data.startDate)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button onClick={goNext} disabled={!data.startDate} className="flex-1">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: TIME ── */}
        {step === "time" && (
          <div>
            <p className="text-slate-400 text-sm mb-4">
              Este horario aplicará para todos tus días de entrenamiento (
              {data.preferredDays.map(d => DAY_SHORT[d]).join(", ")}).
            </p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  onClick={() => setData(prev => ({ ...prev, preferredTime: t }))}
                  className={cn(
                    "py-3 rounded-xl text-sm font-medium border transition-all",
                    data.preferredTime === t
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button onClick={goNext} disabled={!data.preferredTime} className="flex-1">
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: INFO ── */}
        {step === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <User className="w-3.5 h-3.5 inline mr-1" />
                Nombre completo *
              </label>
              <input
                type="text"
                value={data.customerName}
                onChange={e => setData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Teléfono / WhatsApp *
              </label>
              <PhoneInput
                value={phoneValue}
                onChange={(v) => setPhoneValue(v.fullPhone)}
                placeholder="Tu número de WhatsApp"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Email (opcional)
              </label>
              <input
                type="email"
                value={data.customerEmail}
                onChange={e => setData(prev => ({ ...prev, customerEmail: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Target className="w-3.5 h-3.5 inline mr-1" />
                ¿Cuál es tu objetivo? (opcional)
              </label>
              <textarea
                value={data.fitnessGoals}
                onChange={e => setData(prev => ({ ...prev, fitnessGoals: e.target.value }))}
                placeholder="Ej: Bajar de peso, ganar músculo, mejorar condición física..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button
                onClick={goNext}
                disabled={!data.customerName.trim() || !phoneValue.trim()}
                className="flex-1"
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === "confirm" && (
          <div>
            {/* Summary card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Plan</p>
                <p className="text-white font-bold text-lg">{data.packageName}</p>
                <p className="text-primary font-semibold">{formatPrice(data.packagePrice, data.packageBillingCycle)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Días de entreno</p>
                  <p className="text-white text-sm font-medium">
                    {data.preferredDays.map(d => DAY_SHORT[d]).join(" · ")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Horario</p>
                  <p className="text-white text-sm font-medium">{data.preferredTime} hrs</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Fecha de inicio</p>
                  <p className="text-white text-sm font-medium capitalize">{formatDate(data.startDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Duración sesión</p>
                  <p className="text-white text-sm font-medium">{DURATION_LABELS[data.sessionDuration as any]}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Modalidad</p>
                  <p className="text-white text-sm font-medium flex items-center gap-1">
                    {data.locationType === "online"
                      ? <><Monitor className="w-3.5 h-3.5" /> Virtual</>
                      : data.locationType === "both"
                      ? <><Sparkles className="w-3.5 h-3.5" /> Presencial / Virtual</>
                      : <><MapPin className="w-3.5 h-3.5" /> Presencial</>}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Cliente</p>
                <p className="text-white font-medium">{data.customerName}</p>
                <p className="text-slate-400 text-sm">{phoneValue}</p>
                {data.customerEmail && <p className="text-slate-400 text-sm">{data.customerEmail}</p>}
                {data.fitnessGoals && (
                  <p className="text-slate-400 text-sm mt-1 italic">"{data.fitnessGoals}"</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={goBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-500">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar</>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// JS day number → DayOfWeek
// ─────────────────────────────────────────────
function JS_TO_DAY(n: number): DayOfWeek {
  const map: Record<number, DayOfWeek> = {
    0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
    4: "thursday", 5: "friday", 6: "saturday",
  };
  return map[n];
}

// ─────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────
function SuccessScreen({
  shop,
  data,
  enrollmentId,
  shopId,
}: {
  shop: any;
  data: EnrollmentData;
  enrollmentId: string;
  shopId: string;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>

        <h1 className="text-white font-bold text-2xl mb-2">¡Inscripción enviada!</h1>
        <p className="text-slate-400 mb-6">
          Recibimos tu solicitud para el plan <span className="text-white font-semibold">{data.packageName}</span>.
          Te contactaremos pronto por WhatsApp para confirmar.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Plan</span>
            <span className="text-white font-medium">{data.packageName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Días</span>
            <span className="text-white font-medium">{data.preferredDays.map(d => DAY_SHORT[d]).join(" · ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Horario</span>
            <span className="text-white font-medium">{data.preferredTime} hrs</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Inicio</span>
            <span className="text-white font-medium capitalize">{formatDate(data.startDate)}</span>
          </div>
        </div>

        <Link href={`/${shopId}`}>
          <Button className="w-full">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}

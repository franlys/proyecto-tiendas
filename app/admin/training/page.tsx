"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  Loader2,
  Phone,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Users,
  Package,
  Trash2,
  MessageCircle,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { DayOfWeek } from "@/lib/types/training-package.types";
import { DAY_LABELS } from "@/lib/types/training-package.types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type EnrollmentStatus = "pending" | "active" | "paused" | "cancelled" | "expired";

interface TrainingEnrollment {
  id: string;
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
  customerEmail?: string;
  fitnessGoals?: string;
  status: EnrollmentStatus;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pendiente",  color: "bg-amber-500/20 text-amber-400 border-amber-500/30",  icon: <Clock className="w-3.5 h-3.5" /> },
  active:    { label: "Activo",     color: "bg-green-500/20 text-green-400 border-green-500/30",   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  paused:    { label: "Pausado",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",      icon: <PauseCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelado",  color: "bg-red-500/20 text-red-400 border-red-500/30",         icon: <XCircle className="w-3.5 h-3.5" /> },
  expired:   { label: "Vencido",    color: "bg-slate-500/20 text-white/50 border-slate-500/30",   icon: <XCircle className="w-3.5 h-3.5" /> },
};

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "L", tuesday: "M", wednesday: "X", thursday: "J",
  friday: "V", saturday: "S", sunday: "D",
};

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function TrainingEnrollmentsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<TrainingEnrollment | null>(null);

  // Load enrollments
  useEffect(() => {
    if (!user?.shopId) return;
    fetch(`/api/training/enrollments?shopId=${user.shopId}`)
      .then(r => r.json())
      .then(({ enrollments: data }) => setEnrollments(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.shopId]);

  const updateStatus = async (id: string, status: EnrollmentStatus) => {
    if (!user?.shopId) return;
    setUpdating(id);
    try {
      const res = await fetch(`/api/training/enrollments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: user.shopId, status }),
      });
      if (res.ok) {
        setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const deleteEnrollment = async (id: string) => {
    if (!user?.shopId || !confirm("¿Eliminar esta inscripción?")) return;
    await fetch(`/api/training/enrollments/${id}?shopId=${user.shopId}`, { method: "DELETE" });
    setEnrollments(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const [sendingWA, setSendingWA] = useState<string | null>(null);

  const sendWhatsApp = async (enrollment: TrainingEnrollment) => {
    if (!user?.shopId) return;
    setSendingWA(enrollment.id);
    try {
      const res = await fetch("/api/training/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: user.shopId,
          enrollmentId: enrollment.id,
          customerPhone: enrollment.customerPhone,
          customerName: enrollment.customerName,
          packageName: enrollment.packageName,
          status: "active",
        }),
      });
      const data = await res.json();
      if (data.whatsappUrl) {
        // Fallback: Evolution not configured
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (e) {
      console.error("Error sending WhatsApp:", e);
    } finally {
      setSendingWA(null);
    }
  };

  // Filtered list
  const filtered = enrollments.filter(e => {
    const matchSearch = !searchQuery ||
      e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.customerPhone.includes(searchQuery) ||
      e.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === "active").length,
    pending: enrollments.filter(e => e.status === "pending").length,
  };

  if (authLoading || loading) {
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
              <Link href="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Inscripciones</h1>
                  <p className="text-white/50 text-sm">Gestión de clientes de entrenamiento</p>
                </div>
              </div>
            </div>
            <Link href="/admin/training/packages">
              <Button variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" /> Planes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "Activos", value: stats.active, color: "text-green-400" },
            { label: "Pendientes", value: stats.pending, color: "text-amber-400" },
          ].map(stat => (
            <div key={stat.label} className="glass-panel rounded-xl p-4 border border-white/10 text-center">
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o plan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "active", "paused", "cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  statusFilter === s
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                )}
              >
                {s === "all" ? "Todos" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{enrollments.length === 0 ? "Aún no hay inscripciones." : "Sin resultados para este filtro."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(enrollment => {
              const sc = STATUS_CONFIG[enrollment.status];
              return (
                <div
                  key={enrollment.id}
                  className={cn(
                    "glass-panel rounded-2xl p-4 border cursor-pointer transition-all hover:border-white/20",
                    selected?.id === enrollment.id ? "border-primary/50" : "border-white/10"
                  )}
                  onClick={() => setSelected(selected?.id === enrollment.id ? null : enrollment)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold truncate">{enrollment.customerName}</p>
                        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", sc.color)}>
                          {sc.icon} {sc.label}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm mt-0.5">{enrollment.packageName}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {enrollment.customerPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {enrollment.preferredTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {enrollment.preferredDays.map(d => DAY_SHORT[d]).join(" ")}
                        </span>
                        <span>Inicio: {new Date(enrollment.startDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-primary font-bold">${enrollment.packagePrice?.toLocaleString()}</p>
                      <p className="text-white/40 text-xs">{enrollment.packageBillingCycle === "monthly" ? "/mes" : enrollment.packageBillingCycle === "weekly" ? "/sem" : "/quin"}</p>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selected?.id === enrollment.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3" onClick={e => e.stopPropagation()}>
                      {enrollment.fitnessGoals && (
                        <p className="text-white/50 text-sm italic">"{enrollment.fitnessGoals}"</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-white/50">Cambiar estado:</span>
                        {(["pending", "active", "paused", "cancelled"] as EnrollmentStatus[]).map(s => (
                          <button
                            key={s}
                            disabled={updating === enrollment.id || enrollment.status === s}
                            onClick={() => updateStatus(enrollment.id, s)}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50",
                              enrollment.status === s
                                ? STATUS_CONFIG[s].color + " font-semibold"
                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                            )}
                          >
                            {updating === enrollment.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => sendWhatsApp(enrollment)} disabled={sendingWA === enrollment.id} className="bg-green-600 hover:bg-green-500 disabled:opacity-50">
                          {sendingWA === enrollment.id
                            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enviando...</>
                            : <><MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteEnrollment(enrollment.id)} className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  ClipboardList, Plus, ChevronRight, Loader2,
  TrendingUp, DollarSign, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Cuadre } from "@/lib/types/cuadre.types";
import { CUADRE_STATUS_CONFIG, calcCuadreTotals } from "@/lib/types/cuadre.types";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency", currency: "DOP", maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft:     <Clock className="w-3.5 h-3.5" />,
  submitted: <Clock className="w-3.5 h-3.5" />,
  approved:  <CheckCircle className="w-3.5 h-3.5" />,
  rejected:  <XCircle className="w-3.5 h-3.5" />,
};

const STATUS_LEFT: Record<string, string> = {
  submitted: "border-l-amber-400/60",
  approved:  "border-l-green-500/60",
  rejected:  "border-l-red-500/60",
  draft:     "border-l-white/15",
};

function CuadreCard({ cuadre, index }: { cuadre: Cuadre; index: number }) {
  const statusCfg = CUADRE_STATUS_CONFIG[cuadre.status];
  const totals = calcCuadreTotals(cuadre.entries, cuadre.expenses);

  return (
    <Link
      href={`/staff/cuadres/${cuadre.id}?shopId=${cuadre.shopId}`}
      className={cn(
        "block bg-white/3 hover:bg-white/5 border border-white/8 border-l-2 rounded-2xl p-4 transition-all group",
        STATUS_LEFT[cuadre.status]
      )}
      style={{ animation: `fadeUp 320ms cubic-bezier(0.23,1,0.32,1) ${index * 40}ms both` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white truncate">{cuadre.weekLabel}</p>
          <p className="text-[10px] text-white/45 mt-0.5">{cuadre.branchName || "Sucursal"}</p>
        </div>
        <span className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] border flex-shrink-0",
          statusCfg.bg, statusCfg.color, statusCfg.border
        )}>
          {STATUS_ICON[cuadre.status]}
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2.5">
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-black text-green-400">{fmt(totals.totalIncome)}</p>
          <p className="text-[9px] text-white/45 uppercase tracking-wide mt-0.5">Ingresos</p>
        </div>
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-black text-red-400">{fmt(totals.totalExpenses)}</p>
          <p className="text-[9px] text-white/45 uppercase tracking-wide mt-0.5">Gastos</p>
        </div>
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className={cn("text-xs font-black", totals.net >= 0 ? "text-white" : "text-red-400")}>
            {fmt(totals.net)}
          </p>
          <p className="text-[9px] text-white/45 uppercase tracking-wide mt-0.5">Neto</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-white/35">
        <span>{cuadre.entries.length} registro{cuadre.entries.length !== 1 ? "s" : ""}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      </div>

      {cuadre.status === "rejected" && cuadre.rejectionReason && (
        <p className="mt-2 text-[10px] text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-lg px-2.5 py-1.5 leading-relaxed">
          {cuadre.rejectionReason}
        </p>
      )}
    </Link>
  );
}

export default function StaffCuadresPage() {
  const { user } = useAuth();
  const [cuadres, setCuadres] = useState<Cuadre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "submitted" | "approved">("all");

  const shopId = user?.shopId;
  const employeeId = user?.id;

  const load = useCallback(async () => {
    if (!shopId || !employeeId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ shopId, employeeId });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/cuadres?${params}`);
      const data = await res.json();
      setCuadres(data.cuadres || []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, employeeId, filter]);

  useEffect(() => { load(); }, [load]);

  const FILTERS = [
    { key: "all" as const,       label: "Todos" },
    { key: "draft" as const,     label: "Borradores" },
    { key: "submitted" as const, label: "Enviados" },
    { key: "approved" as const,  label: "Aprobados" },
  ];

  const pendingFeedback = cuadres.filter(c => c.status === "rejected").length;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/8 flex items-center gap-3"
          style={{ animation: "fadeUp 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
          <ClipboardList className="w-4 h-4 text-white/30 flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-base font-black tracking-tight">Mis Cuadres</h1>
            <p className="text-[11px] text-white/45">Registro semanal de actividad</p>
          </div>
          <Link
            href="/staff/cuadres/nuevo"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black rounded-xl text-xs font-black hover:bg-white/90 transition-colors active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo
          </Link>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 40ms both" }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border active:scale-[0.97]",
                  filter === f.key
                    ? "bg-white text-black border-white"
                    : "bg-white/4 text-white/40 border-white/8 hover:border-white/18 hover:text-white/60"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Feedback badge */}
          {pendingFeedback > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/8 border border-red-500/15 rounded-2xl"
              style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}>
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-white/70">
                Tienes <span className="font-black text-red-400">{pendingFeedback} cuadre{pendingFeedback > 1 ? "s" : ""}</span> rechazado{pendingFeedback > 1 ? "s" : ""} — revisa los motivos
              </p>
            </div>
          )}

          {/* Lista */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-5 h-5 text-white/15 animate-spin" />
            </div>
          ) : cuadres.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center"
              style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) both" }}>
              <div className="w-14 h-14 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white/15" />
              </div>
              <div>
                <p className="text-sm text-white/45">
                  {filter !== "all"
                    ? `No hay cuadres con ese estado`
                    : "Aún no tienes cuadres"}
                </p>
                {filter === "all" && (
                  <Link
                    href="/staff/cuadres/nuevo"
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear tu primer cuadre
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cuadres.map((c, i) => <CuadreCard key={c.id} cuadre={c} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

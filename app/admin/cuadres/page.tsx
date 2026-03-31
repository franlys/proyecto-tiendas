"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  ClipboardList, CheckCircle, Loader2, ChevronRight,
  Building2, User, TrendingUp, DollarSign, AlertCircle,
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

// ─── Tarjeta de cuadre ────────────────────────────────────────────────────────
function CuadreCard({ cuadre, index }: { cuadre: Cuadre; index: number }) {
  const statusCfg = CUADRE_STATUS_CONFIG[cuadre.status];
  const totals = calcCuadreTotals(cuadre.entries, cuadre.expenses);

  const STATUS_LEFT: Record<string, string> = {
    submitted: "border-l-amber-400/60",
    approved:  "border-l-green-500/60",
    rejected:  "border-l-red-500/60",
    draft:     "border-l-white/15",
  };

  return (
    <Link
      href={`/admin/cuadres/${cuadre.id}?shopId=${cuadre.shopId}`}
      className={cn(
        "block bg-white/3 hover:bg-white/5 border border-white/8 border-l-2 rounded-2xl p-4 transition-all group",
        STATUS_LEFT[cuadre.status]
      )}
      style={{ animation: `fadeUp 320ms cubic-bezier(0.23,1,0.32,1) ${index * 40}ms both` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white/30" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{cuadre.employeeName}</p>
            <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5 truncate">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {cuadre.branchName || "Sucursal"} · {cuadre.weekLabel}
            </p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] border flex-shrink-0",
          statusCfg.bg, statusCfg.color, statusCfg.border
        )}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-black text-green-400">{fmt(totals.totalIncome)}</p>
          <p className="text-[9px] text-white/50 uppercase tracking-wide mt-0.5">Ingresos</p>
        </div>
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className="text-xs font-black text-red-400">{fmt(totals.totalExpenses)}</p>
          <p className="text-[9px] text-white/50 uppercase tracking-wide mt-0.5">Gastos</p>
        </div>
        <div className="bg-white/3 rounded-xl px-3 py-2 text-center">
          <p className={cn("text-xs font-black", totals.net >= 0 ? "text-white" : "text-red-400")}>
            {fmt(totals.net)}
          </p>
          <p className="text-[9px] text-white/50 uppercase tracking-wide mt-0.5">Neto</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-white/45">
        {totals.totalVentas > 0 && <span>📦 {fmt(totals.totalVentas)}</span>}
        {totals.totalReparaciones > 0 && <span>🔧 {fmt(totals.totalReparaciones)}</span>}
        {totals.totalServicios > 0 && <span>⚙️ {fmt(totals.totalServicios)}</span>}
        <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CuadresPage() {
  const { user } = useAuth();
  const [cuadres, setCuadres] = useState<Cuadre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "approved" | "draft">("all");

  const shopId = user?.shopId;

  const load = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ shopId });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/cuadres?${params}`);
      const data = await res.json();
      setCuadres(data.cuadres || []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, filter]);

  useEffect(() => { load(); }, [load]);

  const allTotals = cuadres.reduce(
    (acc, c) => {
      const t = calcCuadreTotals(c.entries, c.expenses);
      acc.income += t.totalIncome;
      acc.expenses += t.totalExpenses;
      acc.net += t.net;
      return acc;
    },
    { income: 0, expenses: 0, net: 0 }
  );

  const pendingCount = cuadres.filter(c => c.status === "submitted").length;

  const FILTERS = [
    { key: "all" as const,       label: "Todos" },
    { key: "submitted" as const, label: "Pendientes" },
    { key: "approved" as const,  label: "Aprobados" },
    { key: "draft" as const,     label: "Borradores" },
  ];

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
            <h1 className="text-base font-black tracking-tight">Cuadres</h1>
            <p className="text-[11px] text-white/45">Actividad semanal por empleado</p>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-400/12 border border-amber-400/25 text-amber-400 text-[9px] font-black rounded-full uppercase tracking-[0.12em]">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2"
            style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 40ms both" }}>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <TrendingUp className="w-3.5 h-3.5 text-green-400 mb-2" />
              <p className="text-lg font-black text-white leading-none">{fmt(allTotals.income)}</p>
              <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Ingresos</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <DollarSign className="w-3.5 h-3.5 text-red-400 mb-2" />
              <p className="text-lg font-black text-white leading-none">{fmt(allTotals.expenses)}</p>
              <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Gastos</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400 mb-2" />
              <p className={cn("text-lg font-black leading-none", allTotals.net >= 0 ? "text-green-400" : "text-red-400")}>
                {fmt(allTotals.net)}
              </p>
              <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Neto</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}>
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
                {f.key === "submitted" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-amber-400 text-black rounded-full text-[8px] font-black">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lista */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-5 h-5 text-white/15 animate-spin" />
            </div>
          ) : cuadres.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3 text-center"
              style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) both" }}>
              <div className="w-14 h-14 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white/15" />
              </div>
              <p className="text-sm text-white/45">
                No hay cuadres {filter !== "all" ? `con estado "${FILTERS.find(f => f.key === filter)?.label}"` : "aún"}
              </p>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  BarChart3, TrendingUp, DollarSign, Users, Building2,
  Loader2, ChevronDown, Package, Wrench, Settings,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cuadre } from "@/lib/types/cuadre.types";
import { calcCuadreTotals } from "@/lib/types/cuadre.types";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency", currency: "DOP", maximumFractionDigits: 0,
  }).format(n);
}

interface BranchSummary {
  branchId: string;
  branchName: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
  totalVentas: number;
  totalReparaciones: number;
  totalServicios: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  cuadreCount: number;
  employeeCount: number;
}

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  branchName: string;
  totalIncome: number;
  cuadreCount: number;
}

// ─── Barra de progreso CSS ────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "bg-white" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Fila de sucursal expandible ──────────────────────────────────────────────
function BranchRow({
  summary, maxIncome, isExpanded, onToggle, employees, index,
}: {
  summary: BranchSummary;
  maxIncome: number;
  isExpanded: boolean;
  onToggle: () => void;
  employees: EmployeeSummary[];
  index: number;
}) {
  const branchEmployees = employees.filter(e => e.branchName === summary.branchName);

  return (
    <div
      className="border border-white/8 rounded-2xl overflow-hidden"
      style={{ animation: `fadeUp 320ms cubic-bezier(0.23,1,0.32,1) ${index * 50}ms both` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/3 transition-colors text-left active:scale-[0.995]"
      >
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white/30" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-white truncate">{summary.branchName}</p>
            <p className={cn("text-sm font-black flex-shrink-0", summary.net >= 0 ? "text-green-400" : "text-red-400")}>
              {fmt(summary.net)}
            </p>
          </div>
          <ProgressBar value={summary.totalIncome} max={maxIncome} color="bg-green-500/70" />
          <p className="text-[9px] text-white/45">
            {summary.employeeCount} empleado{summary.employeeCount !== 1 ? "s" : ""} · {summary.cuadreCount} cuadre{summary.cuadreCount !== 1 ? "s" : ""} · {fmt(summary.totalIncome)} ingresos
          </p>
        </div>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-white/20 flex-shrink-0 transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded ? "600px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className="border-t border-white/6 px-4 py-4 space-y-4 bg-white/1">
          {/* Por tipo */}
          <div>
            <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-2">Por tipo</p>
            <div className="space-y-2">
              {([
                { label: "Ventas", val: summary.totalVentas, icon: "📦", color: "bg-blue-500/60" },
                { label: "Reparaciones", val: summary.totalReparaciones, icon: "🔧", color: "bg-orange-500/60" },
                { label: "Servicios", val: summary.totalServicios, icon: "⚙️", color: "bg-purple-500/60" },
              ] as const).map(({ label, val, icon, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40 flex items-center gap-1.5"><span>{icon}</span>{label}</span>
                    <span className="font-bold text-white/70">{fmt(val)}</span>
                  </div>
                  <ProgressBar value={val} max={summary.totalIncome} color={color} />
                </div>
              ))}
            </div>
          </div>

          {/* Por método de pago */}
          <div>
            <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-2">Por método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["💵", "Efectivo", summary.totalEfectivo],
                ["💳", "Tarjeta", summary.totalTarjeta],
                ["🏦", "Transfer.", summary.totalTransferencia],
              ] as const).map(([icon, label, val]) => (
                <div key={label} className="bg-white/3 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xs font-black text-white">{fmt(val)}</p>
                  <p className="text-[9px] text-white/45 mt-0.5">{icon} {label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Empleados */}
          {branchEmployees.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-2">Empleados</p>
              <div className="space-y-1.5">
                {branchEmployees.map(emp => (
                  <div key={emp.employeeId} className="flex items-center justify-between px-3 py-2.5 bg-white/3 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                        <Users className="w-3 h-3 text-white/25" />
                      </div>
                      <p className="text-sm font-bold text-white">{emp.employeeName}</p>
                    </div>
                    <p className="text-sm font-black text-green-400">{fmt(emp.totalIncome)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function FinanzasPage() {
  const { user } = useAuth();
  const [cuadres, setCuadres] = useState<Cuadre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  const shopId = user?.shopId;

  const load = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cuadres?shopId=${shopId}&status=approved`);
      const data = await res.json();
      setCuadres(data.cuadres || []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const filteredCuadres = cuadres.filter(c => {
    if (period === "all") return true;
    const now = new Date();
    const end = new Date(c.endDate);
    if (period === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return end >= weekAgo;
    }
    return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
  });

  const globalTotals = filteredCuadres.reduce(
    (acc, c) => {
      const t = calcCuadreTotals(c.entries, c.expenses);
      return { income: acc.income + t.totalIncome, expenses: acc.expenses + t.totalExpenses, net: acc.net + t.net, ventas: acc.ventas + t.totalVentas, reparaciones: acc.reparaciones + t.totalReparaciones, servicios: acc.servicios + t.totalServicios };
    },
    { income: 0, expenses: 0, net: 0, ventas: 0, reparaciones: 0, servicios: 0 }
  );

  // Agrupación por sucursal
  const branchMap = new Map<string, BranchSummary>();
  const employeesByBranch = new Map<string, Set<string>>();
  for (const c of filteredCuadres) {
    const t = calcCuadreTotals(c.entries, c.expenses);
    const ex = branchMap.get(c.branchId);
    if (ex) {
      ex.totalIncome += t.totalIncome; ex.totalExpenses += t.totalExpenses; ex.net += t.net;
      ex.totalVentas += t.totalVentas; ex.totalReparaciones += t.totalReparaciones; ex.totalServicios += t.totalServicios;
      ex.totalEfectivo += t.totalEfectivo; ex.totalTarjeta += t.totalTarjeta; ex.totalTransferencia += t.totalTransferencia;
      ex.cuadreCount += 1;
    } else {
      branchMap.set(c.branchId, { branchId: c.branchId, branchName: c.branchName, ...t, cuadreCount: 1, employeeCount: 0 });
    }
    if (!employeesByBranch.has(c.branchId)) employeesByBranch.set(c.branchId, new Set());
    employeesByBranch.get(c.branchId)!.add(c.employeeId);
  }
  for (const [branchId, emps] of employeesByBranch) {
    const s = branchMap.get(branchId);
    if (s) s.employeeCount = emps.size;
  }
  const branchSummaries = Array.from(branchMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);
  const maxIncome = branchSummaries[0]?.totalIncome || 1;

  // Top empleados
  const employeeMap = new Map<string, EmployeeSummary>();
  for (const c of filteredCuadres) {
    const t = calcCuadreTotals(c.entries, c.expenses);
    const ex = employeeMap.get(c.employeeId);
    if (ex) { ex.totalIncome += t.totalIncome; ex.cuadreCount += 1; }
    else employeeMap.set(c.employeeId, { employeeId: c.employeeId, employeeName: c.employeeName, branchName: c.branchName, totalIncome: t.totalIncome, cuadreCount: 1 });
  }
  const topEmployees = Array.from(employeeMap.values()).sort((a, b) => b.totalIncome - a.totalIncome);

  const PERIODS = [
    { key: "week" as const,  label: "Esta semana" },
    { key: "month" as const, label: "Este mes" },
    { key: "all" as const,   label: "Todo" },
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
          <BarChart3 className="w-4 h-4 text-white/30" />
          <div>
            <h1 className="text-base font-black tracking-tight">Finanzas</h1>
            <p className="text-[11px] text-white/45">Resumen de cuadres aprobados</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
          {/* Período */}
          <div className="flex gap-2"
            style={{ animation: "fadeUp 300ms cubic-bezier(0.23,1,0.32,1) 30ms both" }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border active:scale-[0.97]",
                  period === p.key ? "bg-white text-black border-white" : "bg-white/4 text-white/40 border-white/8 hover:border-white/18 hover:text-white/60"
                )}>
                {p.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-5 h-5 text-white/15 animate-spin" />
            </div>
          ) : (
            <>
              {/* Neto destacado */}
              <div
                className={cn(
                  "rounded-2xl px-5 py-5 border",
                  globalTotals.net >= 0 ? "bg-green-500/6 border-green-500/18" : "bg-red-500/6 border-red-500/18"
                )}
                style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 50ms both" }}
              >
                <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-1">Neto consolidado</p>
                <div className="flex items-end justify-between gap-4">
                  <p className={cn("text-4xl font-black leading-none", globalTotals.net >= 0 ? "text-green-400" : "text-red-400")}>
                    {fmt(globalTotals.net)}
                  </p>
                  <p className="text-[10px] text-white/40 mb-1">
                    {filteredCuadres.length} cuadre{filteredCuadres.length !== 1 ? "s" : ""} aprobado{filteredCuadres.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* KPIs secundarios */}
              <div className="grid grid-cols-2 gap-2"
                style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 70ms both" }}>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 mb-2" />
                  <p className="text-xl font-black text-white">{fmt(globalTotals.income)}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1">Ingresos totales</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <DollarSign className="w-3.5 h-3.5 text-red-400 mb-2" />
                  <p className="text-xl font-black text-white">{fmt(globalTotals.expenses)}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1">Gastos totales</p>
                </div>
              </div>

              {/* Desglose por tipo */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3"
                style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 90ms both" }}>
                <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Por tipo de actividad</p>
                {([
                  { label: "Ventas", val: globalTotals.ventas, icon: "📦", color: "bg-blue-500/60" },
                  { label: "Reparaciones", val: globalTotals.reparaciones, icon: "🔧", color: "bg-orange-500/60" },
                  { label: "Servicios", val: globalTotals.servicios, icon: "⚙️", color: "bg-purple-500/60" },
                ] as const).map(({ label, val, icon, color }) => (
                  <div key={label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40 flex items-center gap-1.5"><span>{icon}</span>{label}</span>
                      <span className="font-black text-white">{fmt(val)}</span>
                    </div>
                    <ProgressBar value={val} max={globalTotals.income} color={color} />
                  </div>
                ))}
              </div>

              {/* Por sucursal */}
              {branchSummaries.length > 0 && (
                <div style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 110ms both" }}>
                  <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-3">Por sucursal</p>
                  <div className="space-y-2.5">
                    {branchSummaries.map((b, i) => (
                      <BranchRow
                        key={b.branchId}
                        summary={b}
                        maxIncome={maxIncome}
                        isExpanded={expandedBranch === b.branchId}
                        onToggle={() => setExpandedBranch(expandedBranch === b.branchId ? null : b.branchId)}
                        employees={topEmployees}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Top empleados */}
              {topEmployees.length > 0 && (
                <div style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 130ms both" }}>
                  <p className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em] mb-3">Top empleados</p>
                  <div className="space-y-1.5">
                    {topEmployees.slice(0, 5).map((emp, i) => (
                      <div key={emp.employeeId} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                        <span className="text-[10px] font-black text-white/15 w-4 text-center">{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-white/25" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{emp.employeeName}</p>
                          <p className="text-[9px] text-white/45">{emp.branchName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-green-400">{fmt(emp.totalIncome)}</p>
                          <p className="text-[9px] text-white/45">{emp.cuadreCount} cuadre{emp.cuadreCount !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredCuadres.length === 0 && (
                <div className="py-20 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white/15" />
                  </div>
                  <p className="text-sm text-white/50">Sin cuadres aprobados en este período</p>
                  <p className="text-xs text-white/35">Los datos aparecen una vez que el dueño aprueba los cuadres</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

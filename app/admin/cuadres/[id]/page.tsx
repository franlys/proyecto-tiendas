"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, User,
  Building2, Calendar, AlertCircle, DollarSign, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Cuadre } from "@/lib/types/cuadre.types";
import {
  CUADRE_STATUS_CONFIG, ENTRY_TYPE_CONFIG,
  PAYMENT_METHOD_CONFIG, EXPENSE_CATEGORY_CONFIG,
  calcCuadreTotals,
} from "@/lib/types/cuadre.types";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

export default function CuadreDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cuadre, setCuadre] = useState<Cuadre | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const shopId = searchParams.get("shopId") || user?.shopId || "";

  const load = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cuadres/${params.id}?shopId=${shopId}`);
      const data = await res.json();
      if (data.cuadre) setCuadre(data.cuadre);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, params.id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!cuadre || !shopId) return;
    if (action === "reject" && !rejectionReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    setIsActioning(true);
    try {
      const res = await fetch(`/api/cuadres/${cuadre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          action,
          approvedBy: user?.name || user?.username || "Dueño",
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.cuadre) {
        setCuadre(data.cuadre);
        setShowRejectInput(false);
      }
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!cuadre) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Cuadre no encontrado</p>
        <Link href="/admin/cuadres" className="text-xs text-white/50 hover:text-white">← Volver</Link>
      </div>
    );
  }

  const statusCfg = CUADRE_STATUS_CONFIG[cuadre.status];
  const totals = calcCuadreTotals(cuadre.entries, cuadre.expenses);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <Link href="/admin/cuadres" className="p-2 -ml-2 text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white truncate">{cuadre.employeeName}</h1>
          <p className="text-[11px] text-white/30">{cuadre.weekLabel}</p>
        </div>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex-shrink-0",
          statusCfg.bg, statusCfg.color, statusCfg.border
        )}>
          {statusCfg.label}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Info del empleado */}
        <div className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <User className="w-5 h-5 text-white/30" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{cuadre.employeeName}</p>
            <p className="text-[11px] text-white/35 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> {cuadre.branchName || "Sucursal"}
              {cuadre.employeeRole && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/5 rounded text-[9px] uppercase tracking-wide">
                  {cuadre.employeeRole}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white">{fmt(totals.totalIncome)}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Ingresos</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <DollarSign className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white">{fmt(totals.totalExpenses)}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Gastos</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <p className={cn("text-lg font-black", totals.net >= 0 ? "text-green-400" : "text-red-400")}>
              {fmt(totals.net)}
            </p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Neto</p>
          </div>
        </div>

        {/* Desglose por tipo */}
        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Por tipo de actividad</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Ventas", totals.totalVentas, "📦"],
              ["Reparaciones", totals.totalReparaciones, "🔧"],
              ["Servicios", totals.totalServicios, "⚙️"],
              ["Abonos cobrados", totals.totalAbonosCobrados, "💳"],
            ] as const).filter(([, val]) => (val as number) > 0).map(([label, val, icon]) => (
              <div key={label} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="text-[11px] text-white/50">{label}</span>
                </div>
                <span className="text-sm font-bold text-white">{fmt(val as number)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por método de pago */}
        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Por método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["Efectivo", totals.totalEfectivo, "💵"],
              ["Tarjeta", totals.totalTarjeta, "💳"],
              ["Transferencia", totals.totalTransferencia, "🏦"],
              ["Crédito", totals.totalCredito, "📋"],
            ] as const).filter(([, val]) => (val as number) > 0).map(([label, val, icon]) => (
              <div key={label} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="text-[11px] text-white/50">{label}</span>
                </div>
                <span className="text-sm font-bold text-white">{fmt(val as number)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Registros detallados */}
        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
            Registros ({cuadre.entries.length})
          </p>
          <div className="space-y-2">
            {cuadre.entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-lg flex-shrink-0">{ENTRY_TYPE_CONFIG[entry.type].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{entry.description}</p>
                  <p className="text-[10px] text-white/35">
                    {ENTRY_TYPE_CONFIG[entry.type].label}
                    {entry.clientName && ` · ${entry.clientName}`}
                    {" · "}{PAYMENT_METHOD_CONFIG[entry.paymentMethod].icon} {PAYMENT_METHOD_CONFIG[entry.paymentMethod].label}
                  </p>
                </div>
                <span className="text-sm font-black text-white flex-shrink-0">{fmt(entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gastos */}
        {cuadre.expenses.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
              Gastos ({cuadre.expenses.length})
            </p>
            <div className="space-y-2">
              {cuadre.expenses.map(expense => (
                <div key={expense.id} className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                  <span className="text-lg flex-shrink-0">{EXPENSE_CATEGORY_CONFIG[expense.category].icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{expense.description}</p>
                    <p className="text-[10px] text-white/35">{EXPENSE_CATEGORY_CONFIG[expense.category].label}</p>
                  </div>
                  <span className="text-sm font-black text-red-400 flex-shrink-0">-{fmt(expense.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas del empleado */}
        {cuadre.notes && (
          <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Notas del empleado</p>
            <p className="text-sm text-white/70">{cuadre.notes}</p>
          </div>
        )}

        {/* Acciones dueño — solo si está enviado */}
        {cuadre.status === "submitted" && (
          <div className="space-y-3 pt-2">
            {!showRejectInput ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction("approve")}
                  disabled={isActioning}
                  className="py-3.5 bg-green-500/15 border border-green-500/25 text-green-400 rounded-2xl font-black text-sm hover:bg-green-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={isActioning}
                  className="py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-black text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Motivo del rechazo (obligatorio)..."
                  rows={3}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl font-bold text-sm hover:bg-white/8 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={isActioning || !rejectionReason.trim()}
                    className="py-3 bg-red-500/15 border border-red-500/25 text-red-400 rounded-xl font-black text-sm hover:bg-red-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Rechazo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado final */}
        {cuadre.status === "approved" && (
          <div className="flex items-center gap-3 p-4 bg-green-400/8 border border-green-400/20 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-400">Aprobado por {cuadre.approvedBy}</p>
              {cuadre.approvedAt && (
                <p className="text-[11px] text-white/30">
                  {new Date(cuadre.approvedAt).toLocaleDateString("es-DO", { dateStyle: "long" })}
                </p>
              )}
            </div>
          </div>
        )}

        {cuadre.status === "rejected" && (
          <div className="flex items-start gap-3 p-4 bg-red-400/8 border border-red-400/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Rechazado</p>
              {cuadre.rejectionReason && (
                <p className="text-[11px] text-white/50 mt-0.5">{cuadre.rejectionReason}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Loader2, AlertCircle,
  DollarSign, TrendingUp, Send, Trash2, RefreshCw,
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
  return new Intl.NumberFormat("es-DO", {
    style: "currency", currency: "DOP", maximumFractionDigits: 0,
  }).format(n);
}

export default function StaffCuadreDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cuadre, setCuadre] = useState<Cuadre | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

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

  const handleSubmit = async () => {
    if (!cuadre || !shopId) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/cuadres/${cuadre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, action: "submit" }),
      });
      const data = await res.json();
      if (data.cuadre) setCuadre(data.cuadre);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!cuadre || !shopId || cuadre.status !== "draft") return;
    setIsActioning(true);
    try {
      await fetch(`/api/cuadres/${cuadre.id}?shopId=${shopId}`, { method: "DELETE" });
      router.push("/staff/cuadres");
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!cuadre) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center px-6">
        <AlertCircle className="w-10 h-10 text-white/15" />
        <p className="text-white/35 text-sm">Cuadre no encontrado</p>
        <Link href="/staff/cuadres" className="text-xs text-white/40 hover:text-white">← Volver</Link>
      </div>
    );
  }

  const statusCfg = CUADRE_STATUS_CONFIG[cuadre.status];
  const totals = calcCuadreTotals(cuadre.entries, cuadre.expenses);
  const canSubmit = cuadre.status === "draft";
  const canDelete = cuadre.status === "draft";
  const isRejected = cuadre.status === "rejected";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <Link href="/staff/cuadres" className="p-2 -ml-2 text-white/30 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white truncate">{cuadre.weekLabel}</h1>
          <p className="text-[11px] text-white/45">{cuadre.branchName || "Sucursal"}</p>
        </div>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex-shrink-0",
          statusCfg.bg, statusCfg.color, statusCfg.border
        )}>
          {statusCfg.label}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Banner rechazado */}
        {isRejected && (
          <div className="flex items-start gap-3 p-4 bg-red-400/8 border border-red-400/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Cuadre rechazado</p>
              {cuadre.rejectionReason && (
                <p className="text-[11px] text-white/55 mt-1 leading-relaxed">{cuadre.rejectionReason}</p>
              )}
              <p className="text-[10px] text-white/35 mt-2">Puedes corregir y reenviar este cuadre desde la opción de borrador.</p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white">{fmt(totals.totalIncome)}</p>
            <p className="text-[9px] text-white/45 uppercase tracking-widest">Ingresos</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <DollarSign className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
            <p className="text-lg font-black text-white">{fmt(totals.totalExpenses)}</p>
            <p className="text-[9px] text-white/45 uppercase tracking-widest">Gastos</p>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
            <p className={cn("text-lg font-black", totals.net >= 0 ? "text-green-400" : "text-red-400")}>
              {fmt(totals.net)}
            </p>
            <p className="text-[9px] text-white/45 uppercase tracking-widest">Neto</p>
          </div>
        </div>

        {/* Registros */}
        <div>
          <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-3">
            Registros ({cuadre.entries.length})
          </p>
          <div className="space-y-2">
            {cuadre.entries.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <span className="text-base flex-shrink-0">{ENTRY_TYPE_CONFIG[entry.type].icon}</span>
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
            <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-3">
              Gastos ({cuadre.expenses.length})
            </p>
            <div className="space-y-2">
              {cuadre.expenses.map(expense => (
                <div key={expense.id} className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                  <span className="text-base flex-shrink-0">{EXPENSE_CATEGORY_CONFIG[expense.category].icon}</span>
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

        {/* Notas */}
        {cuadre.notes && (
          <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-1">Notas</p>
            <p className="text-sm text-white/60 leading-relaxed">{cuadre.notes}</p>
          </div>
        )}

        {/* Estado aprobado */}
        {cuadre.status === "approved" && (
          <div className="flex items-center gap-3 p-4 bg-green-400/8 border border-green-400/20 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-400">Aprobado por {cuadre.approvedBy}</p>
              {cuadre.approvedAt && (
                <p className="text-[11px] text-white/45">
                  {new Date(cuadre.approvedAt).toLocaleDateString("es-DO", { dateStyle: "long" })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Acciones */}
        {(canSubmit || canDelete) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={isActioning}
                className="py-3.5 flex items-center justify-center gap-2 bg-white/4 border border-white/10 text-white/40 rounded-2xl font-bold text-sm hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all disabled:opacity-40 active:scale-[0.97]"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={isActioning}
                className="py-3.5 flex items-center justify-center gap-2 bg-white text-black rounded-2xl font-black text-sm hover:bg-white/90 transition-all disabled:opacity-40 active:scale-[0.97]"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  ClipboardList, Plus, Trash2, Send, CheckCircle,
  Loader2, AlertCircle, X, DollarSign, TrendingUp,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Cuadre, CuadreEntry, CuadreExpense,
  CuadreEntryType, PaymentMethod, ExpenseCategory,
} from "@/lib/types/cuadre.types";
import {
  ENTRY_TYPE_CONFIG, PAYMENT_METHOD_CONFIG, EXPENSE_CATEGORY_CONFIG,
  CUADRE_STATUS_CONFIG, calcCuadreTotals, getCurrentWeekRange,
} from "@/lib/types/cuadre.types";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency", currency: "DOP", maximumFractionDigits: 0,
  }).format(n);
}

// ─── Modal: agregar entrada ───────────────────────────────────────────────────
function AddEntryModal({
  onAdd, onClose,
}: {
  onAdd: (entry: Omit<CuadreEntry, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<CuadreEntryType>("venta");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [quantity, setQuantity] = useState("1");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;
    onAdd({ type, description: description.trim(), clientName: clientName.trim() || undefined, amount: Number(amount), paymentMethod, quantity: Number(quantity) || 1 });
    onClose();
  };

  const ENTRY_COLORS: Record<CuadreEntryType, string> = {
    venta: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    reparacion: "border-orange-500/40 bg-orange-500/10 text-orange-300",
    servicio: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    abono: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    otro: "border-white/20 bg-white/5 text-white/50",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: mounted ? 1 : 0,
          transition: "transform 280ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease-out",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-sm font-black text-white tracking-tight">Nuevo registro</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Tipo */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Tipo de registro</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(ENTRY_TYPE_CONFIG) as CuadreEntryType[]).map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{ transitionDelay: `${i * 20}ms` }}
                  className={cn(
                    "py-2.5 rounded-xl border text-[9px] font-bold transition-all flex flex-col items-center gap-1.5 active:scale-95",
                    type === t ? ENTRY_COLORS[t] : "border-white/8 text-white/30 hover:border-white/15 hover:text-white/50"
                  )}
                >
                  <span className="text-base leading-none">{ENTRY_TYPE_CONFIG[t].icon}</span>
                  <span className="uppercase tracking-wide leading-tight text-center">{ENTRY_TYPE_CONFIG[t].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                type === "venta" ? "Samsung A55 128GB, Cable USB-C..." :
                type === "reparacion" ? "Cambio pantalla iPhone 14, batería..." :
                "Descripción del registro"
              }
              autoFocus
              required
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Monto RD$</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                required
                className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>
            {type === "venta" ? (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Cantidad</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min="1"
                  className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Cliente (opcional)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Nombre"
                  className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Pago */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Método de pago</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={cn(
                    "py-2.5 rounded-xl border text-[9px] font-bold transition-all flex flex-col items-center gap-1.5 active:scale-95",
                    paymentMethod === m
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/8 text-white/30 hover:border-white/15"
                  )}
                >
                  <span className="text-base leading-none">{PAYMENT_METHOD_CONFIG[m].icon}</span>
                  <span className="uppercase tracking-wide">{PAYMENT_METHOD_CONFIG[m].label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-white text-black rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-white/92 active:scale-[0.98] transition-all"
          >
            Agregar registro
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: agregar gasto ─────────────────────────────────────────────────────
function AddExpenseModal({
  onAdd, onClose,
}: {
  onAdd: (expense: Omit<CuadreExpense, "id">) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("insumos");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) return;
    onAdd({ description: description.trim(), amount: Number(amount), category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          transform: mounted ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: mounted ? 1 : 0,
          transition: "transform 280ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease-out",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-sm font-black text-white tracking-tight">Registrar gasto</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 text-white/30 hover:text-white transition-all flex items-center justify-center active:scale-95">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EXPENSE_CATEGORY_CONFIG) as ExpenseCategory[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-[10px] font-bold transition-all flex items-center gap-2 active:scale-[0.97]",
                    category === c ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-white/8 text-white/30 hover:border-white/15"
                  )}
                >
                  <span>{EXPENSE_CATEGORY_CONFIG[c].icon}</span>
                  <span>{EXPENSE_CATEGORY_CONFIG[c].label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Compra de repuestos" required autoFocus className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.15em]">Monto RD$</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="1" required className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors" />
          </div>
          <button type="submit" className="w-full py-3.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-red-500/22 active:scale-[0.98] transition-all">
            Registrar gasto
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MiCuadrePage() {
  const { user } = useAuth();
  const [cuadre, setCuadre] = useState<Cuadre | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [notes, setNotes] = useState("");
  const [pageReady, setPageReady] = useState(false);

  const shopId = user?.shopId;
  const employeeId = user?.id || "unknown";
  const employeeName = user?.name || user?.username || "Empleado";
  const weekRange = getCurrentWeekRange();

  const loadCuadre = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cuadres?shopId=${shopId}&employeeId=${employeeId}`);
      const data = await res.json();
      const current = (data.cuadres as Cuadre[])?.find(
        c => c.startDate === weekRange.startDate && c.endDate === weekRange.endDate
      );
      if (current) { setCuadre(current); setNotes(current.notes || ""); }
    } finally {
      setIsLoading(false);
      setTimeout(() => setPageReady(true), 50);
    }
  }, [shopId, employeeId, weekRange.startDate, weekRange.endDate]);

  useEffect(() => { loadCuadre(); }, [loadCuadre]);

  const createCuadre = async () => {
    if (!shopId) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/cuadres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          branchId: user?.branchId || "main",
          branchName: user?.branchName || "Sucursal Principal",
          employeeId,
          employeeName,
          employeeRole: user?.staffRole,
          startDate: weekRange.startDate,
          endDate: weekRange.endDate,
          weekLabel: weekRange.weekLabel,
          entries: [],
          expenses: [],
        }),
      });
      const data = await res.json();
      if (data.cuadre) setCuadre(data.cuadre);
    } finally {
      setIsSaving(false);
    }
  };

  const save = async (newEntries?: CuadreEntry[], newExpenses?: CuadreExpense[], newNotes?: string) => {
    if (!cuadre || !shopId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/cuadres/${cuadre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, entries: newEntries ?? cuadre.entries, expenses: newExpenses ?? cuadre.expenses, notes: newNotes ?? notes }),
      });
      const data = await res.json();
      if (data.cuadre) setCuadre(data.cuadre);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEntry = async (entry: Omit<CuadreEntry, "id" | "createdAt">) => {
    const newEntry: CuadreEntry = { ...entry, id: `e-${Date.now()}`, createdAt: new Date().toISOString() };
    await save([...(cuadre?.entries || []), newEntry]);
  };

  const handleRemoveEntry = async (id: string) => {
    await save((cuadre?.entries || []).filter(e => e.id !== id));
  };

  const handleAddExpense = async (expense: Omit<CuadreExpense, "id">) => {
    const newExpense: CuadreExpense = { ...expense, id: `x-${Date.now()}` };
    await save(undefined, [...(cuadre?.expenses || []), newExpense]);
  };

  const handleRemoveExpense = async (id: string) => {
    await save(undefined, (cuadre?.expenses || []).filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!cuadre || !shopId) return;
    setIsSubmitting(true);
    try {
      await save(undefined, undefined, notes);
      const res = await fetch(`/api/cuadres/${cuadre.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, action: "submit" }),
      });
      const data = await res.json();
      if (data.cuadre) setCuadre(data.cuadre);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = cuadre?.status === "submitted" || cuadre?.status === "approved";
  const totals = cuadre ? calcCuadreTotals(cuadre.entries, cuadre.expenses) : null;

  const ENTRY_LEFT_COLOR: Record<CuadreEntryType, string> = {
    venta: "border-l-blue-500/60",
    reparacion: "border-l-orange-500/60",
    servicio: "border-l-purple-500/60",
    abono: "border-l-cyan-500/60",
    otro: "border-l-white/20",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 340ms cubic-bezier(0.23,1,0.32,1) both; }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/8 flex items-center justify-between fade-up">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardList className="w-4 h-4 text-white/30" />
              <h1 className="text-base font-black tracking-tight">Mi Cuadre</h1>
              {isSaving && <Loader2 className="w-3.5 h-3.5 text-white/20 animate-spin ml-1" />}
            </div>
            <p className="text-[11px] text-white/45 pl-6">{weekRange.weekLabel}</p>
          </div>
          {cuadre && (
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] border",
              CUADRE_STATUS_CONFIG[cuadre.status].bg,
              CUADRE_STATUS_CONFIG[cuadre.status].color,
              CUADRE_STATUS_CONFIG[cuadre.status].border,
            )}>
              {CUADRE_STATUS_CONFIG[cuadre.status].label}
            </span>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* Sin cuadre */}
          {!cuadre && (
            <div
              className="py-20 flex flex-col items-center gap-5 fade-up"
              style={{ animationDelay: "60ms" }}
            >
              <div className="w-16 h-16 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-white/15" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white/50">Sin cuadre esta semana</p>
                <p className="text-xs text-white/40">Inicia tu registro de actividad semanal</p>
              </div>
              <button
                onClick={createCuadre}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-[11px] uppercase tracking-[0.12em] hover:bg-white/92 active:scale-[0.97] transition-all disabled:opacity-40"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Iniciar Cuadre
              </button>
            </div>
          )}

          {cuadre && (
            <>
              {/* Banners de estado */}
              {cuadre.status === "approved" && (
                <div className="flex items-center gap-3 p-4 bg-green-500/8 border border-green-500/20 rounded-2xl fade-up">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-400">Cuadre aprobado</p>
                    <p className="text-[11px] text-white/30">Por {cuadre.approvedBy}</p>
                  </div>
                </div>
              )}
              {cuadre.status === "rejected" && (
                <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl fade-up">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Rechazado</p>
                    {cuadre.rejectionReason && <p className="text-[11px] text-white/40 mt-0.5">{cuadre.rejectionReason}</p>}
                  </div>
                </div>
              )}

              {/* KPIs — tarjetas grandes */}
              <div className="grid grid-cols-3 gap-2 fade-up" style={{ animationDelay: "40ms" }}>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <TrendingUp className="w-3.5 h-3.5 text-green-400 mb-2" />
                  <p className="text-xl font-black text-white leading-none">{fmt(totals?.totalIncome ?? 0)}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Ingresos</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <DollarSign className="w-3.5 h-3.5 text-red-400 mb-2" />
                  <p className="text-xl font-black text-white leading-none">{fmt(totals?.totalExpenses ?? 0)}</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Gastos</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                  <p className={cn("text-xl font-black leading-none mt-5", (totals?.net ?? 0) >= 0 ? "text-green-400" : "text-red-400")}>
                    {fmt(totals?.net ?? 0)}
                  </p>
                  <p className="text-[9px] text-white/50 uppercase tracking-[0.12em] mt-1.5">Neto</p>
                </div>
              </div>

              {/* Desglose rápido */}
              <div className="grid grid-cols-2 gap-2 fade-up" style={{ animationDelay: "80ms" }}>
                {([
                  { label: "Ventas", val: totals?.totalVentas, icon: "📦", color: "text-blue-400" },
                  { label: "Reparaciones", val: totals?.totalReparaciones, icon: "🔧", color: "text-orange-400" },
                  { label: "Servicios", val: totals?.totalServicios, icon: "⚙️", color: "text-purple-400" },
                  { label: "Abonos", val: totals?.totalAbonosCobrados, icon: "💳", color: "text-cyan-400" },
                ] as const).map(({ label, val, icon, color }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 bg-white/2 border border-white/6 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-[10px] text-white/40">{label}</span>
                    </div>
                    <span className={cn("text-sm font-bold", color)}>{fmt(val ?? 0)}</span>
                  </div>
                ))}
              </div>

              {/* Registros */}
              <div className="fade-up" style={{ animationDelay: "100ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.15em]">
                    Registros · {cuadre.entries.length}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => setShowAddEntry(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 rounded-lg text-[10px] font-bold hover:bg-white/8 hover:text-white active:scale-[0.97] transition-all"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  )}
                </div>

                {cuadre.entries.length === 0 ? (
                  <div
                    onClick={!isReadOnly ? () => setShowAddEntry(true) : undefined}
                    className={cn(
                      "py-10 flex flex-col items-center gap-2 border border-dashed border-white/8 rounded-2xl",
                      !isReadOnly && "cursor-pointer hover:border-white/15 hover:bg-white/2 transition-all"
                    )}
                  >
                    <Plus className="w-5 h-5 text-white/15" />
                    <p className="text-xs text-white/40">Agrega tu primer registro</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cuadre.entries.map((entry, i) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-3 bg-white/3 border border-white/8 border-l-2 rounded-xl px-4 py-3 transition-colors",
                          ENTRY_LEFT_COLOR[entry.type]
                        )}
                        style={{ animation: `fadeUp 280ms cubic-bezier(0.23,1,0.32,1) ${i * 30}ms both` }}
                      >
                        <span className="text-base flex-shrink-0">{ENTRY_TYPE_CONFIG[entry.type].icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{entry.description}</p>
                          <p className="text-[9px] text-white/30 flex items-center gap-1.5 mt-0.5">
                            <span>{ENTRY_TYPE_CONFIG[entry.type].label}</span>
                            {entry.clientName && <><span className="text-white/15">·</span><span>{entry.clientName}</span></>}
                            <span className="text-white/15">·</span>
                            <span>{PAYMENT_METHOD_CONFIG[entry.paymentMethod].icon} {PAYMENT_METHOD_CONFIG[entry.paymentMethod].label}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-black text-white">{fmt(entry.amount)}</span>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              className="w-6 h-6 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center active:scale-90"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gastos */}
              <div className="fade-up" style={{ animationDelay: "120ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.15em]">
                    Gastos · {cuadre.expenses.length}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/8 border border-red-500/15 text-red-400/70 rounded-lg text-[10px] font-bold hover:bg-red-500/12 hover:text-red-400 active:scale-[0.97] transition-all"
                    >
                      <Plus className="w-3 h-3" /> Gasto
                    </button>
                  )}
                </div>

                {cuadre.expenses.length === 0 ? (
                  <div className="py-6 text-center border border-dashed border-white/6 rounded-xl">
                    <p className="text-xs text-white/18">Sin gastos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cuadre.expenses.map((expense, i) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 border-l-2 border-l-red-500/40 rounded-xl px-4 py-3"
                        style={{ animation: `fadeUp 280ms cubic-bezier(0.23,1,0.32,1) ${i * 30}ms both` }}
                      >
                        <span className="text-base flex-shrink-0">{EXPENSE_CATEGORY_CONFIG[expense.category].icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{expense.description}</p>
                          <p className="text-[9px] text-white/30 mt-0.5">{EXPENSE_CATEGORY_CONFIG[expense.category].label}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-black text-red-400">-{fmt(expense.amount)}</span>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleRemoveExpense(expense.id)}
                              className="w-6 h-6 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center active:scale-90"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas */}
              {!isReadOnly && (
                <div className="fade-up space-y-2" style={{ animationDelay: "140ms" }}>
                  <label className="text-[9px] font-black text-white/50 uppercase tracking-[0.15em]">
                    Notas para el dueño
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observaciones, incidencias, comentarios..."
                    rows={3}
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/18 focus:outline-none focus:border-white/18 resize-none transition-colors"
                  />
                </div>
              )}
              {isReadOnly && cuadre.notes && (
                <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 fade-up">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.15em] mb-1.5">Notas</p>
                  <p className="text-sm text-white/60">{cuadre.notes}</p>
                </div>
              )}

              {/* Acción enviar */}
              {cuadre.status === "draft" && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cuadre.entries.length === 0}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-white/92 active:scale-[0.98] transition-all disabled:opacity-35 flex items-center justify-center gap-2 fade-up"
                  style={{ animationDelay: "160ms" }}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar para aprobación</>}
                </button>
              )}

              {cuadre.status === "submitted" && (
                <div className="py-4 text-center fade-up">
                  <p className="text-sm font-bold text-amber-400">Enviado · esperando revisión</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddEntry && <AddEntryModal onAdd={handleAddEntry} onClose={() => setShowAddEntry(false)} />}
      {showAddExpense && <AddExpenseModal onAdd={handleAddExpense} onClose={() => setShowAddExpense(false)} />}
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/shared";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Send, Save, Loader2,
  ChevronDown, DollarSign, Package, Wrench, Settings,
  CreditCard, Banknote, Smartphone, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type {
  CuadreEntry, CuadreExpense, CuadreEntryType, PaymentMethod, ExpenseCategory,
} from "@/lib/types/cuadre.types";
import {
  ENTRY_TYPE_CONFIG, PAYMENT_METHOD_CONFIG, EXPENSE_CATEGORY_CONFIG,
  getCurrentWeekRange, calcCuadreTotals,
} from "@/lib/types/cuadre.types";

function fmt(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency", currency: "DOP", maximumFractionDigits: 0,
  }).format(n);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Formulario de entrada ────────────────────────────────────────────────────
interface EntryFormData {
  type: CuadreEntryType;
  description: string;
  clientName: string;
  amount: string;
  paymentMethod: PaymentMethod;
}

const ENTRY_TYPES: CuadreEntryType[] = ["venta", "reparacion", "servicio", "abono", "otro"];
const PAYMENT_METHODS: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia", "credito"];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ["insumos", "transporte", "servicios", "alimentacion", "otro"];

const PM_ICON: Record<PaymentMethod, React.ReactNode> = {
  efectivo:      <Banknote className="w-3.5 h-3.5" />,
  tarjeta:       <CreditCard className="w-3.5 h-3.5" />,
  transferencia: <Smartphone className="w-3.5 h-3.5" />,
  credito:       <DollarSign className="w-3.5 h-3.5" />,
};

const emptyEntry = (): EntryFormData => ({
  type: "venta", description: "", clientName: "", amount: "", paymentMethod: "efectivo",
});

// ─── Modal agregar entrada ────────────────────────────────────────────────────
function AddEntryModal({
  onAdd, onClose,
}: {
  onAdd: (entry: CuadreEntry) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EntryFormData>(emptyEntry());
  const [error, setError] = useState("");

  const set = (k: keyof EntryFormData, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.description.trim()) { setError("Describe la operación"); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError("Ingresa un monto válido"); return; }
    onAdd({
      id: uid(),
      type: form.type,
      description: form.description.trim(),
      clientName: form.clientName.trim() || undefined,
      amount,
      paymentMethod: form.paymentMethod,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4"
        style={{ animation: "slideUp 260ms cubic-bezier(0.23,1,0.32,1) both" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white">Agregar registro</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tipo */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Tipo</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {ENTRY_TYPES.map(t => {
              const cfg = ENTRY_TYPE_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all active:scale-[0.97]",
                    form.type === t
                      ? "bg-white/12 border-white/30 text-white"
                      : "bg-white/3 border-white/8 text-white/40 hover:border-white/15"
                  )}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span className="text-[9px] font-bold leading-tight">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Descripción</p>
          <input
            type="text"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder={
              form.type === "venta" ? "iPhone 15 Pro 256GB…" :
              form.type === "reparacion" ? "Pantalla Samsung A54…" :
              form.type === "servicio" ? "Instalación software…" :
              "Descripción…"
            }
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Cliente (opcional) */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Cliente <span className="text-white/25 normal-case font-normal">(opcional)</span></p>
          <input
            type="text"
            value={form.clientName}
            onChange={e => set("clientName", e.target.value)}
            placeholder="Nombre del cliente…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Monto + Método */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Monto (DOP)</p>
            <input
              type="number"
              value={form.amount}
              onChange={e => set("amount", e.target.value)}
              placeholder="0"
              min="0"
              step="50"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Pago</p>
            <div className="relative">
              <select
                value={form.paymentMethod}
                onChange={e => set("paymentMethod", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 appearance-none transition-colors"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m} className="bg-zinc-900">
                    {PAYMENT_METHOD_CONFIG[m].icon} {PAYMENT_METHOD_CONFIG[m].label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          className="w-full py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
        >
          Agregar registro
        </button>
      </div>
    </div>
  );
}

// ─── Modal agregar gasto ──────────────────────────────────────────────────────
interface ExpenseFormData {
  description: string;
  amount: string;
  category: ExpenseCategory;
}

function AddExpenseModal({
  onAdd, onClose,
}: {
  onAdd: (expense: CuadreExpense) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ExpenseFormData>({
    description: "", amount: "", category: "insumos",
  });
  const [error, setError] = useState("");

  const set = (k: keyof ExpenseFormData, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.description.trim()) { setError("Describe el gasto"); return; }
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) { setError("Ingresa un monto válido"); return; }
    onAdd({
      id: uid(),
      description: form.description.trim(),
      amount,
      category: form.category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4"
        style={{ animation: "slideUp 260ms cubic-bezier(0.23,1,0.32,1) both" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white">Registrar gasto</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categoría */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Categoría</p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {EXPENSE_CATEGORIES.map(c => {
              const cfg = EXPENSE_CATEGORY_CONFIG[c];
              return (
                <button
                  key={c}
                  onClick={() => set("category", c)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all active:scale-[0.97]",
                    form.category === c
                      ? "bg-red-500/15 border-red-500/30 text-white"
                      : "bg-white/3 border-white/8 text-white/40 hover:border-white/15"
                  )}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span className="text-[9px] font-bold leading-tight">{cfg.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Descripción</p>
          <input
            type="text"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Pantalla de repuesto, gasolina…"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {/* Monto */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Monto (DOP)</p>
          <input
            type="number"
            value={form.amount}
            onChange={e => set("amount", e.target.value)}
            placeholder="0"
            min="0"
            step="50"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        {error && (
          <p className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-black text-sm hover:bg-red-500/30 transition-colors active:scale-[0.98]"
        >
          Agregar gasto
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NuevoCuadrePage() {
  const { user } = useAuth();
  const router = useRouter();

  const week = getCurrentWeekRange();
  const [entries, setEntries] = useState<CuadreEntry[]>([]);
  const [expenses, setExpenses] = useState<CuadreExpense[]>([]);
  const [notes, setNotes] = useState("");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"entries" | "expenses">("entries");

  const totals = calcCuadreTotals(entries, expenses);

  const save = useCallback(async (action?: "submit") => {
    if (!user?.shopId || !user?.branchId || !user?.id) {
      setError("No se encontró tu perfil. Inicia sesión nuevamente.");
      return;
    }

    const setSaving = action === "submit" ? setIsSubmitting : setIsSaving;
    setSaving(true);
    setError("");

    try {
      const body = {
        shopId: user.shopId,
        branchId: user.branchId,
        branchName: user.branchName || "",
        employeeId: user.id,
        employeeName: user.name || user.username || "",
        employeeRole: user.role,
        startDate: week.startDate,
        endDate: week.endDate,
        weekLabel: week.weekLabel,
        entries,
        expenses,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/cuadres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.cuadre) {
        setError(data.error || "Error al guardar. Intenta de nuevo.");
        return;
      }

      if (action === "submit") {
        // Submit inmediatamente
        await fetch(`/api/cuadres/${data.cuadre.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: user.shopId, action: "submit" }),
        });
      }

      router.push("/staff/cuadres");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }, [user, week, entries, expenses, notes, router]);

  const removeEntry = (id: string) =>
    setEntries(p => p.filter(e => e.id !== id));

  const removeExpense = (id: string) =>
    setExpenses(p => p.filter(e => e.id !== id));

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-white pb-32">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3"
          style={{ animation: "fadeUp 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
          <Link href="/staff/cuadres" className="p-2 -ml-2 text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-white">Nuevo Cuadre</h1>
            <p className="text-[11px] text-white/45 truncate">{week.weekLabel}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

          {/* Totales rápidos */}
          <div className="grid grid-cols-3 gap-2"
            style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 40ms both" }}>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-lg font-black text-green-400 leading-none">{fmt(totals.totalIncome)}</p>
              <p className="text-[9px] text-white/45 uppercase tracking-[0.12em] mt-1.5">Ingresos</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-lg font-black text-red-400 leading-none">{fmt(totals.totalExpenses)}</p>
              <p className="text-[9px] text-white/45 uppercase tracking-[0.12em] mt-1.5">Gastos</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className={cn("text-lg font-black leading-none", totals.net >= 0 ? "text-white" : "text-red-400")}>
                {fmt(totals.net)}
              </p>
              <p className="text-[9px] text-white/45 uppercase tracking-[0.12em] mt-1.5">Neto</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1"
            style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 60ms both" }}>
            <button
              onClick={() => setTab("entries")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "entries" ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white/60"
              )}
            >
              Ingresos ({entries.length})
            </button>
            <button
              onClick={() => setTab("expenses")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                tab === "expenses" ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white/60"
              )}
            >
              Gastos ({expenses.length})
            </button>
          </div>

          {/* Contenido del tab */}
          {tab === "entries" ? (
            <div className="space-y-2.5"
              style={{ animation: "fadeUp 280ms cubic-bezier(0.23,1,0.32,1) both" }}>
              {entries.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-3 text-center border border-dashed border-white/10 rounded-2xl">
                  <Package className="w-7 h-7 text-white/15" />
                  <p className="text-xs text-white/35">Agrega ventas, reparaciones y servicios</p>
                </div>
              ) : (
                entries.map(entry => (
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-black text-white">{fmt(entry.amount)}</span>
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => setShowEntryModal(true)}
                className="w-full py-3 flex items-center justify-center gap-2 bg-white/3 border border-dashed border-white/15 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 hover:border-white/25 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar ingreso
              </button>
            </div>
          ) : (
            <div className="space-y-2.5"
              style={{ animation: "fadeUp 280ms cubic-bezier(0.23,1,0.32,1) both" }}>
              {expenses.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-3 text-center border border-dashed border-white/10 rounded-2xl">
                  <DollarSign className="w-7 h-7 text-white/15" />
                  <p className="text-xs text-white/35">Registra los gastos de esta semana</p>
                </div>
              ) : (
                expenses.map(expense => (
                  <div key={expense.id} className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                    <span className="text-base flex-shrink-0">{EXPENSE_CATEGORY_CONFIG[expense.category].icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{expense.description}</p>
                      <p className="text-[10px] text-white/35">{EXPENSE_CATEGORY_CONFIG[expense.category].label}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-black text-red-400">-{fmt(expense.amount)}</span>
                      <button
                        onClick={() => removeExpense(expense.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-white/5 text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => setShowExpenseModal(true)}
                className="w-full py-3 flex items-center justify-center gap-2 bg-red-500/3 border border-dashed border-red-500/15 rounded-xl text-xs font-bold text-red-400/50 hover:text-red-400/80 hover:border-red-500/25 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar gasto
              </button>
            </div>
          )}

          {/* Notas */}
          <div style={{ animation: "fadeUp 320ms cubic-bezier(0.23,1,0.32,1) 100ms both" }}>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Notas <span className="text-white/25 normal-case font-normal">(opcional)</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones, pendientes, novedades de la semana…"
              rows={3}
              className="w-full bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/18 resize-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Botones fijos */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 py-4 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-8">
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => save()}
            disabled={isSaving || isSubmitting || entries.length === 0}
            className="py-3.5 flex items-center justify-center gap-2 bg-white/5 border border-white/12 text-white/60 rounded-2xl font-black text-sm hover:bg-white/8 hover:text-white/80 transition-all disabled:opacity-40 active:scale-[0.97]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          <button
            onClick={() => save("submit")}
            disabled={isSaving || isSubmitting || entries.length === 0}
            className="py-3.5 flex items-center justify-center gap-2 bg-white text-black rounded-2xl font-black text-sm hover:bg-white/90 transition-all disabled:opacity-40 active:scale-[0.97]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </button>
        </div>
        <p className="text-center text-[10px] text-white/25 mt-2.5">
          {entries.length === 0
            ? "Agrega al menos un registro para continuar"
            : "Guardar = borrador · Enviar = solicitar aprobación"}
        </p>
      </div>

      {/* Modales */}
      {showEntryModal && (
        <AddEntryModal
          onAdd={entry => setEntries(p => [...p, entry])}
          onClose={() => setShowEntryModal(false)}
        />
      )}
      {showExpenseModal && (
        <AddExpenseModal
          onAdd={expense => setExpenses(p => [...p, expense])}
          onClose={() => setShowExpenseModal(false)}
        />
      )}
    </>
  );
}

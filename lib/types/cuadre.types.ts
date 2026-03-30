// ─── Cuadre de Caja / Registro de Actividad ──────────────────────────────────
// Sistema de cuadre semanal para empleados por sucursal

export type CuadreStatus = "draft" | "submitted" | "approved" | "rejected";

export type CuadreEntryType =
  | "venta"        // Venta de producto
  | "reparacion"   // Reparación de equipo
  | "servicio"     // Servicio técnico / instalación
  | "abono"        // Abono a crédito/financiamiento
  | "otro";        // Otro ingreso

export type PaymentMethod =
  | "efectivo"
  | "tarjeta"
  | "transferencia"
  | "credito";     // Crédito interno / financiamiento

// ─── Entrada individual (venta, reparación, etc.) ────────────────────────────

export interface CuadreEntry {
  id: string;
  type: CuadreEntryType;
  description: string;        // "Samsung A55 128GB", "Pantalla iPhone 14", etc.
  clientName?: string;
  amount: number;             // Monto en la moneda local
  paymentMethod: PaymentMethod;
  orderId?: string;           // Link a orden si aplica
  productId?: string;
  quantity?: number;
  createdAt: string;          // ISO date string
}

// ─── Gasto registrado ────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "insumos"      // Partes, repuestos, materiales
  | "transporte"
  | "servicios"    // Agua, luz, internet
  | "alimentacion"
  | "otro";

export interface CuadreExpense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
}

// ─── Cuadre completo ─────────────────────────────────────────────────────────

export interface Cuadre {
  id: string;
  shopId: string;
  branchId: string;
  branchName: string;

  employeeId: string;
  employeeName: string;
  employeeRole?: string;

  // Período
  periodType: "daily" | "weekly";
  weekLabel: string;       // "Semana 13 · 24–30 Mar 2026"
  startDate: string;       // "2026-03-24"
  endDate: string;         // "2026-03-30"

  // Registros de actividad
  entries: CuadreEntry[];
  expenses: CuadreExpense[];

  // Totales calculados por tipo
  totalVentas: number;
  totalReparaciones: number;
  totalServicios: number;
  totalAbonosCobrados: number;
  totalOtros: number;
  totalIncome: number;
  totalExpenses: number;
  net: number;

  // Totales por método de pago
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalCredito: number;

  // Estado y flujo de aprobación
  status: CuadreStatus;
  notes?: string;
  rejectionReason?: string;

  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;     // Nombre del dueño/gerente

  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const CUADRE_STATUS_CONFIG: Record<CuadreStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
}> = {
  draft: {
    label: "Borrador",
    color: "text-white/40",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  submitted: {
    label: "Enviado",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  approved: {
    label: "Aprobado",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
  },
  rejected: {
    label: "Rechazado",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

export const ENTRY_TYPE_CONFIG: Record<CuadreEntryType, {
  label: string;
  icon: string;
  color: string;
}> = {
  venta: { label: "Venta", icon: "📦", color: "text-blue-400" },
  reparacion: { label: "Reparación", icon: "🔧", color: "text-orange-400" },
  servicio: { label: "Servicio", icon: "⚙️", color: "text-purple-400" },
  abono: { label: "Abono cobrado", icon: "💳", color: "text-cyan-400" },
  otro: { label: "Otro", icon: "📝", color: "text-white/50" },
};

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
  label: string;
  icon: string;
}> = {
  efectivo: { label: "Efectivo", icon: "💵" },
  tarjeta: { label: "Tarjeta", icon: "💳" },
  transferencia: { label: "Transferencia", icon: "🏦" },
  credito: { label: "Crédito", icon: "📋" },
};

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, {
  label: string;
  icon: string;
}> = {
  insumos: { label: "Insumos / Repuestos", icon: "🔩" },
  transporte: { label: "Transporte", icon: "🚗" },
  servicios: { label: "Servicios (luz, agua)", icon: "💡" },
  alimentacion: { label: "Alimentación", icon: "🍽️" },
  otro: { label: "Otro", icon: "📌" },
};

// ─── Helpers de cálculo ───────────────────────────────────────────────────────

export function calcCuadreTotals(entries: CuadreEntry[], expenses: CuadreExpense[]): Omit<
  Pick<Cuadre,
    "totalVentas" | "totalReparaciones" | "totalServicios" | "totalAbonosCobrados" |
    "totalOtros" | "totalIncome" | "totalExpenses" | "net" |
    "totalEfectivo" | "totalTarjeta" | "totalTransferencia" | "totalCredito"
  >,
  never
> {
  const totalVentas = entries.filter(e => e.type === "venta").reduce((s, e) => s + e.amount, 0);
  const totalReparaciones = entries.filter(e => e.type === "reparacion").reduce((s, e) => s + e.amount, 0);
  const totalServicios = entries.filter(e => e.type === "servicio").reduce((s, e) => s + e.amount, 0);
  const totalAbonosCobrados = entries.filter(e => e.type === "abono").reduce((s, e) => s + e.amount, 0);
  const totalOtros = entries.filter(e => e.type === "otro").reduce((s, e) => s + e.amount, 0);
  const totalIncome = entries.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpenses;

  const totalEfectivo = entries.filter(e => e.paymentMethod === "efectivo").reduce((s, e) => s + e.amount, 0);
  const totalTarjeta = entries.filter(e => e.paymentMethod === "tarjeta").reduce((s, e) => s + e.amount, 0);
  const totalTransferencia = entries.filter(e => e.paymentMethod === "transferencia").reduce((s, e) => s + e.amount, 0);
  const totalCredito = entries.filter(e => e.paymentMethod === "credito").reduce((s, e) => s + e.amount, 0);

  return {
    totalVentas, totalReparaciones, totalServicios, totalAbonosCobrados, totalOtros,
    totalIncome, totalExpenses, net,
    totalEfectivo, totalTarjeta, totalTransferencia, totalCredito,
  };
}

// ─── Generador de semana actual ───────────────────────────────────────────────

export function getCurrentWeekRange(): { startDate: string; endDate: string; weekLabel: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=dom
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const fmtLabel = (d: Date) =>
    d.toLocaleDateString("es-DO", { day: "numeric", month: "short" });

  const weekNum = getWeekNumber(monday);
  const year = monday.getFullYear();

  return {
    startDate: fmt(monday),
    endDate: fmt(sunday),
    weekLabel: `Semana ${weekNum} · ${fmtLabel(monday)}–${fmtLabel(sunday)} ${year}`,
  };
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

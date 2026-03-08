"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, Calendar, Sparkles, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "primary";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}: KPICardProps) {
  const iconBgVariants = {
    default: "bg-white/10",
    gold: "bg-gold/20",
    primary: "bg-primary/20",
  };

  const iconColorVariants = {
    default: "text-white",
    gold: "text-gold",
    primary: "text-primary",
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconBgVariants[variant]
          )}
        >
          <div className={iconColorVariants[variant]}>{icon}</div>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            <TrendingUp
              className={cn("w-4 h-4", !trend.isPositive && "rotate-180")}
            />
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-300">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

interface SalesChartProps {
  data: Array<{
    date: string;
    day: string;
    sales: number;
    orders: number;
  }>;
  orderLabel?: string;
}

export function SalesChart({ data, orderLabel = "Pedido" }: SalesChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel rounded-lg p-3 border border-white/20">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-primary text-sm">
            Ventas: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-slate-300 text-xs text-capitalize">
            {payload[0].payload.orders} {orderLabel.toLowerCase()}{payload[0].payload.orders !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Ventas Semanales</h3>
          <p className="text-sm text-slate-300">Últimos 7 días</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-slate-300">Ventas</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar
              dataKey="sales"
              fill="url(#primaryGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface DashboardKPIsProps {
  totalSales: number;
  paidSales?: number;
  totalOrders: number;
  averageTicket: number;
  topService: string | null;
  businessType?: string;
  orderLabel?: string;
  productLabel?: string;
}

export function DashboardKPIs({
  totalSales,
  paidSales,
  totalOrders,
  averageTicket,
  topService,
  businessType = "service", // Default to service for backward compatibility
  orderLabel,
  productLabel,
}: DashboardKPIsProps) {
  const type = businessType?.toLowerCase() || "";
  const isService = type.includes("service") ||
    type.includes("rental") ||
    type.includes("beauty") ||
    type.includes("salon") ||
    type.includes("nails") ||
    type.includes("makeup") ||
    type.includes("spa") ||
    type.includes("barber");

  const finalOrderLabel = orderLabel || (isService ? "Cita" : "Pedido");
  const finalProductLabel = productLabel || (isService ? "Servicio" : "Producto");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Ventas Hoy"
        value={`$${totalSales.toLocaleString()}`}
        icon={<DollarSign className="w-6 h-6" />}
        variant="primary"
        trend={paidSales !== undefined ? { value: Math.round((paidSales / (totalSales || 1)) * 100), isPositive: true } : undefined}
        subtitle={paidSales !== undefined ? `Cobrado: $${paidSales.toLocaleString()}` : undefined}
      />

      {/* Conditionally show Appointments or Orders */}
      <KPICard
        title={`${finalOrderLabel}s Hoy`}
        value={totalOrders}
        subtitle={
          totalOrders === 1
            ? `${finalOrderLabel.toLowerCase()} recibid${finalOrderLabel.endsWith('a') ? 'a' : 'o'}`
            : `${finalOrderLabel.toLowerCase()}s recibid${finalOrderLabel.endsWith('a') ? 'a' : 'o'}s`
        }
        icon={isService ? <Calendar className="w-6 h-6" /> : <Package className="w-6 h-6" />}
        variant="gold"
      />

      <KPICard
        title="Ticket Promedio"
        value={`$${Math.round(averageTicket).toLocaleString()}`}
        icon={<TrendingUp className="w-6 h-6" />}
      />

      {/* Show Top Service/Product or specific metric based on type */}
      <KPICard
        title={`Top ${finalProductLabel}`}
        value={topService || "—"}
        subtitle="Más solicitado hoy"
        icon={<Sparkles className="w-6 h-6" />}
        variant="gold"
      />
    </div>
  );
}

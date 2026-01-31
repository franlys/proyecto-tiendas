"use client";

import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, TrendingUp, Award, ArrowUpRight } from "lucide-react";
import { DEMO_STATS } from "../demoData";

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function DashboardMockup() {
  const stats = DEMO_STATS;
  const maxSales = Math.max(...stats.weeklyData.map((d) => d.sales));

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Dashboard</h2>
          <p className="text-xs text-slate-400">Resumen del día</p>
        </div>
        <div className="flex items-center gap-1 text-green-400 text-xs">
          <ArrowUpRight className="w-3 h-3" />
          <span>+{stats.comparisonPercent}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {/* Today Sales */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-white text-lg font-bold">${stats.todaySales.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Ventas Hoy</p>
        </motion.div>

        {/* Today Orders */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-white text-lg font-bold">{stats.todayOrders}</p>
          <p className="text-xs text-slate-400">Pedidos</p>
        </motion.div>

        {/* Avg Ticket */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-white text-lg font-bold">${stats.avgTicket}</p>
          <p className="text-xs text-slate-400">Ticket Promedio</p>
        </motion.div>

        {/* Top Service */}
        <motion.div variants={itemVariants} className="glass-panel rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-gold" />
            </div>
          </div>
          <p className="text-white text-sm font-bold truncate">{stats.topService}</p>
          <p className="text-xs text-slate-400">Más Vendido</p>
        </motion.div>
      </motion.div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl p-4"
      >
        <h3 className="text-white text-sm font-medium mb-4">Ventas Semanales</h3>

        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-24">
          {stats.weeklyData.map((day, i) => (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.sales / maxSales) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                className={`w-full rounded-t-sm ${
                  i === stats.weeklyData.length - 2
                    ? "bg-gradient-to-t from-cyan-600 to-cyan-400"
                    : "bg-white/20"
                }`}
              />
              <span className="text-[10px] text-slate-400">{day.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-2"
      >
        <button className="glass-panel rounded-lg p-2 text-center hover:bg-white/10 transition-colors">
          <span className="text-xs text-slate-300">Cerrar Caja</span>
        </button>
        <button className="glass-panel rounded-lg p-2 text-center hover:bg-white/10 transition-colors">
          <span className="text-xs text-slate-300">Generar Reporte</span>
        </button>
      </motion.div>
    </div>
  );
}

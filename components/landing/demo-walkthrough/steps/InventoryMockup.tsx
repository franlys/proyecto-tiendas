"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, Plus, Search } from "lucide-react";
import { DEMO_INVENTORY } from "../demoData";

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function InventoryMockup() {
  const totalProducts = DEMO_INVENTORY.length;
  const lowStock = DEMO_INVENTORY.filter((p) => p.stock <= p.lowStockThreshold).length;
  const totalValue = DEMO_INVENTORY.reduce((sum, p) => sum + p.cost * p.stock, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Inventario</h2>
          <p className="text-xs text-slate-400">Control de stock</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center hover:bg-cyan-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-white font-bold">{totalProducts}</p>
          <p className="text-[10px] text-slate-400">Productos</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-white font-bold">${(totalValue / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-slate-400">Valor</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-amber-400 font-bold">{lowStock}</p>
          <p className="text-[10px] text-slate-400">Stock Bajo</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          readOnly
        />
      </div>

      {/* Product List */}
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {DEMO_INVENTORY.map((item) => {
          const isLowStock = item.stock <= item.lowStockThreshold;

          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="glass-panel rounded-lg p-3 flex items-center gap-3"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.category}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {isLowStock && (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      isLowStock ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {item.stock}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">${item.price}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Variants Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-lg p-3 border-cyan-500/30"
      >
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-cyan-400 font-medium">Variantes</span>
        </div>
        <p className="text-xs text-slate-400">
          Cada producto puede tener múltiples variantes con precios y stock independiente.
        </p>
        <div className="mt-2 flex gap-2">
          <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">Original</span>
          <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">Premium</span>
          <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">Económica</span>
        </div>
      </motion.div>
    </div>
  );
}

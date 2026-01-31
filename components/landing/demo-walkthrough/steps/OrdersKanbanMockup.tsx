"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, Package, Truck, MessageCircle } from "lucide-react";
import { DEMO_ORDERS } from "../demoData";

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

const columns = [
  { id: "pending", label: "Pendiente", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "confirmed", label: "Confirmado", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "preparing", label: "Preparando", icon: Package, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "dispatched", label: "Enviado", icon: Truck, color: "text-green-400", bg: "bg-green-500/10" },
];

export function OrdersKanbanMockup() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Pedidos</h2>
          <p className="text-xs text-slate-400">Vista Kanban</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
            2 pendientes
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {columns.map((column) => {
          const orders = DEMO_ORDERS.filter((o) => o.status === column.id);
          const Icon = column.icon;

          return (
            <motion.div
              key={column.id}
              variants={staggerVariants}
              initial="hidden"
              animate="visible"
              className="flex-shrink-0 w-[140px]"
            >
              {/* Column Header */}
              <div className={`${column.bg} rounded-t-lg p-2 flex items-center gap-1`}>
                <Icon className={`w-3 h-3 ${column.color}`} />
                <span className={`text-xs font-medium ${column.color}`}>{column.label}</span>
                <span className="text-[10px] text-slate-500 ml-auto">({orders.length})</span>
              </div>

              {/* Column Content */}
              <div className="bg-white/5 rounded-b-lg p-1.5 min-h-[180px] space-y-1.5">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    variants={itemVariants}
                    className="glass-panel rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-cyan-400">{order.code}</span>
                      {order.isPaid ? (
                        <span className="text-[8px] px-1 bg-green-500/20 text-green-400 rounded">Pagado</span>
                      ) : (
                        <span className="text-[8px] px-1 bg-amber-500/20 text-amber-400 rounded">Pendiente</span>
                      )}
                    </div>

                    {/* Customer */}
                    <p className="text-white text-xs truncate">{order.customerName}</p>

                    {/* Items */}
                    <p className="text-[9px] text-slate-400 truncate">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10">
                      <span className="text-gold text-xs font-medium">${order.total}</span>
                      <button className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors">
                        <MessageCircle className="w-2.5 h-2.5 text-green-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Empty State */}
                {orders.length === 0 && (
                  <div className="h-20 flex items-center justify-center">
                    <p className="text-[10px] text-slate-500">Sin pedidos</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-lg p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-white">Notifica al cliente con un click</p>
          <p className="text-[10px] text-slate-400">Envía actualizaciones de estado por WhatsApp</p>
        </div>
      </motion.div>
    </div>
  );
}

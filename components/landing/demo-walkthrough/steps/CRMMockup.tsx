"use client";

import { motion } from "framer-motion";
import { Users, Star, Search, StickyNote, Award } from "lucide-react";
import { DEMO_CLIENTS } from "../demoData";

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

export function CRMMockup() {
  const totalClients = DEMO_CLIENTS.length;
  const vipClients = DEMO_CLIENTS.filter((c) => c.isVIP).length;
  const totalRevenue = DEMO_CLIENTS.reduce((sum, c) => sum + c.totalSpent, 0);
  const selectedClient = DEMO_CLIENTS[0];

  return (
    <div className="h-full flex">
      {/* Left Panel - Client List */}
      <div className="w-1/2 border-r border-white/10 p-3 space-y-3">
        {/* Header */}
        <div>
          <h2 className="text-white font-semibold text-sm">Clientes</h2>
          <p className="text-[10px] text-slate-400">{totalClients} registrados</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-panel rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-gold" />
              <span className="text-white font-bold text-sm">{vipClients}</span>
            </div>
            <p className="text-[9px] text-slate-400">VIP</p>
          </div>
          <div className="glass-panel rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">${(totalRevenue / 1000).toFixed(1)}k</p>
            <p className="text-[9px] text-slate-400">Total</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-7 pr-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder:text-slate-500 focus:outline-none"
            readOnly
          />
        </div>

        {/* Client List */}
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5 overflow-y-auto max-h-[200px]"
        >
          {DEMO_CLIENTS.map((client, i) => (
            <motion.div
              key={client.id}
              variants={itemVariants}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                i === 0 ? "bg-cyan-500/20 border border-cyan-500/30" : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <span className="text-[10px] text-white font-medium">
                    {client.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white text-xs font-medium truncate">
                      {client.name}
                    </span>
                    {client.isVIP && <Star className="w-2.5 h-2.5 text-gold fill-gold" />}
                  </div>
                  <p className="text-[9px] text-slate-400">{client.lastVisit}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel - Client Detail */}
      <div className="w-1/2 p-3 space-y-3">
        {/* Client Header */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white font-bold">
              {selectedClient.name.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="text-white font-medium text-sm">{selectedClient.name}</h3>
              {selectedClient.isVIP && (
                <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-[8px] rounded">VIP</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">{selectedClient.phone}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-panel rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">${selectedClient.totalSpent.toLocaleString()}</p>
            <p className="text-[9px] text-slate-400">Total Gastado</p>
          </div>
          <div className="glass-panel rounded-lg p-2 text-center">
            <p className="text-white font-bold text-sm">{selectedClient.visitCount}</p>
            <p className="text-[9px] text-slate-400">Visitas</p>
          </div>
        </div>

        {/* Loyalty Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-lg p-2 border-gold/20"
        >
          <div className="flex items-center gap-1 mb-2">
            <Award className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-gold font-medium">Fidelidad</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  i < selectedClient.loyaltyStamps
                    ? "bg-gold"
                    : "bg-white/10"
                }`}
              >
                {i < selectedClient.loyaltyStamps && (
                  <Star className="w-2 h-2 text-slate-900 fill-slate-900" />
                )}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 mt-1">
            {selectedClient.loyaltyStamps}/10 sellos
          </p>
        </motion.div>

        {/* Notes */}
        {selectedClient.notes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-lg p-2"
          >
            <div className="flex items-center gap-1 mb-1">
              <StickyNote className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-400 font-medium">Notas Privadas</span>
            </div>
            <p className="text-[10px] text-slate-300 italic">&quot;{selectedClient.notes}&quot;</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

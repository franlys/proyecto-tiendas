"use client";

import { motion } from "framer-motion";
import { Send, Users, MessageCircle, Plus, Pause, Play, CheckCircle } from "lucide-react";
import { DEMO_CAMPAIGNS } from "../demoData";

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

export function MarketingMockup() {
  const activeCampaign = DEMO_CAMPAIGNS.find((c) => c.status === "sending");
  const completedCount = DEMO_CAMPAIGNS.filter((c) => c.status === "completed").length;
  const totalSent = DEMO_CAMPAIGNS.reduce((sum, c) => sum + c.sentCount, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Campañas</h2>
          <p className="text-xs text-slate-400">Marketing WhatsApp</p>
        </div>
        <button className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center hover:bg-cyan-600 transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-white font-bold">{DEMO_CAMPAIGNS.length}</p>
          <p className="text-[10px] text-slate-400">Campañas</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-green-400 font-bold">{completedCount}</p>
          <p className="text-[10px] text-slate-400">Completadas</p>
        </div>
        <div className="glass-panel rounded-lg p-2 text-center">
          <p className="text-white font-bold">{totalSent}</p>
          <p className="text-[10px] text-slate-400">Enviados</p>
        </div>
      </div>

      {/* Active Campaign Progress */}
      {activeCampaign && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-lg p-3 border border-cyan-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400 font-medium">Enviando...</span>
            </div>
            <button className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Pause className="w-3 h-3 text-slate-300" />
            </button>
          </div>

          <h3 className="text-white text-sm font-medium mb-2">{activeCampaign.name}</h3>

          {/* Progress Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(activeCampaign.sentCount / activeCampaign.totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">
              {activeCampaign.sentCount} / {activeCampaign.totalCount}
            </span>
            <span className="text-slate-400">
              ~{Math.ceil((activeCampaign.totalCount - activeCampaign.sentCount) * 0.25)} min restantes
            </span>
          </div>
        </motion.div>
      )}

      {/* Campaign List */}
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {DEMO_CAMPAIGNS.map((campaign) => {
          const statusConfig = {
            draft: { label: "Borrador", color: "text-slate-400", bg: "bg-slate-500/20" },
            sending: { label: "Enviando", color: "text-cyan-400", bg: "bg-cyan-500/20" },
            completed: { label: "Completado", color: "text-green-400", bg: "bg-green-500/20" },
            paused: { label: "Pausado", color: "text-amber-400", bg: "bg-amber-500/20" },
          }[campaign.status];

          return (
            <motion.div
              key={campaign.id}
              variants={itemVariants}
              className="glass-panel rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <h4 className="text-white text-xs font-medium">{campaign.name}</h4>
                    <p className="text-[10px] text-slate-500">{campaign.segment}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                &quot;{campaign.message.substring(0, 60)}...&quot;
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Send className="w-3 h-3" />
                  <span>{campaign.sentCount} enviados</span>
                </div>
                <span className="text-[10px] text-slate-500">{campaign.createdAt}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Anti-ban Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-[10px] text-slate-500">
          Sistema anti-ban: 10-20s entre mensajes
        </p>
      </motion.div>
    </div>
  );
}

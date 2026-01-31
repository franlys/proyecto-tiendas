"use client";

import { motion } from "framer-motion";
import { Download, Share2, Sparkles } from "lucide-react";
import { DEMO_PROMO_TEMPLATES } from "../demoData";

export function PromoGeneratorMockup() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-white/10">
        <h2 className="text-white font-semibold">Generador de Promos</h2>
        <p className="text-xs text-slate-400">Crea Stories en segundos</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Templates */}
        <div>
          <h3 className="text-xs text-slate-400 mb-2">Templates Rápidos</h3>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_PROMO_TEMPLATES.map((template, i) => (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`p-3 rounded-lg bg-gradient-to-br ${template.gradient} text-white text-sm font-bold hover:scale-105 transition-transform ${
                  i === 0 ? "ring-2 ring-white/50" : ""
                }`}
              >
                {template.title}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-xs text-slate-400 mb-2">Vista Previa</h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative aspect-[9/16] max-h-[280px] mx-auto rounded-xl overflow-hidden"
          >
            {/* Story Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-orange-400">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full" />
                <div className="absolute bottom-20 right-10 w-16 h-16 border-4 border-white rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
              {/* Discount Badge */}
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: -15, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute top-8 right-4 bg-white text-rose-500 px-4 py-2 rounded-lg font-bold text-lg shadow-lg"
              >
                2x1
              </motion.div>

              {/* Main Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-white text-2xl font-bold drop-shadow-lg">
                  SOLO HOY
                </h2>
                <p className="text-white/90 text-sm">
                  Manicure + Pedicure
                </p>
              </motion.div>

              {/* Shop Logo */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-6 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Tu Negocio</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Edit Options */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Título</label>
            <input
              type="text"
              defaultValue="SOLO HOY"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              readOnly
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Subtítulo</label>
            <input
              type="text"
              defaultValue="Manicure + Pedicure"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

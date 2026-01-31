"use client";

import { motion } from "framer-motion";
import { Palette, Sparkles, Image, Video, Check } from "lucide-react";
import { DEMO_THEME_PRESETS, DEMO_BACKGROUND_EFFECTS } from "../demoData";

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export function SettingsMockup() {
  const selectedTheme = DEMO_THEME_PRESETS[0];
  const selectedBg = DEMO_BACKGROUND_EFFECTS[1];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-white font-semibold">Personalización</h2>
        <p className="text-xs text-slate-400">Tu marca, tu estilo</p>
      </div>

      {/* Color Theme */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-cyan-400" />
          <h3 className="text-white text-sm font-medium">Tema de Colores</h3>
        </div>

        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-2"
        >
          {DEMO_THEME_PRESETS.map((theme, i) => (
            <motion.button
              key={theme.id}
              variants={itemVariants}
              className={`relative p-2 rounded-lg transition-all ${
                i === 0
                  ? "ring-2 ring-cyan-500 bg-white/10"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.accent }}
                />
              </div>
              <p className="text-[10px] text-slate-300 truncate">{theme.name}</p>
              {i === 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Background Effects */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-white text-sm font-medium">Fondo</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {[
            { id: "effects", label: "Efectos", icon: Sparkles },
            { id: "image", label: "Imagen", icon: Image },
            { id: "video", label: "Video", icon: Video },
          ].map((tab, i) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                i === 0
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Effects Grid */}
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-2"
        >
          {DEMO_BACKGROUND_EFFECTS.map((effect, i) => (
            <motion.button
              key={effect.id}
              variants={itemVariants}
              className={`relative h-16 rounded-lg overflow-hidden transition-all ${
                i === 1
                  ? "ring-2 ring-purple-500"
                  : "hover:ring-1 hover:ring-white/30"
              }`}
            >
              <div className={`absolute inset-0 ${effect.preview}`} />
              {effect.id === "galaxy" && (
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                      style={{
                        top: `${20 + j * 15}%`,
                        left: `${10 + j * 20}%`,
                        animationDelay: `${j * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="absolute inset-0 flex items-end p-2">
                <span className="text-[10px] text-white font-medium drop-shadow">{effect.name}</span>
              </div>
              {i === 1 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl p-3"
      >
        <h4 className="text-xs text-slate-400 mb-2">Vista Previa</h4>
        <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-900">
          {/* Simulated Galaxy Effect */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Content Preview */}
          <div className="relative h-full flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                style={{ backgroundColor: selectedTheme.primary }}
              >
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <p className="text-white text-xs font-medium">Tu Negocio</p>
            </div>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-slate-400">Colores:</span>
          <div
            className="w-4 h-4 rounded-full ring-1 ring-white/30"
            style={{ backgroundColor: selectedTheme.primary }}
          />
          <div
            className="w-4 h-4 rounded-full ring-1 ring-white/30"
            style={{ backgroundColor: selectedTheme.accent }}
          />
          <span className="text-[10px] text-slate-500 ml-auto">Galaxy</span>
        </div>
      </motion.div>
    </div>
  );
}

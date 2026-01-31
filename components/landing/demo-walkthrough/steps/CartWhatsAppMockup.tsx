"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Calendar, MessageCircle, X, Clock } from "lucide-react";
import { DEMO_SERVICES } from "../demoData";

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function CartWhatsAppMockup() {
  const selectedServices = DEMO_SERVICES.slice(0, 3);
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Tu Carrito</h2>
            <p className="text-xs text-slate-400">{selectedServices.length} servicios seleccionados</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 p-4 overflow-y-auto">
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {selectedServices.map((service) => (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="glass-panel rounded-xl p-3 flex items-center gap-3"
            >
              <img
                src={service.image}
                alt={service.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium truncate">{service.name}</h3>
                <p className="text-slate-400 text-xs">{service.duration} min</p>
              </div>
              <div className="text-right">
                <p className="text-gold font-medium">${service.price}</p>
                <button className="text-slate-500 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Date & Time Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Fecha y Hora
          </h3>
          <div className="glass-panel rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">Lunes, 3 Feb</span>
              <span className="text-cyan-400 text-xs">3:00 PM</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["2:00", "2:30", "3:00", "3:30"].map((time, i) => (
                <button
                  key={time}
                  className={`py-1.5 rounded-lg text-xs transition-colors ${
                    i === 2
                      ? "bg-cyan-500 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer with Total & CTA */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total</span>
          <span className="text-white font-bold text-lg">${total}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Duración estimada: {totalDuration} min</span>
        </div>

        {/* WhatsApp Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel rounded-xl p-3 bg-green-500/10 border-green-500/20"
        >
          <p className="text-xs text-slate-400 mb-2">Vista previa del mensaje:</p>
          <p className="text-xs text-white leading-relaxed">
            &quot;Hola! Quiero agendar: {selectedServices.map(s => s.name).join(", ")} para el Lunes 3 Feb a las 3:00 PM. Total: ${total}&quot;
          </p>
        </motion.div>

        {/* WhatsApp Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Confirmar en WhatsApp
        </motion.button>
      </div>
    </div>
  );
}

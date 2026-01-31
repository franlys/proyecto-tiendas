"use client";

import { motion } from "framer-motion";
import { DEMO_SERVICES, DEMO_PRODUCTS } from "../demoData";
import { CATEGORY_LABELS } from "@/lib/constants";

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

export function ShopFrontendMockup() {
  // Group services by category
  const categories = [...new Set(DEMO_SERVICES.map((s) => s.category))];

  return (
    <div className="p-4 pt-8 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 mx-auto mb-2 flex items-center justify-center">
          <span className="text-white font-bold text-lg">N</span>
        </div>
        <h2 className="text-white font-semibold">Tu Negocio</h2>
        <p className="text-xs text-slate-400">Elige tus servicios favoritos</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              i === 0
                ? "bg-cyan-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {DEMO_SERVICES.slice(0, 4).map((service) => (
          <motion.div
            key={service.id}
            variants={itemVariants}
            className="glass-panel rounded-xl overflow-hidden group cursor-pointer"
          >
            <div className="relative h-20 overflow-hidden">
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-1 right-1 bg-gold text-xs px-2 py-0.5 rounded-full text-slate-900 font-medium">
                ${service.price}
              </div>
            </div>
            <div className="p-2">
              <h3 className="text-white text-xs font-medium truncate">{service.name}</h3>
              <p className="text-slate-400 text-[10px]">{service.duration} min</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Products Section */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-white text-sm font-medium mb-3">Productos</h3>
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {DEMO_PRODUCTS.slice(0, 2).map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="relative h-16 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.promoPrice && (
                  <div className="absolute top-1 left-1 bg-rose-500 text-[10px] px-1.5 py-0.5 rounded text-white">
                    Oferta
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-white text-xs font-medium truncate">{product.name}</h3>
                <div className="flex items-center gap-1">
                  {product.promoPrice ? (
                    <>
                      <span className="text-gold text-xs font-medium">${product.promoPrice}</span>
                      <span className="text-slate-500 text-[10px] line-through">${product.price}</span>
                    </>
                  ) : (
                    <span className="text-gold text-xs font-medium">${product.price}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

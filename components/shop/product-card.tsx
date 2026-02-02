"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, Tag, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/shared";
import type { Product, ProductVariant } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addProduct, removeItem, getProductQuantity, updateProductQuantity, getVariantQuantity, updateVariantQuantity, removeVariant } = useCart(); // Assuming expanded UseCart

  // State for variant selection
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;

  // Base price (lowest)
  const basePrice = hasVariants
    ? Math.min(...product.variants!.map(v => v.price))
    : (product.promoPrice || product.price);

  const isOutOfStock = product.stock === 0; // Global stock check
  const hasPromo = !!product.promoPrice;


  // For simple products
  const simpleQuantity = !hasVariants ? getProductQuantity(product.id) : 0;
  const simpleInCart = simpleQuantity > 0;

  const handleSimpleAdd = () => {
    if (!isOutOfStock && simpleQuantity < product.stock) {
      addProduct(product, 1);
    }
  };

  const handleSimpleRemove = () => {
    if (simpleQuantity > 1) {
      updateProductQuantity(product.id, simpleQuantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <>
      <div className="group relative">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              "group-hover:scale-110",
              isOutOfStock && "opacity-50"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Promo Badge */}
          {hasPromo && !hasVariants && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold text-background text-xs font-bold">
                <Tag className="w-3 h-3" />
                OFERTA
              </span>
            </div>
          )}

          {/* Out of Stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="px-4 py-2 rounded-full bg-black/80 text-white text-sm font-medium">
                Agotado
              </span>
            </div>
          )}

          {/* Actions */}
          {!isOutOfStock && (
            <div className="absolute bottom-3 right-3 z-10">
              {hasVariants ? (
                /* Variant Selector Button */
                <button
                  onClick={() => setIsVariantModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-black text-xs font-bold uppercase tracking-wide shadow-lg transition-all active:scale-95"
                >
                  Opciones
                </button>
              ) : (
                /* Simple Add Toggle */
                simpleInCart ? (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-full shadow-lg p-0.5 sm:p-1">
                    <button
                      onClick={handleSimpleRemove}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-background" />
                    </button>
                    <span className="w-5 sm:w-8 text-center font-semibold text-background text-xs sm:text-base">
                      {simpleQuantity}
                    </span>
                    <button
                      onClick={handleSimpleAdd}
                      disabled={simpleQuantity >= product.stock}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors",
                        simpleQuantity >= product.stock
                          ? "bg-slate-200 text-slate-400"
                          : "bg-primary hover:bg-primary/90 text-white"
                      )}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSimpleAdd}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white hover:scale-110 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
                  </button>
                )
              )}
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-3 left-3 z-10">
            <div className="flex flex-col items-start">
              <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-bold">
                {hasVariants ? "Desde " : ""}${basePrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 px-1">
          <h3 className="font-display text-lg font-semibold text-white truncate">
            {product.name}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-1">
            {product.description}
          </p>
        </div>
      </div>

      {/* Variants Modal */}
      <AnimatePresence>
        {isVariantModalOpen && hasVariants && (
          <VariantsModal
            product={product}
            onClose={() => setIsVariantModalOpen(false)}
          // We pass cart methods here if needed, or use hook inside modal
          />
        )}
      </AnimatePresence>
    </>
  );
}

function VariantsModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { addProduct, getVariantQuantity, removeVariant, updateVariantQuantity } = useCart();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
            <p className="text-sm text-zinc-400">Selecciona una opción</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-zinc-800 text-zinc-400"><span className="sr-only">Cerrar</span><ChevronDown /></button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {product.variants!.map(variant => {
            const qty = getVariantQuantity(product.id, variant.id);
            const stock = variant.stock || 0;

            return (
              <div key={variant.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{variant.name}</span>
                    {stock < 5 && stock > 0 && <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 rounded">¡Pocos!</span>}
                  </div>
                  {variant.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 mb-1">{variant.description}</p>
                  )}
                  <p className="text-sm font-semibold text-emerald-400">${variant.price.toLocaleString()}</p>
                </div>

                <div className="flex-shrink-0">
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900 rounded-lg p-0.5 sm:p-1 border border-zinc-700">
                      <button
                        onClick={() => qty > 1 ? updateVariantQuantity(product.id, variant.id, qty - 1) : removeVariant(product.id, variant.id)}
                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-white text-sm"
                      >-</button>
                      <span className="w-5 sm:w-6 text-center text-white text-xs sm:text-sm font-medium">{qty}</span>
                      <button
                        onClick={() => stock > qty && addProduct(product, 1, variant)}
                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded bg-indigo-600/80 text-white hover:bg-indigo-600 text-sm"
                      >+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => stock > 0 && addProduct(product, 1, variant)}
                      disabled={stock === 0}
                      className={cn(
                        "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                        stock === 0 ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200"
                      )}
                    >
                      {stock === 0 ? "Agotado" : "Agregar"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6">
          <button onClick={onClose} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors">
            Listo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

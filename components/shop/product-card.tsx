"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, Tag, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, useShop } from "@/components/shared";
import { useBusinessFeatures, useCombinedBusinessFeatures } from "@/lib/hooks/use-business-features";
import type { Product, ProductVariant } from "@/lib/constants";
import type { SelectedExtra } from "@/lib/types/product-extra.types";
import { ExtrasSelector } from "@/components/shop/extras-selector";
import { motion, AnimatePresence } from "framer-motion";

interface ProductCardProps {
  product: Product;
  hidePriceIfZero?: boolean;
  onClickIntercept?: () => void;
}

export function ProductCard({ product, hidePriceIfZero, onClickIntercept }: ProductCardProps) {
  const { addProduct, removeItem, getProductQuantity, updateProductQuantity, getVariantQuantity, updateVariantQuantity, removeVariant } = useCart();

  // State for modal selection
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const hasOptions = hasVariants || hasExtras; // Show "Options" button if variants OR extras

  // Base price (lowest)
  const basePrice = hasVariants
    ? Math.min(...product.variants!.map(v => v.price))
    : (product.promoPrice || product.price);

  // Business features check for stock management
  const shop = useShop();
  const { hasInventory } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  // Stock check - convert to number to handle string values from Firestore
  // For products with variants, check if ANY variant has stock > 0
  const stockNumber = Number(product.stock) || 0;
  const hasAnyVariantStock = hasVariants
    ? product.variants!.some(v => (Number(v.stock) || 0) > 0)
    : false;

  // Product is only out of stock if business follows inventory AND (no main stock AND (no variants OR no variant has stock))
  // SPECIAL: If hidePriceIfZero is active or infiniteStock is true, it's likely a menu component, so never show "Agotado"
  const isOutOfStock = hasInventory &&
    stockNumber === 0 &&
    (!hasVariants || !hasAnyVariantStock) &&
    !hidePriceIfZero &&
    !product.infiniteStock;

  const effectiveStock = hasInventory ? stockNumber : 999999;

  const hasPromo = !!product.promoPrice;


  // For simple products
  const simpleQuantity = !hasVariants ? getProductQuantity(product.id) : 0;
  const simpleInCart = simpleQuantity > 0;

  const handleSimpleAdd = (e?: React.MouseEvent) => {
    if (onClickIntercept && hidePriceIfZero) {
      e?.preventDefault();
      e?.stopPropagation();
      onClickIntercept();
      return;
    }
    if (!isOutOfStock && simpleQuantity < effectiveStock) {
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
              {hasOptions ? (
                /* Options Button (Variants and/or Extras) */
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-black text-xs font-bold uppercase tracking-wide shadow-lg transition-all active:scale-95"
                >
                  {hasExtras ? "Personalizar" : "Opciones"}
                </button>
              ) : (
                /* Simple Add Toggle */
                simpleInCart && !(hidePriceIfZero && basePrice === 0) ? (
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
                      onClick={() => handleSimpleAdd()}
                      disabled={simpleQuantity >= effectiveStock}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors",
                        simpleQuantity >= effectiveStock
                          ? "bg-slate-200 text-slate-400"
                          : "bg-primary hover:bg-primary/90 text-white"
                      )}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleSimpleAdd(e)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white hover:scale-110 flex items-center justify-center transition-all shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
                  </button>
                )
              )}
            </div>
          )}

          {/* Price Badge */}
          {/* Price Badge */}
          {basePrice > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex flex-col items-start">
                <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-bold">
                  {hasVariants ? "Desde " : ""}${basePrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}
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

      {/* Product Options Modal (Variants and/or Extras) */}
      <AnimatePresence>
        {isModalOpen && hasOptions && (
          <ProductOptionsModal
            product={product}
            onClose={() => setIsModalOpen(false)}
            hidePriceIfZero={hidePriceIfZero}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ProductOptionsModal({ product, onClose, hidePriceIfZero }: { product: Product, onClose: () => void, hidePriceIfZero?: boolean }) {
  const { addProduct, getVariantQuantity, removeVariant, updateVariantQuantity } = useCart();

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;

  // State for selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? null : null // Will be set when user selects
  );
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const shop = useShop();
  const { hasInventory } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  // Calculate total price
  const basePrice = selectedVariant?.price || product.promoPrice || product.price;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  const totalPrice = (basePrice + extrasTotal) * quantity;

  // Handle add to cart
  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) return; // Must select variant

    if (product.extrasRequired && selectedExtras.length === 0) return; // Must select extras

    addProduct(product, quantity, selectedVariant || undefined, selectedExtras.length > 0 ? selectedExtras : undefined);
    onClose();
  };

  // Check if can add
  const canAdd = (!hasVariants || selectedVariant) && (!product.extrasRequired || selectedExtras.length > 0);

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
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header with Image */}
        <div className="relative h-32 bg-zinc-800">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
            <p className="text-sm text-zinc-400">{product.description}</p>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Variants Section */}
          {hasVariants && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">
                Tamaño / Tipo <span className="text-red-400">*</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {product.variants!.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const stock = variant.stock || 0;
                  const isOutOfStock = hasInventory && stock === 0 && !product.infiniteStock;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                      disabled={isOutOfStock}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : isOutOfStock
                            ? "border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white text-sm">{variant.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      {variant.description && (
                        <p className="text-xs text-zinc-400 mt-0.5">{variant.description}</p>
                      )}
                      {variant.price > 0 && (
                        <p className="text-sm font-semibold text-emerald-400 mt-1">
                          ${variant.price.toLocaleString()}
                        </p>
                      )}
                      {isOutOfStock && <span className="text-xs text-red-400">Agotado</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras Section */}
          {hasExtras && (
            <ExtrasSelector
              extras={product.extras!}
              selectedExtras={selectedExtras}
              onExtrasChange={setSelectedExtras}
              maxExtras={product.maxExtras}
              required={product.extrasRequired}
            />
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="text-sm text-zinc-400">Cantidad:</span>
            <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-white font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Total and Add Button */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400">Total:</span>
            <span className="text-2xl font-bold text-white">
              {hidePriceIfZero && totalPrice === 0 ? "Seleccionable" : `$${totalPrice.toLocaleString()}`}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
              canAdd
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            Agregar al Carrito
          </button>
          {!canAdd && hasVariants && !selectedVariant && (
            <p className="text-xs text-amber-400 text-center mt-2">Selecciona un tamaño/tipo</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

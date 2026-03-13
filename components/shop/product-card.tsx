"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingBag, Tag, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, useShop, useVisualFeedback } from "@/components/shared";
import { useBusinessFeatures, useCombinedBusinessFeatures } from "@/lib/hooks/use-business-features";
import type { Product, ProductVariant } from "@/lib/constants";
import type { SelectedExtra } from "@/lib/types/product-extra.types";
import { ExtrasSelector } from "@/components/shop/extras-selector";
import { motion, AnimatePresence } from "framer-motion";
import { InteractiveCartButton } from "./interactive-cart-button";
import { gsap } from "gsap";

interface ProductCardProps {
  product: Product;
  hidePriceIfZero?: boolean;
  onClickIntercept?: () => void;
}

export function ProductCard({ product, hidePriceIfZero, onClickIntercept }: ProductCardProps) {
  const { addProduct, removeItem, getProductQuantity, updateProductQuantity, getVariantQuantity, updateVariantQuantity, removeVariant } = useCart();
  const { triggerFlyToCart, triggerTrashItem } = useVisualFeedback();
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Check if this product has INTENTIONAL stock management:
  // - Stock must be defined AND greater than 0 (stock: 0 by default doesn't count as intentional)
  // - OR stock was explicitly set to 0 after having stock (we can't detect this, so we rely on hasInventory)
  // This prevents restaurants from accidentally showing "Agotado" when stock defaults to 0
  const productHasIntentionalStock = typeof product.stock === "number" && product.stock > 0 && !product.infiniteStock;

  // Use inventory validation if: business type requires it OR product has intentional stock > 0
  const shouldValidateStock = hasInventory || productHasIntentionalStock;

  // Product is only out of stock if:
  // 1. Stock validation is active (business requires inventory OR product has explicit stock)
  // 2. AND main stock is 0
  // 3. AND (no variants OR no variant has stock)
  // 4. AND not a menu item (hidePriceIfZero)
  // 5. AND not marked as infinite stock
  const isOutOfStock = shouldValidateStock &&
    stockNumber === 0 &&
    (!hasVariants || !hasAnyVariantStock) &&
    !hidePriceIfZero &&
    !product.infiniteStock;

  const effectiveStock = shouldValidateStock ? stockNumber : 999999;

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
      // Trigger fly-to-cart animation
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 3;
        triggerFlyToCart(startX, startY, product.image);
      }
      addProduct(product, 1);
    }
  };

  const handleSimpleRemove = (e?: React.MouseEvent) => {
    // Trigger trash animation
    if (e && simpleQuantity === 1) {
      triggerTrashItem(e.clientX, e.clientY);
    }
    if (simpleQuantity > 1) {
      updateProductQuantity(product.id, simpleQuantity - 1);
    } else {
      removeItem(product.id);
    }
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.3 }}
        className="group relative"
      >
        {/* Image Container with 3D Tilt */}
        <motion.div
          whileHover={{
            rotateY: -5,
            rotateX: 5,
            scale: 1.02,
            transition: { duration: 0.4, ease: "easeOut" }
          }}
          style={{ perspective: 1000 }}
          // Note: consumers should use <motion.div> with prefers-reduced-motion media query if needed
          className="relative aspect-square overflow-hidden rounded-2xl bg-surface"
        >
          <motion.div
            variants={{
              initial: { scale: 1 },
              hover: { scale: 1.1 }
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={cn(
                "object-cover",
                isOutOfStock && "opacity-50"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </motion.div>

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
                  aria-label={`Ver opciones de ${product.name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-full bg-white/90 hover:bg-white text-black text-xs font-bold uppercase tracking-wide shadow-lg transition-colors active:scale-95"
                >
                  {hasExtras ? "Personalizar" : "Opciones"}
                </button>
              ) : (
                /* Simple Add Toggle */
                simpleInCart && !(hidePriceIfZero && basePrice === 0) ? (
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-full shadow-lg p-0.5 sm:p-1">
                    <button
                      aria-label={`Reducir cantidad de ${product.name}`}
                      onClick={(e) => handleSimpleRemove(e)}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-slate-900" aria-hidden="true" />
                    </button>
                    <span aria-label={`Cantidad: ${simpleQuantity}`} className="w-5 sm:w-8 text-center font-semibold text-slate-900 text-xs sm:text-base">
                      {simpleQuantity}
                    </span>
                    <button
                      aria-label={`Aumentar cantidad de ${product.name}`}
                      onClick={() => handleSimpleAdd()}
                      disabled={simpleQuantity >= effectiveStock}
                      className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors",
                        simpleQuantity >= effectiveStock
                          ? "bg-slate-300 text-slate-600"
                          : "bg-primary hover:bg-primary/90 text-white"
                      )}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <InteractiveCartButton
                    onClick={(e) => handleSimpleAdd(e)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                    iconClassName="text-slate-900"
                  />
                )
              )}
            </div>
          )}
        </motion.div>

        {/* Product Info Section */}
        <div className="mt-3 px-1">
          <h3 className="font-display text-lg font-semibold text-white truncate">
            {product.name}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-1">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className={cn(
              "font-bold",
              hasPromo ? "text-gold" : "text-white"
            )}>
              {hidePriceIfZero && basePrice === 0 ? "Seleccionable" : `$${basePrice.toLocaleString()}`}
            </span>
            {hasPromo && !hasVariants && (
              <span className="text-xs text-slate-500 line-through">
                ${product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

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

export function ProductOptionsModal({ product, onClose, hidePriceIfZero }: { product: Product, onClose: () => void, hidePriceIfZero?: boolean }) {
  const { addProduct, getVariantQuantity, removeVariant, updateVariantQuantity } = useCart();
  const { triggerFlyToCart } = useVisualFeedback();
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open (iOS Safari fix)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      const savedY = Math.abs(parseInt(document.body.style.top || "0", 10));
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, savedY);
    };
  }, []);

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;

  // State for selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? null : null // Will be set when user selects
  );
  const [displayImage, setDisplayImage] = useState(product.image);
  const imageRef = useRef<HTMLDivElement>(null);

  // Handle variant selection with animation
  const handleVariantSelect = (variant: ProductVariant) => {
    if (selectedVariant?.id === variant.id) return;

    if (variant.image && variant.image !== displayImage) {
      // Premium GSAP Transition
      const tl = gsap.timeline();

      // Rotate out, swap image, rotate in
      tl.to(imageRef.current, {
        rotateY: 90,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setDisplayImage(variant.image!);
          setSelectedVariant(variant);
        }
      }).to(imageRef.current, {
        rotateY: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    } else {
      setSelectedVariant(variant);
    }
  };

  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [quantity, setQuantity] = useState(1);
  const shop = useShop();
  const isTechDrop = shop?.templateType === "tech-drop-v1";
  const { hasInventory } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  // Check if product has intentional stock management (stock > 0 means it was set intentionally)
  const productHasIntentionalStock = typeof product.stock === "number" && product.stock > 0 && !product.infiniteStock;
  const shouldValidateStock = hasInventory || productHasIntentionalStock;

  // Calculate total price
  const basePrice = selectedVariant?.price || product.promoPrice || product.price;
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  const totalPrice = (basePrice + extrasTotal) * quantity;

  // Handle add to cart
  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) return; // Must select variant

    if (product.extrasRequired && selectedExtras.length === 0) return; // Must select extras

    // Trigger fly-to-cart animation from modal center
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 3;
      triggerFlyToCart(startX, startY, displayImage);
    }

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
        ref={modalRef}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className={cn(
          "relative w-full max-w-md overflow-hidden shadow-2xl",
          isTechDrop
            ? "bg-[#05070a] border border-cyan-500/30 rounded-[32px] font-sans"
            : "bg-zinc-900 border border-zinc-800 rounded-2xl"
        )}
      >
        {/* Header with Image */}
        <div className="relative h-48 bg-zinc-800 perspective-1000">
          <div ref={imageRef} className="relative w-full h-full transform-style-3d">
            {displayImage && (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                className="object-contain p-4"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <button
            aria-label="Cerrar opciones"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{product.name}</h3>
            <p className="text-sm text-zinc-400">{product.description}</p>
          </div>
        </div>

        <div data-lenis-prevent className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Variants Section */}
          {hasVariants && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Seleccionar Color / Modelo <span className="text-red-400">*</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {product.variants!.map(variant => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const stock = Number(variant.stock) || 0;
                  // Variant has explicit stock if stock field exists
                  const variantHasExplicitStock = variant.stock !== undefined && variant.stock !== null;
                  const shouldValidateVariantStock = shouldValidateStock || variantHasExplicitStock;
                  const isOutOfStock = shouldValidateVariantStock && stock === 0 && !product.infiniteStock;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => !isOutOfStock && handleVariantSelect(variant)}
                      disabled={isOutOfStock}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative overflow-hidden group/opt",
                        isSelected
                          ? isTechDrop ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "border-primary bg-primary/10"
                          : isOutOfStock
                            ? "border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {variant.color && (
                            <div
                              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: variant.color }}
                            />
                          )}
                          <span className="font-bold text-white text-xs uppercase tracking-tight">{variant.name}</span>
                        </div>
                        {isSelected && <Check className={cn("w-3 h-3", isTechDrop ? "text-cyan-400" : "text-primary")} />}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {variant.price > 0 ? (
                          <p className={cn("text-xs font-black", isTechDrop ? "text-cyan-400" : "text-emerald-400")}>
                            ${variant.price.toLocaleString()}
                          </p>
                        ) : <div />}
                        {isOutOfStock ? (
                          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Agotado</span>
                        ) : variant.stock !== undefined && (
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stock: {variant.stock}</span>
                        )}
                      </div>

                      {/* Hover Glow for Tech Theme */}
                      {isTechDrop && !isOutOfStock && (
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none" />
                      )}
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
          {(() => {
            // Calculate max quantity based on selected variant or main product stock
            const stockValue = selectedVariant
              ? Number(selectedVariant.stock) || 0
              : Number(product.stock) || 0;
            const maxQuantity = shouldValidateStock && !product.infiniteStock ? stockValue : 999;
            const canIncrement = quantity < maxQuantity;

            return (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cantidad</span>
                <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-1">
                  <button
                    aria-label="Reducir cantidad"
                    onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span aria-label={`Cantidad: ${quantity}`} className="w-8 text-center text-white font-bold">{quantity}</span>
                  <button
                    aria-label="Aumentar cantidad"
                    onClick={() => canIncrement && setQuantity(q => q + 1)}
                    disabled={!canIncrement}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded transition-colors",
                      canIncrement
                        ? "bg-zinc-700 text-white hover:bg-zinc-600"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer with Total and Add Button */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Inversión Final:</span>
            <span className={cn("text-2xl font-black", isTechDrop ? "text-cyan-400" : "text-white")}>
              {hidePriceIfZero && totalPrice === 0 ? "Seleccionable" : `$${totalPrice.toLocaleString()}`}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAdd}
            className={cn(
              "w-full py-4 rounded-xl font-black uppercase text-sm tracking-widest transition-all shadow-xl flex items-center justify-center gap-2",
              canAdd
                ? isTechDrop ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            Configurar & Comprar
          </button>
          {!canAdd && hasVariants && !selectedVariant && (
            <p className="text-xs text-amber-400 text-center mt-2">Selecciona un tamaño/tipo</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageCircle, X, ShoppingBag, Calendar, Loader2, ChevronUp, ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useShop, useOrders, useShopConfig } from "@/components/shared";
import { AppointmentModal } from "./appointment-modal";
import { getCombinedFeatures } from "@/lib/hooks/use-business-features";
import { CheckoutDrawer } from "./checkout-drawer";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Business types that need detailed checkout (with notes, scheduling, etc.)
const DETAILED_CHECKOUT_TYPES = [
  "meal_prep",
  "catering",
  "cloud_kitchen",
  "chef_privado",
  "loncheras",
  "retail",
  "technology",
  "boutique",
  "restaurant"
];

export function FloatingCart() {
  const {
    services,
    products,
    totalItems,
    totalPrice,
    totalDuration,
    tableId,
    clearCart,
    updateProductQuantity,
    removeItem
  } = useCart();
  const shop = useShop();
  const { config } = useShopConfig();
  const { addOrder } = useOrders(); // Legacy local storage

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  // Phase 22: Appointment modal state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  // Checkout drawer state (for meal prep, catering, etc.)
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);

  const hasServices = services.length > 0;
  const hasProducts = products.length > 0;

  // Phase 22: Determine if we should use appointment flow
  const isBeautyBusiness = config.businessType === "beauty";
  const shouldUseAppointmentFlow = isBeautyBusiness && hasServices && !hasProducts;

  // Determine if we should use detailed checkout (for meal prep, etc.)
  const shouldUseDetailedCheckout = DETAILED_CHECKOUT_TYPES.includes(config.businessType || "") && hasProducts;

  // Phase 15: Thematic UI
  const isStreetDrop = shop?.templateType === "street-drop-v1" || shop?.slug === "gingxerstudio";

  const handleClick = () => {
    if (shouldUseAppointmentFlow) {
      // Open appointment modal for beauty businesses with only services
      setIsAppointmentModalOpen(true);
    } else {
      // Open checkout drawer for ALL businesses with products
      // This ensures orders are saved internally and notified via server
      setIsCheckoutDrawerOpen(true);
    }
  };

  // WhatsApp logic removed - handled by CheckoutDrawer and Backend API

  // Don't render if cart is empty
  if (totalItems === 0) return null;

  // Generate summary text
  const getSummaryText = () => {
    const parts = [];
    if (hasServices) {
      parts.push(`${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}`);
    }
    if (hasProducts) {
      const productCount = products.reduce((sum, p) => sum + p.quantity, 0);
      parts.push(`${productCount} ${productCount === 1 ? 'producto' : 'productos'}`);
    }
    return parts.join(' + ');
  };

  // Get button text based on business type and selection
  const getButtonText = () => {
    if (isStreetDrop) return 'SECURE THE DROP';

    if (shouldUseAppointmentFlow) {
      return 'Agendar Cita';
    }

    // Dynamic text based on business type
    if (config.businessType === "rentcar") return 'Reservar';
    if (config.businessType === "restaurant") return 'Ordenar';
    if (config.businessType === "technology" || config.businessType === "retail") return 'Comprar';

    if (hasProducts && !hasServices) {
      return 'Pedir';
    }
    return 'Enviar';
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-2 right-2 z-40",
          "sm:left-4 sm:right-4",
          "md:left-auto md:right-6 md:max-w-md",
          "animate-in slide-in-from-bottom-4 duration-300",
          // Limit max height when expanded to prevent blocking content
          isCartExpanded && "max-h-[70vh] overflow-hidden",
          isStreetDrop
            ? "glass-panel bg-black/95 border-2 border-red-500 rounded-none drop-shadow-[5px_5px_0px_rgba(255,0,51,1)] p-3 sm:p-4"
            : "glass-panel rounded-2xl p-3 sm:p-4"
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Item count */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              shouldUseAppointmentFlow ? "bg-primary/20" : "bg-gold/20"
            )}>
              {shouldUseAppointmentFlow ? (
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm sm:text-base truncate max-w-[120px] xs:max-w-none">
                {getSummaryText()}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 hidden xs:block">
                {shouldUseAppointmentFlow
                  ? 'seleccionados'
                  : hasProducts
                    ? 'en tu carrito'
                    : 'seleccionados'}
              </p>
            </div>
          </div>

          {/* Right: Total and CTA */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-slate-400">Total</p>
              <p className="text-sm sm:text-lg font-bold text-white">
                ${totalPrice.toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleClick}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl",
                "text-white font-medium text-sm",
                "transition-all duration-300",
                "shadow-lg hover:shadow-xl",
                shouldUseAppointmentFlow
                  ? "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
                  : isStreetDrop
                    ? "bg-red-600 hover:bg-black border border-red-600 hover:text-red-500 !rounded-none"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : shouldUseAppointmentFlow ? (
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : isStreetDrop ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>
              ) : (
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className={cn("hidden sm:inline", isStreetDrop && "uppercase tracking-widest font-black")}>
                {getButtonText()}
              </span>
            </button>

            {/* Clear cart button */}
            <button
              onClick={clearCart}
              disabled={isSubmitting}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Limpiar carrito"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Toggle button to expand/collapse cart preview */}
        <button
          onClick={() => setIsCartExpanded(!isCartExpanded)}
          className={cn(
            "w-full mt-3 pt-3 border-t flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white transition-colors",
            isStreetDrop ? "border-red-500/30" : "border-white/10"
          )}
        >
          {isCartExpanded ? (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Ocultar carrito</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Ver carrito ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
            </>
          )}
        </button>

        {/* Expanded Cart Preview */}
        <AnimatePresence>
          {isCartExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className={cn(
                "mt-4 pt-4 border-t max-h-[35vh] overflow-y-auto space-y-3 overscroll-contain",
                isStreetDrop ? "border-red-500/30" : "border-white/10"
              )}>
                {/* Products with images and controls */}
                {products.map((product, idx) => {
                  const extrasKey = product.selectedExtras?.map(e => e.extraId).join("-") || "";
                  const uniqueKey = `${product.id}-${product.variantId || ""}-${extrasKey}-${idx}`;
                  const itemPrice = (product.promoPrice || product.price) + (product.extrasTotal || 0);

                  return (
                    <div
                      key={uniqueKey}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg",
                        isStreetDrop ? "bg-black/50 border border-red-500/20" : "bg-white/5"
                      )}
                    >
                      {/* Product Image */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/50 flex-shrink-0 relative">
                        <Image
                          src={product.image || "/placeholder.png"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium text-white truncate",
                          isStreetDrop && "uppercase tracking-wider text-xs"
                        )}>
                          {product.name}
                        </p>
                        {product.variantName && (
                          <p className={cn(
                            "text-xs",
                            isStreetDrop ? "text-red-400" : "text-primary"
                          )}>
                            {product.variantName}
                          </p>
                        )}
                        {product.selectedExtras && product.selectedExtras.length > 0 && (
                          <p className="text-xs text-slate-400">
                            +{product.selectedExtras.map(e => e.name).join(", ")}
                          </p>
                        )}
                        <p className={cn(
                          "text-sm font-bold mt-1",
                          isStreetDrop ? "text-red-400" : "text-gold"
                        )}>
                          ${(itemPrice * product.quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (product.quantity > 1) {
                              updateProductQuantity(product.id, product.quantity - 1, product.variantId);
                            } else {
                              removeItem(product.id, product.variantId);
                            }
                          }}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                            isStreetDrop
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/40"
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {product.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className={cn(
                          "w-8 text-center text-sm font-medium",
                          isStreetDrop ? "text-white font-black" : "text-white"
                        )}>
                          {product.quantity}
                        </span>
                        <button
                          onClick={() => updateProductQuantity(product.id, product.quantity + 1, product.variantId)}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                            isStreetDrop
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/40"
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Services (for beauty businesses) */}
                {hasServices && services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg",
                      isStreetDrop ? "bg-black/50 border border-red-500/20" : "bg-white/5"
                    )}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{service.name}</p>
                      <p className="text-xs text-slate-400">{service.duration} min</p>
                      <p className="text-sm font-bold text-primary mt-1">${service.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeItem(service.id)}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Duration indicator for beauty services */}
                {shouldUseAppointmentFlow && totalDuration > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-white/10">
                    <span>⏱️ Duración estimada:</span>
                    <span className="text-white font-medium">
                      {Math.floor(totalDuration / 60) > 0 && `${Math.floor(totalDuration / 60)}h `}
                      {totalDuration % 60 > 0 && `${totalDuration % 60}min`}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase 22: Appointment Modal for Beauty businesses */}
      {shop && shop.contact?.phone && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          shopName={shop.name}
          shopPhone={shop.contact.phone}
          shopId={shop.id}
          isBeautyBusiness={getCombinedFeatures(shop.businessTypes || [shop.businessType || "beauty"]).adminModules.beautyConsultations}
        />
      )}

      {/* Checkout Drawer for Meal Prep / Catering businesses */}
      <CheckoutDrawer
        isOpen={isCheckoutDrawerOpen}
        onClose={() => setIsCheckoutDrawerOpen(false)}
      />
    </>
  );
}

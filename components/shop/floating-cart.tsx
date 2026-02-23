"use client";

import { useState } from "react";
import { MessageCircle, X, ShoppingBag, Calendar, Loader2 } from "lucide-react";
import { useCart, useShop, useOrders, useShopConfig } from "@/components/shared";
import { AppointmentModal } from "./appointment-modal";
import { CheckoutDrawer } from "./checkout-drawer";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Business types that need detailed checkout (with notes, scheduling, etc.)
const DETAILED_CHECKOUT_TYPES = [
  "meal_prep",
  "catering",
  "cloud_kitchen",
  "chef_privado",
  "loncheras",
];

export function FloatingCart() {
  const {
    services,
    products,
    totalItems,
    totalPrice,
    totalDuration,
    tableId,
    clearCart
  } = useCart();
  const shop = useShop();
  const { config } = useShopConfig();
  const { addOrder } = useOrders(); // Legacy local storage

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleClick = () => {
    if (shouldUseAppointmentFlow) {
      // Open appointment modal for beauty businesses with only services
      setIsAppointmentModalOpen(true);
    } else if (shouldUseDetailedCheckout) {
      // Open checkout drawer for meal prep businesses
      setIsCheckoutDrawerOpen(true);
    } else {
      // Direct WhatsApp for retail or mixed orders
      handleWhatsAppClick();
    }
  };

  const handleWhatsAppClick = async () => {
    if (!shop?.contact.phone || !shop?.slug) return;

    setIsSubmitting(true);

    try {
      // 1. Create Order in Firestore (Real Data for Admin)
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`, // Temporary ID
        customerName: "Cliente WhatsApp", // Default
        customerPhone: "", // Phone is not known until they send msg
        items: [
          ...services.map((s) => ({
            productId: s.id,
            productName: s.name,
            quantity: 1,
            unitPrice: s.price,
            total: s.price
          })),
          ...products.map((p) => {
            const basePrice = p.promoPrice || p.price;
            const extrasTotal = p.extrasTotal || 0;
            const itemTotal = (basePrice + extrasTotal) * p.quantity;

            // Build product name with variant and extras
            let productName = p.name;
            if (p.variantName) productName += ` (${p.variantName})`;
            if (p.selectedExtras && p.selectedExtras.length > 0) {
              const extrasStr = p.selectedExtras.map(e => e.quantity > 1 ? `${e.name} x${e.quantity}` : e.name).join(", ");
              productName += ` + ${extrasStr}`;
            }

            return {
              productId: p.id,
              productName,
              quantity: p.quantity,
              unitPrice: basePrice + extrasTotal, // Include extras in unit price
              total: itemTotal,
              extras: p.selectedExtras || [] // Store extras detail
            };
          }),
        ],
        subtotal: totalPrice,
        tax: 0,
        total: totalPrice,
        status: "draft", // Start as draft/initiating
        paymentStatus: "pending",
        isWholesale: false,
        source: "whatsapp",
        tableId: tableId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Write to Firestore: shops/{slug}/orders
      // Note: Admin listens to this collection
      const docRef = await addDoc(collection(db, "shops", shop.slug, "orders"), orderData);

      console.log("✅ Order created as draft:", docRef.id);

      // Notification is now handled by the Webhook upon receiving the message
      // preventing "ghost orders" notifications.

      // 2. Legacy Local Storage (for history)
      addOrder({
        shopId: shop.slug,
        shopName: shop.name,
        items: [
          ...services.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            type: "service" as const,
          })),
          ...products.map((p) => ({
            id: p.id,
            name: p.name + (p.variantName ? ` (${p.variantName})` : ""),
            price: (p.promoPrice || p.price) * p.quantity,
            quantity: p.quantity,
            type: "product" as const,
          })),
        ],
        total: totalPrice,
        tableId: tableId || undefined,
        orderType: tableId ? "dine-in" : "takeout",
      });

      // 3. Build WhatsApp Message
      let message = `Hola, quiero hacer un pedido en *${shop.name}*:\n`;
      message += `🆔 Pedido: ${docRef.id}\n\n`; // Use full DOC ID for easier parsing

      // Add Table Info if exists
      if (tableId) {
        message += `📍 *Mesa ${tableId}*\n\n`; // High visibility
      }

      // Services section (for mixed orders)
      if (hasServices) {
        message += `💇‍♀️ *Servicios:*\n`;
        services.forEach((service) => {
          message += `- ${service.name}: $${service.price.toLocaleString()}\n`;
        });
        if (totalDuration > 0) {
          const hours = Math.floor(totalDuration / 60);
          const mins = totalDuration % 60;
          const durationStr = hours > 0
            ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`
            : `${mins}min`;
          message += `⏱️ Duración estimada: ${durationStr}\n`;
        }
        message += `\n`;
      }

      // Products section
      if (hasProducts) {
        message += `🛍️ *Productos:*\n`;
        products.forEach((product) => {
          const basePrice = product.promoPrice || product.price;
          const extrasTotal = product.extrasTotal || 0;
          const subtotal = (basePrice + extrasTotal) * product.quantity;
          const variantLabel = product.variantName ? ` [${product.variantName}]` : "";

          if (product.quantity > 1) {
            message += `- ${product.name}${variantLabel} (x${product.quantity}): $${subtotal.toLocaleString()}\n`;
          } else {
            message += `- ${product.name}${variantLabel}: $${subtotal.toLocaleString()}\n`;
          }

          // Add extras detail
          if (product.selectedExtras && product.selectedExtras.length > 0) {
            product.selectedExtras.forEach((extra) => {
              const extraLabel = extra.quantity > 1 ? `${extra.name} x${extra.quantity}` : extra.name;
              message += `  ↳ + ${extraLabel} ($${(extra.price * extra.quantity).toLocaleString()})\n`;
            });
          }
        });
        message += `\n`;
      }

      message += `💰 *Total: $${totalPrice.toLocaleString()}*`;

      // 4. Send Message to Business Phone (Customer -> Business)
      // We prioritize the public contact phone for the initial interaction
      const targetPhone = shop.contact.phone;
      if (targetPhone) {
        const cleanPhone = formatPhoneForWhatsApp(targetPhone);
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        // Use location.href for better mobile Safari compatibility
        window.location.href = url;
      } else {
        alert("No hay número de teléfono configurado para recibir pedidos.");
      }

      // 5. Clear cart
      clearCart();

    } catch (error) {
      console.error("❌ Error creating order:", error);
      alert("Hubo un error al procesar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          "fixed bottom-4 left-2 right-2 z-50",
          "sm:left-4 sm:right-4",
          "md:left-auto md:right-6 md:max-w-md",
          "glass-panel rounded-2xl p-3 sm:p-4",
          "animate-in slide-in-from-bottom-4 duration-300"
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
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : shouldUseAppointmentFlow ? (
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span className="hidden sm:inline">
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

        {/* Expanded view with items (optional, shows on larger screens) */}
        <div className="hidden md:block mt-4 pt-4 border-t border-white/10">
          {/* Services */}
          {hasServices && (
            <div className="mb-2">
              <p className="text-xs text-slate-500 mb-1">
                {shouldUseAppointmentFlow ? '💇‍♀️ Servicios' : '📅 Citas'}
              </p>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <span
                    key={service.id}
                    className="px-3 py-1 rounded-full bg-primary/20 text-sm text-slate-300"
                  >
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {hasProducts && (
            <div className={hasServices ? "mt-3" : ""}>
              <p className="text-xs text-slate-500 mb-1">🛍️ Productos</p>
              <div className="flex flex-wrap gap-2">
                {products.map((product, idx) => {
                  const extrasKey = product.selectedExtras?.map(e => e.extraId).join("-") || "";
                  const uniqueKey = `${product.id}-${product.variantId || ""}-${extrasKey}-${idx}`;

                  return (
                    <span
                      key={uniqueKey}
                      className="px-3 py-1 rounded-full bg-gold/20 text-sm text-slate-300"
                    >
                      {product.name}
                      {product.variantName && <span className="text-gold opacity-80"> ({product.variantName})</span>}
                      {product.selectedExtras && product.selectedExtras.length > 0 && (
                        <span className="text-primary opacity-80"> +{product.selectedExtras.length} extras</span>
                      )}
                      {product.quantity > 1 && ` (x${product.quantity})`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration indicator for beauty services */}
          {shouldUseAppointmentFlow && totalDuration > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>⏱️ Duración estimada:</span>
              <span className="text-white font-medium">
                {Math.floor(totalDuration / 60) > 0 && `${Math.floor(totalDuration / 60)}h `}
                {totalDuration % 60 > 0 && `${totalDuration % 60}min`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Phase 22: Appointment Modal for Beauty businesses */}
      {shop && shop.contact.phone && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          shopName={shop.name}
          shopPhone={shop.contact.phone}
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

"use client";

import { useState } from "react";
import { MessageCircle, X, ShoppingBag, Calendar } from "lucide-react";
import { useCart, useShop, useOrders, useShopConfig } from "@/components/shared";
import { AppointmentModal } from "./appointment-modal";
import { cn } from "@/lib/utils";

export function FloatingCart() {
  const {
    services,
    products,
    totalItems,
    totalPrice,
    totalDuration,
    clearCart
  } = useCart();
  const shop = useShop();
  const { config } = useShopConfig();
  const { addOrder } = useOrders();

  // Phase 22: Appointment modal state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const hasServices = services.length > 0;
  const hasProducts = products.length > 0;

  // Phase 22: Determine if we should use appointment flow
  const isBeautyBusiness = config.businessType === "beauty";
  const shouldUseAppointmentFlow = isBeautyBusiness && hasServices && !hasProducts;

  const handleClick = () => {
    if (shouldUseAppointmentFlow) {
      // Open appointment modal for beauty businesses with only services
      setIsAppointmentModalOpen(true);
    } else {
      // Direct WhatsApp for retail or mixed orders
      handleWhatsAppClick();
    }
  };

  const handleWhatsAppClick = () => {
    if (!shop?.contact.phone) return;

    // Save the order to localStorage
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
    });

    // Build the WhatsApp message with separate sections
    let message = `Hola, quiero hacer un pedido en *${shop.name}*:\n\n`;

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
        const price = product.promoPrice || product.price;
        const subtotal = price * product.quantity;
        const variantLabel = product.variantName ? ` [${product.variantName}]` : "";

        if (product.quantity > 1) {
          message += `- ${product.name}${variantLabel} (x${product.quantity}): $${subtotal.toLocaleString()}\n`;
        } else {
          message += `- ${product.name}${variantLabel}: $${subtotal.toLocaleString()}\n`;
        }
      });
      message += `\n`;
    }

    message += `💰 *Total: $${totalPrice.toLocaleString()}*`;

    // Clean phone number
    const cleanPhone = shop.contact.phone.replace(/\D/g, "");

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    // Clear cart after order
    clearCart();
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
    if (hasProducts && !hasServices) {
      return 'Pedir';
    }
    return 'Enviar';
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50",
          "md:left-auto md:right-6 md:max-w-md",
          "glass-panel rounded-2xl p-4",
          "animate-in slide-in-from-bottom-4 duration-300"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Item count */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              shouldUseAppointmentFlow ? "bg-primary/20" : "bg-gold/20"
            )}>
              {shouldUseAppointmentFlow ? (
                <Calendar className="w-5 h-5 text-primary" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-gold" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {getSummaryText()}
              </p>
              <p className="text-sm text-slate-400">
                {shouldUseAppointmentFlow
                  ? 'seleccionados'
                  : hasProducts
                    ? 'en tu carrito'
                    : 'seleccionados'}
              </p>
            </div>
          </div>

          {/* Right: Total and CTA */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-lg font-bold text-white">
                ${totalPrice.toLocaleString()}
              </p>
            </div>

            <button
              onClick={handleClick}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl",
                "text-white font-medium",
                "transition-all duration-300",
                "shadow-lg hover:shadow-xl",
                shouldUseAppointmentFlow
                  ? "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              )}
            >
              {shouldUseAppointmentFlow ? (
                <Calendar className="w-5 h-5" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">
                {getButtonText()}
              </span>
            </button>

            {/* Clear cart button */}
            <button
              onClick={clearCart}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Limpiar carrito"
            >
              <X className="w-5 h-5" />
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
                {products.map((product) => (
                  <span
                    key={product.variantId ? `${product.id}-${product.variantId}` : product.id}
                    className="px-3 py-1 rounded-full bg-gold/20 text-sm text-slate-300"
                  >
                    {product.name}
                    {product.variantName && <span className="text-gold opacity-80"> ({product.variantName})</span>}
                    {product.quantity > 1 && ` (x${product.quantity})`}
                  </span>
                ))}
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
    </>
  );
}

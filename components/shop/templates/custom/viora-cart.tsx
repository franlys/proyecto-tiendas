"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/shared";
import { CheckoutDrawer } from "@/components/shop/checkout-drawer";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO")}`;
}

interface VioraCartProps {
  onClose: () => void;
}

export function VioraCart({ onClose }: VioraCartProps) {
  const { products, totalItems, totalPrice, updateProductQuantity, removeItem } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  return (
    <>
      <style>{`
        @keyframes vioraCartSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes vioraCartFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .viora-cart-backdrop { animation: vioraCartFade 200ms ease both; }
        .viora-cart-panel    { animation: vioraCartSlide 360ms cubic-bezier(0.32, 0.72, 0, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .viora-cart-backdrop, .viora-cart-panel { animation: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="viora-cart-backdrop fixed inset-0 z-[80] bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="viora-cart-panel fixed top-0 right-0 bottom-0 z-[90] w-full max-w-[400px] bg-white flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-black/50" strokeWidth={1.5} />
            <p className="text-[10px] uppercase tracking-[0.22em] font-medium text-black">
              Bolsa — {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-black/30 hover:text-black transition-colors duration-150">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <ShoppingBag className="w-10 h-10 text-black/10" strokeWidth={1} />
              <p className="text-sm text-black/30 tracking-wide">Tu bolsa está vacía</p>
              <button
                onClick={onClose}
                className="text-[10px] uppercase tracking-[0.18em] border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="divide-y divide-black/6">
              {products.map((item) => (
                <div key={`${item.id}-${item.variantId ?? "base"}`} className="flex gap-4 px-6 py-5">
                  {/* Thumbnail */}
                  <div className="relative shrink-0 overflow-hidden bg-[#f4f4f4]" style={{ width: 72, height: 96 }}>
                    <img
                      src={item.image || "https://placehold.co/144x192/f4f4f4/999?text=V"}
                      alt={item.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-black leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      {item.variantName && (
                        <p className="text-[9px] text-black/40 mt-1 tracking-wide">Talla: {item.variantName}</p>
                      )}
                      <div className="mt-1.5">
                        <span className="text-xs font-medium text-black">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 border border-black/12 px-3 py-1.5">
                        <button
                          onClick={() => updateProductQuantity(item.id, item.quantity - 1, item.variantId)}
                          className="text-black/40 hover:text-black transition-colors duration-100"
                          aria-label="Reducir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateProductQuantity(item.id, item.quantity + 1, item.variantId)}
                          className="text-black/40 hover:text-black transition-colors duration-100"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.variantId)}
                        className="text-black/20 hover:text-red-400 transition-colors duration-150 p-1"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — total + checkout */}
        {products.length > 0 && (
          <div className="border-t border-black/8 px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-black/50">Total</p>
              <p className="text-lg font-medium text-black">{fmt(totalPrice)}</p>
            </div>
            <p className="text-[9px] text-black/30 tracking-wide -mt-2">Envío calculado al confirmar pedido</p>

            <button
              onClick={handleCheckout}
              className="w-full h-12 bg-black text-white text-[10px] font-medium uppercase tracking-[0.18em] hover:bg-black/80 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Confirmar pedido
            </button>

            <button
              onClick={onClose}
              className="w-full text-center text-[9px] text-black/30 uppercase tracking-[0.16em] hover:text-black transition-colors duration-150 pb-1"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>

      {/* Internal checkout flow */}
      <CheckoutDrawer isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

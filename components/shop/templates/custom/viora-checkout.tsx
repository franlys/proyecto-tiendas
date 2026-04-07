"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Loader2, Check, ArrowLeft } from "lucide-react";
import { useCart, useShop, useInventory } from "@/components/shared";

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO")}`;
}

interface VioraCheckoutProps {
  onClose: () => void;
}

type DeliveryType = "delivery" | "pickup";
type Step = "form" | "success";

export function VioraCheckout({ onClose }: VioraCheckoutProps) {
  const { products, totalPrice, clearCart } = useCart();
  const shop = useShop();
  const { decrementStock } = useInventory();

  const [step, setStep] = useState<Step>("form");
  const [orderNumber, setOrderNumber] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0"; document.body.style.right = "0";
    return () => {
      const y = Math.abs(parseInt(document.body.style.top || "0", 10));
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, y);
    };
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          setAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
        } catch {
          setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => setIsDetectingLocation(false)
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("Nombre y teléfono son requeridos.");
      return;
    }
    if (deliveryType === "delivery" && !address.trim()) {
      setError("Indica tu dirección de entrega.");
      return;
    }
    setIsSubmitting(true);
    try {
      const orderItems = products.map(p => ({
        id: p.id,
        name: p.name + (p.variantName ? ` (${p.variantName})` : ""),
        price: p.price,
        quantity: p.quantity,
        image: p.image || "",
      }));

      const res = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop?.id || shop?.slug || "",
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          customerAddress: deliveryType === "delivery" ? address : undefined,
          items: orderItems,
          total: totalPrice,
          deliveryType: deliveryType === "delivery" ? "entrega" : "recogida",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el pedido");

      products.forEach(p => decrementStock(p.id, p.quantity));
      clearCart();
      setOrderNumber(data.orderNumber || "—");
      setStep("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al procesar el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes vioraCheckoutSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes vioraCheckoutFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vioraCheckoutSuccessIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .viora-co-backdrop { animation: vioraCheckoutFade 220ms ease both; }
        .viora-co-panel {
          animation: vioraCheckoutSlide 380ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        .viora-co-success { animation: vioraCheckoutSuccessIn 500ms cubic-bezier(0.23, 1, 0.32, 1) both; }

        .viora-co-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(0,0,0,0.14);
          padding: 10px 0;
          font-size: 13px;
          font-family: inherit;
          color: #000;
          outline: none;
          transition: border-color 200ms ease;
          letter-spacing: 0.01em;
        }
        .viora-co-input::placeholder { color: rgba(0,0,0,0.25); }
        .viora-co-input:focus { border-bottom-color: #000; }

        .viora-co-label {
          display: block;
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(0,0,0,0.38);
          margin-bottom: 4px;
        }

        .viora-co-delivery-btn {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid rgba(0,0,0,0.14);
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          cursor: pointer;
          transition: all 150ms ease;
          background: transparent;
          color: rgba(0,0,0,0.45);
        }
        .viora-co-delivery-btn.active {
          background: #000;
          color: #fff;
          border-color: #000;
        }

        @media (prefers-reduced-motion: reduce) {
          .viora-co-backdrop, .viora-co-panel { animation: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="viora-co-backdrop fixed inset-0 z-[95] bg-black/35"
        onClick={step === "success" ? onClose : undefined}
      />

      {/* Panel — full-height right drawer, same width as cart */}
      <div className="viora-co-panel fixed top-0 right-0 bottom-0 z-[100] w-full max-w-[480px] bg-white flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-black/6">
          {step === "form" ? (
            <p className="text-[9px] uppercase tracking-[0.22em] font-medium text-black/40">
              Confirmar pedido
            </p>
          ) : (
            <p className="text-[9px] uppercase tracking-[0.22em] font-medium text-black/40">
              Pedido confirmado
            </p>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-black/25 hover:text-black transition-colors duration-150"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SUCCESS STATE ── */}
        {step === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12 viora-co-success">
            {/* Check ring */}
            <div
              className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center mb-8"
              style={{ boxShadow: "0 0 0 8px rgba(0,0,0,0.03)" }}
            >
              <Check className="w-7 h-7 text-black" strokeWidth={1.5} />
            </div>

            <h2 className="viora-serif italic text-[clamp(28px,5vw,40px)] font-light text-black leading-[1.1] text-center mb-2">
              Gracias, {name.split(" ")[0]}.
            </h2>
            <p className="text-[11px] text-black/40 tracking-wide text-center mb-10">
              Tu pedido ha sido registrado exitosamente.
            </p>

            {/* Order number */}
            <div className="w-full border border-black/8 px-6 py-5 mb-8">
              <p className="text-[9px] uppercase tracking-[0.22em] text-black/30 mb-2 text-center">
                Número de seguimiento
              </p>
              <p className="viora-serif italic text-3xl font-light text-black text-center tracking-[0.06em]">
                {orderNumber}
              </p>
            </div>

            <p className="text-[10px] text-black/35 tracking-wide text-center leading-relaxed max-w-xs">
              Guarda este número para consultar el estado de tu pedido.
              {shop?.contact?.whatsapp && (
                <> Recibirás confirmación por WhatsApp.</>
              )}
            </p>

            <button
              onClick={onClose}
              className="mt-10 w-full h-12 bg-black text-white text-[10px] font-medium uppercase tracking-[0.18em] hover:bg-black/80 transition-colors duration-200"
            >
              Volver a la tienda
            </button>
          </div>
        )}

        {/* ── FORM STATE ── */}
        {step === "form" && (
          <>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Order summary strip */}
              <div className="px-6 md:px-8 py-5 border-b border-black/6 space-y-3">
                <p className="text-[9px] uppercase tracking-[0.2em] font-medium text-black/30 mb-4">
                  Tu pedido · {products.length} {products.length === 1 ? "artículo" : "artículos"}
                </p>
                {products.map(item => (
                  <div key={`${item.id}-${item.variantId ?? "base"}`} className="flex items-center gap-3">
                    <div className="w-10 h-[52px] bg-[#f4f4f4] shrink-0 overflow-hidden">
                      <img
                        src={item.image || "https://placehold.co/80x104/f4f4f4/999?text=V"}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-black line-clamp-1">
                        {item.name}
                      </p>
                      {item.variantName && (
                        <p className="text-[9px] text-black/35 mt-0.5">Talla: {item.variantName}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-medium text-black">{fmt(item.price * item.quantity)}</p>
                      <p className="text-[9px] text-black/30">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery type */}
              <div className="px-6 md:px-8 pt-6 pb-4">
                <p className="viora-co-label mb-3">Tipo de entrega</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`viora-co-delivery-btn ${deliveryType === "delivery" ? "active" : ""}`}
                  >
                    Envío a domicilio
                  </button>
                  <button
                    onClick={() => setDeliveryType("pickup")}
                    className={`viora-co-delivery-btn ${deliveryType === "pickup" ? "active" : ""}`}
                  >
                    Recoger en tienda
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="px-6 md:px-8 pt-2 pb-6 space-y-6">
                <div>
                  <label className="viora-co-label">Nombre completo <span className="text-red-400">*</span></label>
                  <input
                    className="viora-co-input"
                    placeholder="ej. María González"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="viora-co-label">WhatsApp / Teléfono <span className="text-red-400">*</span></label>
                  <input
                    className="viora-co-input"
                    placeholder="+1 809 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="viora-co-label">Correo electrónico <span className="text-black/25">(opcional)</span></label>
                  <input
                    className="viora-co-input"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>

                {deliveryType === "delivery" && (
                  <div>
                    <label className="viora-co-label">Dirección de entrega <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input
                        className="viora-co-input pr-8"
                        placeholder="Calle, número, sector..."
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        autoComplete="street-address"
                      />
                      <button
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                        className="absolute right-0 bottom-2.5 text-black/25 hover:text-black transition-colors duration-150 disabled:opacity-40"
                        title="Detectar ubicación"
                        type="button"
                      >
                        {isDetectingLocation
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <MapPin className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-[10px] text-red-400 tracking-wide">{error}</p>
                )}
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="border-t border-black/6 px-6 md:px-8 py-6 space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.18em] text-black/40">Total</p>
                <p className="viora-serif italic text-2xl font-light text-black">{fmt(totalPrice)}</p>
              </div>
              <p className="text-[9px] text-black/25 tracking-wide -mt-2">Envío calculado por el vendedor</p>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-[10px] font-medium uppercase tracking-[0.18em] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#000", color: "#fff" }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando...</>
                ) : (
                  <>Confirmar pedido</>
                )}
              </button>

              <p className="text-center text-[8px] text-black/20 uppercase tracking-[0.14em]">
                Procesando pedido de forma segura
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

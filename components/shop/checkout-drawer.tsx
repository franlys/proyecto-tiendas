"use client";

import { useState, useEffect, useMemo } from "react";
import {
    X,
    ShoppingBag,
    MessageCircle,
    Minus,
    Plus,
    MapPin,
    Clock,
    Calendar,
    Truck,
    Store,
    FileText,
    Loader2,
    ChevronDown,
    ChevronUp,
    Check,
    CreditCard,
} from "lucide-react";
import { useCart, useShop, useOrders, useShopConfig } from "@/components/shared";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui";
import type { ProductCartItem } from "@/components/shared/cart-context";
import { StripePayButton } from "@/components/shop/stripe-checkout-button";
import { PayPalPayButton } from "@/components/shop/paypal-checkout-button";
import type { Currency } from "@/lib/types/payment.types";

interface CheckoutDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
    const {
        products,
        services,
        totalPrice,
        clearCart,
        updateProductQuantity,
        updateItemNotes,
        removeItem,
    } = useCart();
    const shop = useShop();
    const { config } = useShopConfig();
    const { addOrder } = useOrders();

    // Checkout state
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("delivery");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string } | null>(null);
    const [stripeError, setStripeError] = useState<string | null>(null);

    // Check if shop has payments enabled (Stripe or PayPal)
    const paymentProvider = shop?.payments?.provider;
    const stripeEnabled = shop?.payments?.enabled && shop?.payments?.stripeAccountId && paymentProvider === "stripe";
    const paypalEnabled = shop?.payments?.enabled && shop?.payments?.paypalEmail && paymentProvider === "paypal";
    const paymentsEnabled = stripeEnabled || paypalEnabled;
    const currency = (shop?.payments?.currency || "USD") as Currency;

    // Generate a unique orderId for Stripe checkout (memoized to avoid regeneration)
    const orderId = useMemo(() => `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

    // Map cart items to Stripe checkout format
    const stripeItems = useMemo(() => {
        return products.map((p) => {
            const basePrice = p.promoPrice || p.price;
            const extrasTotal = p.extrasTotal || 0;
            let description = "";
            if (p.variantName) description += p.variantName;
            if (p.selectedExtras && p.selectedExtras.length > 0) {
                const extrasStr = p.selectedExtras.map(e =>
                    e.quantity > 1 ? `${e.name} x${e.quantity}` : e.name
                ).join(", ");
                if (description) description += " + ";
                description += extrasStr;
            }
            return {
                name: p.name,
                description: description || undefined,
                quantity: p.quantity,
                unitPrice: basePrice + extrasTotal,
                image: p.image,
            };
        });
    }, [products]);

    // Item notes expanded state
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // Generate min date (today)
    const today = new Date().toISOString().split("T")[0];

    // Generate time slots
    const timeSlots = [];
    for (let h = 8; h <= 20; h++) {
        timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
        timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
    }

    const toggleItemExpand = (itemKey: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    const getItemKey = (item: ProductCartItem, idx: number) => {
        return `${item.id}-${item.variantId || ""}-${idx}`;
    };

    const handleSubmit = async () => {
        if (!customerName || !customerPhone || !customerEmail) {
            alert("Por favor ingresa tu nombre, teléfono y correo electrónico");
            return;
        }

        if (deliveryType === "delivery" && !customerAddress) {
            alert("Por favor ingresa tu dirección de entrega");
            return;
        }

        if (!shop?.contact.phone || !shop?.slug) return;

        setIsSubmitting(true);

        try {
            // Build order items with notes
            const orderItems = products.map((p) => {
                const basePrice = p.promoPrice || p.price;
                const extrasTotal = p.extrasTotal || 0;
                const itemTotal = (basePrice + extrasTotal) * p.quantity;

                let productName = p.name;
                if (p.variantName) productName += ` (${p.variantName})`;
                if (p.selectedExtras && p.selectedExtras.length > 0) {
                    const extrasStr = p.selectedExtras.map(e =>
                        e.quantity > 1 ? `${e.name} x${e.quantity}` : e.name
                    ).join(", ");
                    productName += ` + ${extrasStr}`;
                }

                return {
                    id: p.id,
                    name: productName,
                    quantity: p.quantity,
                    price: basePrice + extrasTotal,
                    notes: p.notes || "",
                };
            });

            // Call internal API
            const response = await fetch("/api/orders/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId: shop.id || shop.slug, // Ensure we have the ID
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress: deliveryType === "delivery" ? customerAddress : "Recoger en tienda",
                    items: orderItems,
                    total: totalPrice,
                    notes: JSON.stringify({
                        deliveryType,
                        scheduledDate,
                        scheduledTime,
                        orderNotes
                    })
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al procesar el pedido");

            console.log("Order confirmed internally:", result.orderId);

            // Set success state
            setOrderSuccess({ id: result.orderId, number: result.orderNumber });

            // Clear cart 
            clearCart();

        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Error al procesar el pedido. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const hasItems = products.length > 0 || services.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={cn(
                "relative flex flex-col w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh]",
                "bg-slate-900 border border-white/10",
                "rounded-t-3xl sm:rounded-2xl",
                "animate-in slide-in-from-bottom duration-300"
            )}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Tu Pedido</h2>
                                <p className="text-sm text-slate-400">
                                    {products.length} {products.length === 1 ? "item" : "items"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Items */}
                    {hasItems && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-400">
                                Productos
                            </h3>
                            {products.map((item, idx) => {
                                const itemKey = getItemKey(item, idx);
                                const isExpanded = expandedItems[itemKey];
                                const basePrice = item.promoPrice || item.price;
                                const extrasTotal = item.extrasTotal || 0;
                                const itemTotal = (basePrice + extrasTotal) * item.quantity;

                                return (
                                    <div
                                        key={itemKey}
                                        className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                                    >
                                        {/* Item header */}
                                        <div className="p-3 flex items-center gap-3">
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-14 h-14 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {item.name}
                                                    {item.variantName && (
                                                        <span className="text-primary"> ({item.variantName})</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    ${basePrice.toLocaleString()} c/u
                                                </p>
                                            </div>

                                            {/* Quantity controls */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateProductQuantity(item.id, item.quantity - 1, item.variantId)}
                                                    className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4 text-white" />
                                                </button>
                                                <span className="w-6 text-center text-white font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateProductQuantity(item.id, item.quantity + 1, item.variantId)}
                                                    className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-white" />
                                                </button>
                                            </div>

                                            <p className="text-white font-bold w-20 text-right">
                                                ${itemTotal.toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Expand/collapse for notes */}
                                        <button
                                            onClick={() => toggleItemExpand(itemKey)}
                                            className="w-full px-3 py-2 flex items-center justify-between text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                                        >
                                            <span className="flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                {item.notes ? "Editar instrucciones" : "Agregar instrucciones"}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Notes input */}
                                        {isExpanded && (
                                            <div className="p-3 border-t border-white/5 bg-white/5">
                                                <textarea
                                                    value={item.notes || ""}
                                                    onChange={(e) => updateItemNotes(item.id, e.target.value, item.variantId)}
                                                    placeholder="Ej: Sin cebolla, extra proteína, bajo en sodio..."
                                                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:border-primary/50"
                                                    rows={2}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Customer Info */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-400">
                            Tus datos
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                            />
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Tu teléfono (WhatsApp)"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                            />
                            <input
                                type="email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                placeholder="Tu email"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Delivery Type */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-400">
                            Tipo de entrega
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeliveryType("delivery")}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                                    deliveryType === "delivery"
                                        ? "bg-primary/20 border-primary text-white"
                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                )}
                            >
                                <Truck className="w-5 h-5" />
                                <span>Delivery</span>
                            </button>
                            <button
                                onClick={() => setDeliveryType("pickup")}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl border transition-all",
                                    deliveryType === "pickup"
                                        ? "bg-primary/20 border-primary text-white"
                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                )}
                            >
                                <Store className="w-5 h-5" />
                                <span>Recoger</span>
                            </button>
                        </div>

                        {/* Address for delivery */}
                        {deliveryType === "delivery" && (
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Tu dirección de entrega"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        )}
                    </div>

                    {/* Schedule */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-400">
                            Programar entrega (opcional)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={today}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                                />
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                <select
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 appearance-none"
                                >
                                    <option value="">Hora</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-400">
                            Notas adicionales (opcional)
                        </h3>
                        <textarea
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            placeholder="Instrucciones especiales, alergias, etc..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:border-primary/50"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer with total and CTA */}
                <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-4">
                    {orderSuccess ? (
                        <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">¡Pedido Registrado!</h3>
                                <p className="text-slate-400 text-sm mt-1">Número de orden: <span className="text-primary font-bold">{orderSuccess.number}</span></p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="w-full bg-primary hover:bg-primary/90 text-white py-6"
                            >
                                Entendido
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-400">Total</span>
                                <span className="text-2xl font-bold text-white">
                                    ${totalPrice.toLocaleString()}
                                </span>
                            </div>

                            {/* Stripe Error Message */}
                            {stripeError && (
                                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {stripeError}
                                </div>
                            )}

                            {/* Payment Options */}
                            <div className="space-y-3">
                                {/* Stripe Payment Button */}
                                {stripeEnabled && (
                                    <StripePayButton
                                        shopId={shop?.id || shop?.slug || ""}
                                        orderId={orderId}
                                        items={stripeItems}
                                        customerEmail={customerEmail || undefined}
                                        customerName={customerName || undefined}
                                        currency={currency}
                                        disabled={!hasItems || !customerName || !customerPhone || !customerEmail || (deliveryType === "delivery" && !customerAddress)}
                                        onError={(error) => setStripeError(error)}
                                        className="py-6 text-lg"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        Pagar con Tarjeta
                                    </StripePayButton>
                                )}

                                {/* PayPal Payment Button */}
                                {paypalEnabled && !hasItems && (
                                    <div className="p-4 bg-zinc-800 rounded-xl text-center text-slate-400 text-sm">
                                        Agrega productos para pagar con PayPal
                                    </div>
                                )}
                                {paypalEnabled && hasItems && (
                                    <div className={cn(
                                        "transition-opacity",
                                        (!customerName || !customerPhone || !customerEmail || (deliveryType === "delivery" && !customerAddress))
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    )}>
                                        <PayPalPayButton
                                            shopId={shop?.id || shop?.slug || ""}
                                            orderId={orderId}
                                            items={stripeItems}
                                            currency={currency}
                                            disabled={!customerName || !customerPhone || !customerEmail || (deliveryType === "delivery" && !customerAddress)}
                                            onError={(error) => setStripeError(error)}
                                        />
                                    </div>
                                )}

                                {/* Regular Confirm Order Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !hasItems}
                                    className={cn(
                                        "w-full py-6 text-lg",
                                        paymentsEnabled
                                            ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                                            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="w-5 h-5 mr-2" />
                                            {paymentsEnabled ? "Pagar al Recibir" : "Confirmar Pedido"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

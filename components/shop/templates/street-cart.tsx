"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2, ChevronUp, Flame, Zap, Package, User, Phone, Mail, MapPin, Truck, Store, Loader2, Check, ChevronLeft } from "lucide-react";
import { useCart, useShop } from "@/components/shared";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ManualPaymentModal } from "@/components/shop/manual-payment-modal";
import type { ShopManualPaymentConfig } from "@/lib/types/payment.types";
import { DEFAULT_MANUAL_PAYMENT_CONFIG } from "@/lib/types/payment.types";

// GPU acceleration styles
const GPU_STYLE: React.CSSProperties = {
    willChange: "transform, opacity",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
};

// Premium spring configs
const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30,
    mass: 0.5,
};

const SLAM_SPRING = {
    type: "spring" as const,
    stiffness: 600,
    damping: 25,
    mass: 0.8,
};

// Add to cart animation particles
interface Particle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    rotation: number;
}

const SLAM_EMOJIS = ["🔥", "💯", "⚡", "🖤", "💀", "⭐"];

export function StreetCart() {
    const {
        products,
        totalItems,
        totalPrice,
        clearCart,
        updateProductQuantity,
        removeItem
    } = useCart();
    const shop = useShop();

    const [isExpanded, setIsExpanded] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [isSlam, setIsSlam] = useState(false);
    const particleIdRef = useRef(0);

    // Checkout state
    const [showCheckout, setShowCheckout] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string; number: string } | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<ShopManualPaymentConfig | null>(null);

    // Track last totalItems to detect additions
    const lastTotalItems = useRef(totalItems);

    // Load payment config
    useEffect(() => {
        if (!shop?.id) return;
        fetch(`/api/payments/submit-receipt?shopId=${shop.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.config) setPaymentConfig(data.config);
            })
            .catch(() => { });
    }, [shop?.id]);

    // Slam effect when item is added
    useEffect(() => {
        if (totalItems > lastTotalItems.current) {
            setIsSlam(true);
            setTimeout(() => setIsSlam(false), 300);

            const newParticles: Particle[] = Array.from({ length: 5 }, () => ({
                id: particleIdRef.current++,
                x: Math.random() * 100 - 50,
                y: Math.random() * -80 - 20,
                emoji: SLAM_EMOJIS[Math.floor(Math.random() * SLAM_EMOJIS.length)],
                rotation: Math.random() * 360,
            }));

            setParticles(prev => [...prev, ...newParticles]);
            setTimeout(() => {
                setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 1000);
        }
        lastTotalItems.current = totalItems;
    }, [totalItems]);

    // Handle checkout submission
    const handleCheckout = useCallback(async () => {
        if (!customerName || !customerPhone || !customerEmail) {
            alert("Por favor completa todos los campos requeridos");
            return;
        }
        if (deliveryType === "delivery" && !customerAddress) {
            alert("Por favor ingresa tu dirección de entrega");
            return;
        }
        if (!shop?.id) return;

        setIsSubmitting(true);

        try {
            const orderItems = products.map((p) => {
                const basePrice = p.promoPrice || p.price;
                const extrasTotal = p.extrasTotal || 0;
                let productName = p.name;
                if (p.variantName) productName += ` (${p.variantName})`;
                if (p.selectedExtras && p.selectedExtras.length > 0) {
                    const extrasStr = p.selectedExtras.map(e => e.name).join(", ");
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

            const response = await fetch("/api/orders/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId: shop.id,
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress: deliveryType === "delivery" ? customerAddress : "Recoger en tienda",
                    items: orderItems,
                    total: totalPrice,
                    notes: JSON.stringify({ deliveryType }),
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al procesar el pedido");

            setOrderId(result.orderId);

            if (paymentConfig?.enabled && paymentConfig.paymentMethods.some(m => m.isActive)) {
                setShowPaymentModal(true);
            } else {
                setOrderSuccess({ id: result.orderId, number: result.orderNumber });
                clearCart();
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert(error.message || "Error al procesar el pedido");
        } finally {
            setIsSubmitting(false);
        }
    }, [customerName, customerPhone, customerEmail, customerAddress, deliveryType, shop?.id, products, totalPrice, paymentConfig, clearCart]);

    const handlePaymentSubmitted = useCallback(() => {
        if (orderId) {
            setOrderSuccess({ id: orderId, number: orderId.slice(-6).toUpperCase() });
        }
        setShowPaymentModal(false);
        clearCart();
    }, [orderId, clearCart]);

    const resetCheckout = useCallback(() => {
        setShowCheckout(false);
        setOrderSuccess(null);
        setOrderId(null);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setCustomerAddress("");
    }, []);

    // Motion values for hover effects
    const scale = useMotionValue(1);
    const springScale = useSpring(scale, SPRING_CONFIG);

    if (totalItems === 0 && !orderSuccess) return null;

    // Order success view
    if (orderSuccess) {
        return (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={cn(
                    "fixed bottom-4 left-2 right-2 z-[70]",
                    "sm:left-4 sm:right-4",
                    "md:left-auto md:right-6 md:max-w-lg"
                )}
            >
                <div className="bg-black/95 border-2 border-green-500 p-6 shadow-[5px_5px_0px_rgba(34,197,94,1)]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 mx-auto mb-4 flex items-center justify-center">
                            <Check className="w-8 h-8 text-black" />
                        </div>
                        <h3 className="text-white font-black uppercase text-xl mb-2">ORDER CONFIRMED</h3>
                        <p className="text-green-400 font-mono text-lg mb-4">#{orderSuccess.number}</p>
                        <p className="text-slate-400 text-sm mb-6">
                            Te contactaremos pronto para coordinar tu pedido
                        </p>
                        <button
                            onClick={resetCheckout}
                            className="w-full py-3 bg-green-500 text-black font-black uppercase hover:bg-green-400 transition-colors"
                        >
                            CONTINUAR
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className={cn(
                    "fixed bottom-4 left-2 right-2 z-[70]",
                    "sm:left-4 sm:right-4",
                    "md:left-auto md:right-6 md:max-w-lg"
                )}
                style={GPU_STYLE}
            >
                {/* Slam particles */}
                <AnimatePresence>
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                            animate={{
                                x: particle.x,
                                y: particle.y,
                                scale: 1,
                                opacity: 0,
                                rotate: particle.rotation,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute bottom-full left-1/2 text-2xl pointer-events-none z-50"
                            style={GPU_STYLE}
                        >
                            {particle.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Main Cart Container */}
                <motion.div
                    animate={isSlam ? {
                        scale: [1, 1.05, 0.98, 1],
                        rotate: [0, -2, 2, 0],
                    } : {}}
                    transition={SLAM_SPRING}
                    className={cn(
                        "relative overflow-hidden",
                        "bg-black/95 border-2 border-red-500",
                        "shadow-[5px_5px_0px_rgba(255,0,51,1),10px_10px_0px_rgba(0,0,0,1)]",
                        "backdrop-blur-xl"
                    )}
                    style={GPU_STYLE}
                    onHoverStart={() => scale.set(1.02)}
                    onHoverEnd={() => scale.set(1)}
                >
                    {/* Glitch line effect */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-pulse" />

                    <AnimatePresence mode="wait">
                        {showCheckout ? (
                            <CheckoutForm
                                key="checkout"
                                customerName={customerName}
                                setCustomerName={setCustomerName}
                                customerPhone={customerPhone}
                                setCustomerPhone={setCustomerPhone}
                                customerEmail={customerEmail}
                                setCustomerEmail={setCustomerEmail}
                                customerAddress={customerAddress}
                                setCustomerAddress={setCustomerAddress}
                                deliveryType={deliveryType}
                                setDeliveryType={setDeliveryType}
                                totalPrice={totalPrice}
                                isSubmitting={isSubmitting}
                                onBack={() => setShowCheckout(false)}
                                onSubmit={handleCheckout}
                            />
                        ) : (
                            <CartContent
                                key="cart"
                                products={products}
                                totalItems={totalItems}
                                totalPrice={totalPrice}
                                isExpanded={isExpanded}
                                setIsExpanded={setIsExpanded}
                                isSlam={isSlam}
                                clearCart={clearCart}
                                updateProductQuantity={updateProductQuantity}
                                removeItem={removeItem}
                                onCheckout={() => setShowCheckout(true)}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* Payment Modal */}
            {showPaymentModal && orderId && (
                <ManualPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    orderId={orderId}
                    orderTotal={totalPrice}
                    shopId={shop?.id || ""}
                    config={paymentConfig || DEFAULT_MANUAL_PAYMENT_CONFIG}
                    onPaymentSubmitted={handlePaymentSubmitted}
                />
            )}
        </>
    );
}

// Cart Content Component
interface CartContentProps {
    products: any[];
    totalItems: number;
    totalPrice: number;
    isExpanded: boolean;
    setIsExpanded: (v: boolean) => void;
    isSlam: boolean;
    clearCart: () => void;
    updateProductQuantity: (id: string, qty: number, variantId?: string) => void;
    removeItem: (id: string, variantId?: string) => void;
    onCheckout: () => void;
}

function CartContent({
    products,
    totalItems,
    totalPrice,
    isExpanded,
    setIsExpanded,
    isSlam,
    clearCart,
    updateProductQuantity,
    removeItem,
    onCheckout
}: CartContentProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Cart Summary Bar */}
            <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Icon + Count */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={isSlam ? { rotate: [0, -10, 10, 0] } : {}}
                            className="relative"
                        >
                            <div className="w-12 h-12 bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-red-500" />
                            </div>
                            <motion.div
                                key={totalItems}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-black flex items-center justify-center"
                            >
                                {totalItems}
                            </motion.div>
                        </motion.div>

                        <div>
                            <p className="text-white font-black uppercase tracking-widest text-sm">
                                TU CARRITO
                            </p>
                            <p className="text-slate-400 text-xs font-mono">
                                {totalItems} {totalItems === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Total + Actions */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">TOTAL</p>
                            <motion.p
                                key={totalPrice}
                                initial={{ scale: 1.2, color: "#FF0033" }}
                                animate={{ scale: 1, color: "#ffffff" }}
                                className="text-xl font-black text-white"
                            >
                                ${totalPrice.toLocaleString()}
                            </motion.p>
                        </div>

                        {/* Checkout Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCheckout}
                            className={cn(
                                "px-6 py-3 bg-red-500 text-white font-black uppercase tracking-widest text-sm",
                                "border-2 border-red-500",
                                "hover:bg-black hover:text-red-500 transition-colors",
                                "shadow-[3px_3px_0px_rgba(0,0,0,1)]",
                                "active:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                PEDIR
                            </span>
                        </motion.button>

                        {/* Clear Button */}
                        <button
                            onClick={clearCart}
                            className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Expand Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-4 pt-3 border-t border-red-500/30 flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronUp className="w-4 h-4" />
                    </motion.div>
                    <span>{isExpanded ? 'OCULTAR' : 'VER ARTÍCULOS'}</span>
                </button>
            </div>

            {/* Expanded Cart Items */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t-2 border-red-500/30 max-h-[50vh] overflow-y-auto">
                            {products.map((product, idx) => (
                                <CartItem
                                    key={`${product.id}-${product.variantId || ""}-${idx}`}
                                    product={product}
                                    index={idx}
                                    onUpdateQuantity={(qty) =>
                                        updateProductQuantity(product.id, qty, product.variantId)
                                    }
                                    onRemove={() => removeItem(product.id, product.variantId)}
                                />
                            ))}

                            {/* Urgency Message */}
                            <div className="p-4 bg-red-500/10 border-t border-red-500/30">
                                <div className="flex items-center gap-2 text-red-400 text-xs font-mono uppercase">
                                    <Flame className="w-4 h-4 animate-pulse" />
                                    <span>Stock limitado - Los artículos pueden agotarse</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Checkout Form Component
interface CheckoutFormProps {
    customerName: string;
    setCustomerName: (v: string) => void;
    customerPhone: string;
    setCustomerPhone: (v: string) => void;
    customerEmail: string;
    setCustomerEmail: (v: string) => void;
    customerAddress: string;
    setCustomerAddress: (v: string) => void;
    deliveryType: "pickup" | "delivery";
    setDeliveryType: (v: "pickup" | "delivery") => void;
    totalPrice: number;
    isSubmitting: boolean;
    onBack: () => void;
    onSubmit: () => void;
}

function CheckoutForm({
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerEmail,
    setCustomerEmail,
    customerAddress,
    setCustomerAddress,
    deliveryType,
    setDeliveryType,
    totalPrice,
    isSubmitting,
    onBack,
    onSubmit
}: CheckoutFormProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="p-4"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={onBack}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-white font-black uppercase tracking-widest">TUS DATOS</h3>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {/* Name */}
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input
                        type="text"
                        placeholder="Tu nombre *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-red-500/30 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none font-mono text-sm"
                    />
                </div>

                {/* Phone */}
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input
                        type="tel"
                        placeholder="WhatsApp (10 dígitos) *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-red-500/30 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none font-mono text-sm"
                    />
                </div>

                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input
                        type="email"
                        placeholder="Correo electrónico *"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-red-500/30 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none font-mono text-sm"
                    />
                </div>

                {/* Delivery Type */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setDeliveryType("pickup")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 border transition-colors font-mono text-sm uppercase",
                            deliveryType === "pickup"
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-transparent border-red-500/30 text-slate-400 hover:border-red-500"
                        )}
                    >
                        <Store className="w-4 h-4" />
                        Recoger
                    </button>
                    <button
                        onClick={() => setDeliveryType("delivery")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-3 border transition-colors font-mono text-sm uppercase",
                            deliveryType === "delivery"
                                ? "bg-red-500 border-red-500 text-white"
                                : "bg-transparent border-red-500/30 text-slate-400 hover:border-red-500"
                        )}
                    >
                        <Truck className="w-4 h-4" />
                        Entrega
                    </button>
                </div>

                {/* Address (if delivery) */}
                <AnimatePresence>
                    {deliveryType === "delivery" && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="relative"
                        >
                            <MapPin className="absolute left-3 top-4 w-4 h-4 text-red-500" />
                            <textarea
                                placeholder="Dirección de entrega *"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                rows={2}
                                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-red-500/30 text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none font-mono text-sm resize-none"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit */}
            <div className="mt-4 pt-4 border-t border-red-500/30">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm uppercase">Total</span>
                    <span className="text-white text-xl font-black">${totalPrice.toLocaleString()}</span>
                </div>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className={cn(
                        "w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest",
                        "border-2 border-red-500",
                        "shadow-[3px_3px_0px_rgba(0,0,0,1)]",
                        "hover:bg-black hover:text-red-500 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "flex items-center justify-center gap-2"
                    )}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            PROCESANDO...
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            CONFIRMAR PEDIDO
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}

// Individual Cart Item Component
interface CartItemProps {
    product: {
        id: string;
        name: string;
        price: number;
        promoPrice?: number;
        quantity: number;
        image?: string;
        variantId?: string;
        variantName?: string;
        selectedExtras?: Array<{ extraId: string; name: string; price: number }>;
        extrasTotal?: number;
    };
    index: number;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

function CartItem({ product, index, onUpdateQuantity, onRemove }: CartItemProps) {
    const itemPrice = (product.promoPrice || product.price) + (product.extrasTotal || 0);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = () => {
        setIsRemoving(true);
        setTimeout(onRemove, 200);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: isRemoving ? 0 : 1,
                x: isRemoving ? -50 : 0,
                height: isRemoving ? 0 : "auto",
            }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 border-b border-red-500/20 hover:bg-red-500/5 transition-colors"
            style={GPU_STYLE}
        >
            {/* Product Image */}
            <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-20 h-20 bg-black border border-red-500/30 overflow-hidden flex-shrink-0"
            >
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        sizes="80px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-red-500/50" />
                    </div>
                )}

                {/* VHS scanlines effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/30 opacity-50" />
            </motion.div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-black uppercase tracking-wider text-sm truncate">
                    {product.name}
                </h4>
                {product.variantName && (
                    <p className="text-red-400 text-xs font-mono uppercase">
                        {product.variantName}
                    </p>
                )}
                {product.selectedExtras && product.selectedExtras.length > 0 && (
                    <p className="text-slate-500 text-xs truncate">
                        +{product.selectedExtras.map(e => e.name).join(", ")}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-red-500 font-black">
                        ${(itemPrice * product.quantity).toLocaleString()}
                    </span>
                    {product.quantity > 1 && (
                        <span className="text-slate-500 text-xs">
                            (${itemPrice.toLocaleString()} c/u)
                        </span>
                    )}
                </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        if (product.quantity > 1) {
                            onUpdateQuantity(product.quantity - 1);
                        } else {
                            handleRemove();
                        }
                    }}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center",
                        "border border-red-500/30 text-red-400",
                        "hover:bg-red-500/20 transition-colors"
                    )}
                >
                    {product.quantity === 1 ? (
                        <Trash2 className="w-4 h-4" />
                    ) : (
                        <Minus className="w-4 h-4" />
                    )}
                </motion.button>

                <motion.span
                    key={product.quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="w-10 text-center text-white font-black"
                >
                    {product.quantity}
                </motion.span>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onUpdateQuantity(product.quantity + 1)}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center",
                        "border border-red-500/30 text-red-400",
                        "hover:bg-red-500/20 transition-colors"
                    )}
                >
                    <Plus className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}

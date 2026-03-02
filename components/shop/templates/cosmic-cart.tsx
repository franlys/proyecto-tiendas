"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Minus, Plus, Trash2, ChevronUp, Sparkles, Rocket, Star, Package, User, Phone, Mail, MapPin, Truck, Store, Loader2, Check, CreditCard, ChevronLeft } from "lucide-react";
import { useCart, useShop } from "@/components/shared";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ManualPaymentModal } from "@/components/shop/manual-payment-modal";
import type { ShopManualPaymentConfig } from "@/lib/types/payment.types";
import { DEFAULT_MANUAL_PAYMENT_CONFIG } from "@/lib/types/payment.types";

// Mobile detection hook - cached result
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        check();
        window.addEventListener("resize", check, { passive: true });
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

// Reduced motion preference
function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(mq.matches);
        const handler = () => setReduced(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return reduced;
}

// Simplified spring for mobile
const FAST_TRANSITION = { type: "tween", duration: 0.15, ease: "easeOut" };
const SPRING_TRANSITION = { type: "spring", stiffness: 400, damping: 30 };

// Static stars with CSS animation (no JS animation loop)
function StaticStarfield({ color = "#8B5CF6" }: { color?: string }) {
    const stars = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 1.5 + 0.5,
            delay: Math.random() * 2,
        }))
    , []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute rounded-full animate-pulse"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                        backgroundColor: color,
                        opacity: 0.6,
                        animationDelay: `${star.delay}s`,
                        animationDuration: "2s",
                    }}
                />
            ))}
        </div>
    );
}

// Static nebula with no animation
function StaticNebula() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10"
                style={{
                    background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
                }}
            />
            <div
                className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-10"
                style={{
                    background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
                }}
            />
        </div>
    );
}

export interface CosmicCartProps {
    primaryColor?: string;
    secondaryColor?: string;
}

export function CosmicCart({
    primaryColor = "#8B5CF6",
    secondaryColor = "#06B6D4",
}: CosmicCartProps) {
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
    const [pulse, setPulse] = useState(false);
    const isMobile = useIsMobile();
    const reducedMotion = useReducedMotion();

    // Checkout state
    const [showCheckout, setShowCheckout] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string; number: string } | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Manual payment state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentConfig, setPaymentConfig] = useState<ShopManualPaymentConfig | null>(null);

    // Fetch payment config when shop is available
    useEffect(() => {
        async function fetchPaymentConfig() {
            if (!shop?.id) return;
            try {
                const { db } = await import("@/lib/firebase");
                const { doc, getDoc } = await import("firebase/firestore");
                const configRef = doc(db, "shops", shop.id, "settings", "payments");
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) {
                    setPaymentConfig(configSnap.data() as ShopManualPaymentConfig);
                } else {
                    setPaymentConfig(DEFAULT_MANUAL_PAYMENT_CONFIG);
                }
            } catch (err) {
                console.error("Error fetching payment config:", err);
                setPaymentConfig(DEFAULT_MANUAL_PAYMENT_CONFIG);
            }
        }
        fetchPaymentConfig();
    }, [shop?.id]);

    // Handle checkout submission - memoized
    const handleCheckout = useCallback(async () => {
        if (!customerName || !customerPhone || !customerEmail) {
            alert("Por favor completa tus datos");
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

    const handlePaymentSubmitted = useCallback((receiptUrl: string, paymentMethodId: string) => {
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

    // Simple pulse effect on item add (CSS-based, not JS animation loop)
    const lastTotalItems = useRef(totalItems);
    useEffect(() => {
        if (totalItems > lastTotalItems.current) {
            setPulse(true);
            const t = setTimeout(() => setPulse(false), 300);
            return () => clearTimeout(t);
        }
        lastTotalItems.current = totalItems;
    }, [totalItems]);

    // Animation config based on device
    const transition = reducedMotion || isMobile ? FAST_TRANSITION : SPRING_TRANSITION;

    if (totalItems === 0) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={transition}
            className={cn(
                "fixed bottom-4 left-2 right-2 z-[70]",
                "sm:left-4 sm:right-4",
                "md:left-auto md:right-6 md:max-w-lg"
            )}
            style={{ willChange: "transform" }}
        >
            {/* Main Cart Container - CSS transition for pulse */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-gradient-to-br from-violet-950/95 via-slate-900/95 to-cyan-950/95",
                    "border border-violet-500/30",
                    "shadow-lg",
                    !isMobile && "shadow-[0_0_20px_rgba(139,92,246,0.2)]",
                    isMobile ? "backdrop-blur-sm" : "backdrop-blur-xl",
                    "transition-transform duration-150 ease-out",
                    pulse && "scale-[1.02]"
                )}
            >
                {/* Background effects - Desktop only, static */}
                {!isMobile && !reducedMotion && <StaticStarfield color={primaryColor} />}
                {!isMobile && <StaticNebula />}

                {/* Top gradient line */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, transparent)`,
                    }}
                />

                {/* Cart Summary Bar */}
                <div className="relative z-10 p-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left: Icon + Count */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-150"
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20)`,
                                        border: `1px solid ${primaryColor}50`,
                                        transform: pulse ? "scale(1.1)" : "scale(1)",
                                    }}
                                >
                                    <ShoppingBag className="w-6 h-6" style={{ color: primaryColor }} />
                                </div>
                                {/* Badge - CSS animation */}
                                <div
                                    key={totalItems}
                                    className={cn(
                                        "absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center",
                                        pulse && "animate-bounce"
                                    )}
                                    style={{
                                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                    }}
                                >
                                    {totalItems}
                                </div>
                            </div>

                            <div>
                                <p className="text-white font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" style={{ color: secondaryColor }} />
                                    CARRITO
                                </p>
                                <p className="text-violet-300/70 text-xs tracking-widest">
                                    {totalItems} {totalItems === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Total + Actions */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] text-violet-400/60 uppercase tracking-widest">TOTAL</p>
                                <p
                                    className="text-xl font-black text-transparent bg-clip-text transition-transform duration-150"
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                        transform: pulse ? "scale(1.1)" : "scale(1)",
                                    }}
                                >
                                    ${totalPrice.toLocaleString()}
                                </p>
                            </div>

                            {/* Checkout Button - CSS hover */}
                            <button
                                onClick={() => setShowCheckout(true)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-white font-bold uppercase tracking-wider text-sm",
                                    "border border-transparent",
                                    "transition-all duration-150",
                                    "hover:scale-105 active:scale-95"
                                )}
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <Rocket className="w-4 h-4" />
                                    PAGAR
                                </span>
                            </button>

                            {/* Clear Button - CSS hover */}
                            <button
                                onClick={clearCart}
                                className="p-2 text-violet-400/50 hover:text-cyan-400 transition-all duration-150 hover:scale-110 hover:rotate-90 active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Expand Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full mt-4 pt-3 border-t border-violet-500/20 flex items-center justify-center gap-2 text-xs text-violet-300/60 hover:text-cyan-400 transition-colors uppercase tracking-[0.3em]"
                    >
                        <ChevronUp
                            className={cn(
                                "w-4 h-4 transition-transform duration-200",
                                isExpanded && "rotate-180"
                            )}
                        />
                        <span>{isExpanded ? 'OCULTAR' : 'VER ARTÍCULOS'}</span>
                    </button>
                </div>

                {/* Expanded Cart Items - Simplified transition */}
                <div
                    className={cn(
                        "overflow-hidden relative z-10 transition-all duration-200 ease-out",
                        isExpanded ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"
                    )}
                >
                    <div
                        className="border-t max-h-[50vh] overflow-y-auto overscroll-contain"
                        style={{ borderColor: `${primaryColor}30` }}
                    >
                        {products.map((product, idx) => (
                            <CosmicCartItem
                                key={`${product.id}-${product.variantId || ""}-${idx}`}
                                product={product}
                                primaryColor={primaryColor}
                                secondaryColor={secondaryColor}
                                onUpdateQuantity={(qty) =>
                                    updateProductQuantity(product.id, qty, product.variantId)
                                }
                                onRemove={() => removeItem(product.id, product.variantId)}
                                isMobile={isMobile}
                            />
                        ))}

                        {/* Cosmic message - static star */}
                        <div
                            className="p-4 border-t"
                            style={{
                                borderColor: `${primaryColor}20`,
                                background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`,
                            }}
                        >
                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                <Star className="w-4 h-4 animate-spin" style={{ color: secondaryColor, animationDuration: "4s" }} />
                                <span className="text-violet-300/70">
                                    Envío a cualquier galaxia disponible
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom gradient line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${secondaryColor}, ${primaryColor}, transparent)`,
                    }}
                />
            </div>

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckout && (
                    <CosmicCheckoutModal
                        isOpen={showCheckout}
                        onClose={resetCheckout}
                        primaryColor={primaryColor}
                        secondaryColor={secondaryColor}
                        products={products}
                        totalPrice={totalPrice}
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
                        isSubmitting={isSubmitting}
                        orderSuccess={orderSuccess}
                        onSubmit={handleCheckout}
                    />
                )}
            </AnimatePresence>

            {/* Manual Payment Modal */}
            {paymentConfig && orderId && (
                <ManualPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        // Still show success even if they close the payment modal
                        if (orderId) {
                            setOrderSuccess({ id: orderId, number: orderId.slice(-6).toUpperCase() });
                            clearCart();
                        }
                    }}
                    paymentConfig={paymentConfig}
                    totalAmount={totalPrice}
                    currency={paymentConfig.defaultCurrency}
                    orderId={orderId}
                    shopId={shop?.id || ""}
                    customerName={customerName}
                    customerPhone={customerPhone}
                    customerEmail={customerEmail}
                    onPaymentSubmitted={handlePaymentSubmitted}
                />
            )}
        </motion.div>
    );
}

// Individual Cart Item Component - Optimized
interface CosmicCartItemProps {
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
    primaryColor: string;
    secondaryColor: string;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
    isMobile?: boolean;
}

function CosmicCartItem({
    product,
    primaryColor,
    secondaryColor,
    onUpdateQuantity,
    onRemove,
    isMobile
}: CosmicCartItemProps) {
    const itemPrice = (product.promoPrice || product.price) + (product.extrasTotal || 0);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = useCallback(() => {
        setIsRemoving(true);
        setTimeout(onRemove, 150);
    }, [onRemove]);

    const handleDecrease = useCallback(() => {
        if (product.quantity > 1) {
            onUpdateQuantity(product.quantity - 1);
        } else {
            handleRemove();
        }
    }, [product.quantity, onUpdateQuantity, handleRemove]);

    const handleIncrease = useCallback(() => {
        onUpdateQuantity(product.quantity + 1);
    }, [product.quantity, onUpdateQuantity]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 p-4 border-b transition-all duration-150",
                isRemoving && "opacity-0 -translate-x-10 h-0 p-0 overflow-hidden"
            )}
            style={{ borderColor: `${primaryColor}15` }}
        >
            {/* Product Image - No hover animation on mobile */}
            <div
                className={cn(
                    "relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0",
                    !isMobile && "hover:scale-105 transition-transform duration-150"
                )}
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                    border: `1px solid ${primaryColor}30`,
                }}
            >
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6" style={{ color: `${primaryColor}60` }} />
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold uppercase tracking-wider text-sm truncate">
                    {product.name}
                </h4>
                {product.variantName && (
                    <p className="text-xs tracking-wider" style={{ color: secondaryColor }}>
                        {product.variantName}
                    </p>
                )}
                {product.selectedExtras && product.selectedExtras.length > 0 && (
                    <p className="text-violet-400/50 text-xs truncate">
                        +{product.selectedExtras.map(e => e.name).join(", ")}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className="font-black text-transparent bg-clip-text"
                        style={{
                            backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                    >
                        ${(itemPrice * product.quantity).toLocaleString()}
                    </span>
                    {product.quantity > 1 && (
                        <span className="text-violet-400/40 text-xs">
                            (${itemPrice.toLocaleString()} c/u)
                        </span>
                    )}
                </div>
            </div>

            {/* Quantity Controls - CSS transitions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={handleDecrease}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100 active:scale-90 hover:scale-105"
                    style={{
                        border: `1px solid ${primaryColor}40`,
                        color: primaryColor,
                    }}
                >
                    {product.quantity === 1 ? (
                        <Trash2 className="w-4 h-4" />
                    ) : (
                        <Minus className="w-4 h-4" />
                    )}
                </button>

                <span className="w-8 text-center text-white font-bold text-sm">
                    {product.quantity}
                </span>

                <button
                    onClick={handleIncrease}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100 active:scale-90 hover:scale-105"
                    style={{
                        border: `1px solid ${primaryColor}40`,
                        color: primaryColor,
                    }}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// Cosmic Checkout Modal Component
interface CosmicCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    primaryColor: string;
    secondaryColor: string;
    products: any[];
    totalPrice: number;
    customerName: string;
    setCustomerName: (v: string) => void;
    customerPhone: string;
    setCustomerPhone: (v: string) => void;
    customerEmail: string;
    setCustomerEmail: (v: string) => void;
    customerAddress: string;
    setCustomerAddress: (v: string) => void;
    deliveryType: "delivery" | "pickup";
    setDeliveryType: (v: "delivery" | "pickup") => void;
    isSubmitting: boolean;
    orderSuccess: { id: string; number: string } | null;
    onSubmit: () => void;
}

function CosmicCheckoutModal({
    isOpen,
    onClose,
    primaryColor,
    secondaryColor,
    products,
    totalPrice,
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
    isSubmitting,
    orderSuccess,
    onSubmit,
}: CosmicCheckoutModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative w-full max-w-md max-h-[90vh] overflow-hidden",
                    "bg-gradient-to-br from-violet-950/95 via-slate-900/95 to-cyan-950/95",
                    "border border-violet-500/30 rounded-2xl",
                    "shadow-lg",
                    "animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                )}
            >
                {/* Top gradient line */}
                <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${primaryColor}, ${secondaryColor}, transparent)`,
                    }}
                />

                {/* Header */}
                <div className="sticky top-0 z-10 bg-violet-950/90 backdrop-blur-sm border-b border-violet-500/20 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: primaryColor }}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Rocket className="w-4 h-4" style={{ color: secondaryColor }} />
                                Finalizar Pedido
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-violet-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-4 space-y-6">
                    {orderSuccess ? (
                        <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
                                    borderColor: secondaryColor,
                                }}
                            >
                                <Check className="w-10 h-10" style={{ color: secondaryColor }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                                    ¡Pedido Confirmado!
                                </h3>
                                <p className="text-violet-300/70 text-sm mt-2">
                                    Orden: <span className="font-bold text-white">{orderSuccess.number}</span>
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-xl text-white font-bold uppercase tracking-wider transition-transform duration-100 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Customer Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Tus Datos
                                </h3>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Tu nombre"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-violet-500/20 rounded-xl text-white placeholder:text-violet-300/40 focus:outline-none focus:border-violet-500/50"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            placeholder="Tu teléfono (WhatsApp)"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-violet-500/20 rounded-xl text-white placeholder:text-violet-300/40 focus:outline-none focus:border-violet-500/50"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
                                        <input
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="Tu correo electrónico"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-violet-500/20 rounded-xl text-white placeholder:text-violet-300/40 focus:outline-none focus:border-violet-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Type */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                                    <Truck className="w-3 h-3" />
                                    Tipo de Entrega
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDeliveryType("delivery")}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border transition-all",
                                            deliveryType === "delivery"
                                                ? "border-violet-500 bg-violet-500/20 text-white"
                                                : "border-violet-500/20 bg-white/5 text-violet-300/60 hover:bg-white/10"
                                        )}
                                    >
                                        <Truck className="w-5 h-5" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Delivery</span>
                                    </button>
                                    <button
                                        onClick={() => setDeliveryType("pickup")}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-xl border transition-all",
                                            deliveryType === "pickup"
                                                ? "border-cyan-500 bg-cyan-500/20 text-white"
                                                : "border-violet-500/20 bg-white/5 text-violet-300/60 hover:bg-white/10"
                                        )}
                                    >
                                        <Store className="w-5 h-5" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Recoger</span>
                                    </button>
                                </div>

                                {deliveryType === "delivery" && (
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
                                        <input
                                            type="text"
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            placeholder="Tu dirección de entrega"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-violet-500/20 rounded-xl text-white placeholder:text-violet-300/40 focus:outline-none focus:border-violet-500/50"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShoppingBag className="w-3 h-3" />
                                    Tu Pedido
                                </h3>
                                <div
                                    className="rounded-xl border p-3 space-y-2"
                                    style={{ borderColor: `${primaryColor}30`, background: `${primaryColor}10` }}
                                >
                                    {products.map((p, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-violet-200">
                                                {p.quantity}x {p.name}
                                                {p.variantName && <span className="text-violet-400/60"> ({p.variantName})</span>}
                                            </span>
                                            <span className="text-white font-medium">
                                                ${((p.promoPrice || p.price) * p.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {!orderSuccess && (
                    <div className="sticky bottom-0 bg-violet-950/90 backdrop-blur-sm border-t border-violet-500/20 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-violet-300/70 uppercase tracking-wider text-sm">Total</span>
                            <span
                                className="text-2xl font-black text-transparent bg-clip-text"
                                style={{
                                    backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                                }}
                            >
                                ${totalPrice.toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className={cn(
                                "w-full py-4 rounded-xl text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2",
                                "transition-all duration-100 hover:scale-[1.02] active:scale-[0.98]",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                            )}
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Continuar al Pago
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Bottom gradient line */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${secondaryColor}, ${primaryColor}, transparent)`,
                    }}
                />
            </div>
        </div>
    );
}

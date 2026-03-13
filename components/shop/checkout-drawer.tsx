"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ShoppingBag,
    Minus,
    Plus,
    MapPin,
    Truck,
    Store,
    Loader2,
    Check,
    CreditCard,
    Copy,
    CheckCircle,
    Image as ImageIcon,
    AlertCircle,
    ChevronRight,
} from "lucide-react";
import { useCart, useShop, useOrders, useShopConfig, useInventory } from "@/components/shared";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui";
import { useManualPaymentConfig } from "@/lib/hooks";
import { StripePayButton } from "@/components/shop/stripe-checkout-button";
import { PayPalPayButton } from "@/components/shop/paypal-checkout-button";
import { reverseGeocode } from "@/lib/utils/distance";
import type { Currency, ManualPaymentMethod } from "@/lib/types/payment.types";

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
        removeItem,
    } = useCart();
    const shop = useShop();
    const { config } = useShopConfig();
    const { addOrder } = useOrders();
    const { decrementStock } = useInventory();
    const isTechDrop = shop?.templateType === "tech-drop-v1";
    const isTech3D = shop?.templateType === "tech-3d-v1";
    const isTechTheme = isTechDrop || isTech3D;

    // Field states
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("delivery");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string } | null>(null);
    const [whatsappConfirmUrl, setWhatsappConfirmUrl] = useState<string | null>(null);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");

    // Manual Payment States
    const [paymentTiming, setPaymentTiming] = useState<"pay_now" | "pay_on_delivery">("pay_now"); // Defaulted to now for better testing
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<ManualPaymentMethod | null>(null);
    const { config: manualPaymentConfig } = useManualPaymentConfig(shop?.id || shop?.slug);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // iOS Safari ignores overflow:hidden on body — must use position:fixed
            const scrollY = window.scrollY;
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = "0";
            document.body.style.right = "0";
            document.body.style.overflow = "hidden";
        } else {
            const scrollY = Math.abs(parseInt(document.body.style.top || "0", 10));
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.overflow = "";
            window.scrollTo(0, scrollY);
        }
        return () => {
            const scrollY = Math.abs(parseInt(document.body.style.top || "0", 10));
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.overflow = "";
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    // Upfront Payment Calculation
    const requireUpfront = manualPaymentConfig?.requireUpfrontPayment || false;
    const upfrontPercentage = requireUpfront ? (manualPaymentConfig?.upfrontPaymentPercentage ?? 50) : 0;
    const upfrontAmount = (totalPrice * upfrontPercentage) / 100;
    const remainingBalance = totalPrice - upfrontAmount;

    const hasItems = products.length > 0 || services.length > 0;
    const stripeEnabled = shop?.payments?.enabled && shop?.payments?.stripeAccountId && shop?.payments?.provider === "stripe";
    const paypalEnabled = shop?.payments?.enabled && shop?.payments?.paypalEmail && shop?.payments?.provider === "paypal";
    const currency = (shop?.payments?.currency || "USD") as Currency;

    const orderId = useMemo(() => `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);

    const stripeItems = useMemo(() => {
        return products.map((p: any) => ({
            name: p.name,
            description: p.variantName || undefined,
            quantity: p.quantity,
            unitPrice: (p.promoPrice || p.price) + (p.extrasTotal || 0),
            image: p.image,
        }));
    }, [products]);

    const handleDetectLocation = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!navigator.geolocation) return;
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                try {
                    const address = await reverseGeocode({ lat, lng });
                    setCustomerAddress(address || `${lat}, ${lng}`);
                } catch (error) {
                    setCustomerAddress(`${lat}, ${lng}`);
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            () => setIsDetectingLocation(false)
        );
    };

    const copyToClipboard = async (text: string, fieldName: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (e) => setReceiptPreview(e.target?.result as string);
                reader.readAsDataURL(file);
            }
        }
    };

    const handleSubmit = async () => {
        setFormError(null);
        if (!customerName || !customerPhone || !customerEmail || (deliveryType === "delivery" && !customerAddress)) {
            setFormError("Por favor completa todos los campos requeridos.");
            return;
        }
        if (shop?.businessType === "meal_prep" && (!scheduledDate || !scheduledTime)) {
            setFormError("Por favor selecciona una fecha y horario de entrega.");
            return;
        }
        setIsSubmitting(true);
        try {
            // Upload receipt first if needed
            let receiptUrl = "";
            if (receiptFile && paymentTiming === "pay_now") {
                const storageRef = ref(storage, `receipts/${shop?.id || 'default'}/${Date.now()}`);
                await uploadBytes(storageRef, receiptFile);
                receiptUrl = await getDownloadURL(storageRef);
            }

            const orderItems = products.map(p => ({
                id: p.id,
                name: p.name + (p.variantName ? ` (${p.variantName})` : ""),
                price: p.price,
                quantity: p.quantity,
                image: p.image || "",
            }));

            // Use /api/orders/confirm — generates PDF, sends email + WhatsApp, writes to Firestore
            const confirmRes = await fetch("/api/orders/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId: shop?.id || shop?.slug || "",
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress: deliveryType === "delivery" ? customerAddress : undefined,
                    items: orderItems,
                    total: totalPrice,
                    deliveryType: deliveryType === "delivery" ? "entrega" : "recogida",
                    deliveryDate: scheduledDate || undefined,
                    deliveryTime: scheduledTime || undefined,
                    paymentInfo: {
                        paymentTiming,
                        status: paymentTiming === "pay_now" ? "pending_verification" : "pending",
                        receiptUrl: receiptUrl || undefined,
                    },
                }),
            });

            const confirmData = await confirmRes.json();

            if (!confirmRes.ok) {
                throw new Error(confirmData.error || "Error al procesar el pedido");
            }

            const orderNum = confirmData.orderNumber;

            // Stock Decrement (client-side real-time sync)
            products.forEach(p => {
                decrementStock(p.id, p.quantity);
            });

            // If Evolution not configured, show fallback WhatsApp confirmation button
            if (confirmData.whatsappUrl) {
                setWhatsappConfirmUrl(confirmData.whatsappUrl);
            }

            setOrderSuccess({ id: confirmData.orderId || "order-" + Date.now(), number: orderNum });
            clearCart();
        } catch (e: any) {
            console.error(e);
            setFormError(e.message || "Error al procesar el pedido. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen && !orderSuccess) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }} exit={{ y: "100%" }}
                        className={cn(
                            "relative flex flex-col w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[90vh] border shadow-2xl overflow-hidden",
                            isTech3D
                                ? "border-cyan-500/25 rounded-t-[40px] sm:rounded-[40px] font-sans"
                                : isTechDrop
                                    ? "bg-[#05070a] border-cyan-500/30 rounded-t-[40px] sm:rounded-[40px] font-sans"
                                    : "bg-slate-950 border-white/10 rounded-t-[2.5rem] sm:rounded-3xl"
                        )}
                        style={isTech3D ? {
                            background: "linear-gradient(180deg, #040810 0%, #020509 100%)",
                            boxShadow: "0 -20px 80px rgba(6,182,212,0.12), 0 0 0 1px rgba(6,182,212,0.15)"
                        } : undefined}
                    >
                        {isTech3D && (
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                                {/* Cyan grid lines */}
                                <div className="absolute inset-0 opacity-[0.07]"
                                    style={{
                                        backgroundImage: "linear-gradient(to right, rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,1) 1px, transparent 1px)",
                                        backgroundSize: "48px 48px"
                                    }}
                                />
                                {/* Top glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
                                {/* Corner glows */}
                                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/8 blur-[80px] rounded-full" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/8 blur-[80px] rounded-full" />
                            </div>
                        )}
                        {isTechDrop && !isTech3D && (
                            <div className="absolute inset-0 pointer-events-none z-0">
                                <div className="absolute inset-0 grid-bg opacity-10" />
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                            </div>
                        )}
                        {/* Header Fixed */}
                        <div className={cn(
                            "shrink-0 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between z-20",
                            isTech3D
                                ? "bg-black/40 border-cyan-500/15"
                                : "bg-slate-950/95 border-white/10"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                                    isTech3D
                                        ? "shadow-cyan-500/30"
                                        : isTechDrop
                                            ? "bg-cyan-500 shadow-cyan-500/20"
                                            : "bg-orange-500 shadow-orange-500/20"
                                )}
                                style={isTech3D ? {
                                    background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                                    boxShadow: "0 0 20px rgba(6,182,212,0.4)"
                                } : undefined}
                                >
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className={cn(
                                        "text-lg font-bold text-white uppercase tracking-tight",
                                        isTech3D && "font-black tracking-tighter"
                                    )}>Tu Carrito</h2>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{shop?.name}</p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Cerrar carrito" className={cn(
                                "p-2 rounded-xl transition-colors",
                                isTech3D
                                    ? "bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/10"
                                    : "rounded-full bg-white/5 hover:bg-white/10"
                            )}>
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Scrollable Area */}
                        <div 
                            onWheel={(e) => e.stopPropagation()} 
                            onTouchMove={(e) => e.stopPropagation()} 
                            className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar overscroll-contain"
                        >
                            {/* Products */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Productos en carrito</h3>
                                {products.length === 0 ? (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500">Tu carrito está vacío</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {products.map((item: any, idx) => (
                                            <div key={idx} className={cn(
                                                "p-4 rounded-2xl border flex items-center gap-4 transition-colors",
                                                isTech3D
                                                    ? "bg-white/[0.04] border-white/8 hover:border-cyan-500/25"
                                                    : "bg-white/5 border-white/10"
                                            )}>
                                                <div className={cn(
                                                    "w-14 h-14 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0",
                                                    isTech3D && "border border-white/10"
                                                )}>
                                                    {item.image ? <img src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5 text-slate-700 m-auto" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold truncate text-sm">{item.name}</p>
                                                    {item.variantName && (
                                                        <p className="text-cyan-400/70 text-[10px] font-mono truncate">{item.variantName}</p>
                                                    )}
                                                    <p className={cn(
                                                        "font-bold text-xs mt-1",
                                                        isTech3D ? "text-cyan-400 font-mono" : isTechDrop ? "text-cyan-400" : "text-orange-400"
                                                    )}>x{item.quantity} — ${(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "font-black text-lg",
                                                        isTech3D
                                                            ? "bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400"
                                                            : "text-white"
                                                    )}>${(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Delivery Info */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Información de entrega</h3>
                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <label htmlFor="customerName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                                        <input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej. Juan Pérez" autoComplete="name" className={cn(
                                            "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors",
                                            isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="customerPhone" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
                                            <input id="customerPhone" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+58 412..." autoComplete="tel" className={cn(
                                                "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors",
                                                isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                            )} />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="customerEmail" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                            <input id="customerEmail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="juan@email.com" autoComplete="email" className={cn(
                                                "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors",
                                                isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                            )} />
                                        </div>
                                    </div>

                                    {/* Selector Delivery/Pickup - FIXED COLORS */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Método de entrega</label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                            <button
                                                onClick={(e) => { e.preventDefault(); setDeliveryType("delivery"); }}
                                                className={cn("flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm", deliveryType === "delivery" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white")}
                                            >
                                                <Truck className="w-4 h-4" /> Delivery
                                            </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); setDeliveryType("pickup"); }}
                                                className={cn("flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm", deliveryType === "pickup" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white")}
                                            >
                                                <Store className="w-4 h-4" /> Recoger
                                            </button>
                                        </div>
                                    </div>

                                    {/* Address Field - FIXED Z-INDEX/CLICK */}
                                    {deliveryType === "delivery" && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <label htmlFor="customerAddress" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección de Envío</label>
                                            <div className="relative group">
                                                <textarea
                                                    id="customerAddress"
                                                    value={customerAddress}
                                                    onChange={e => setCustomerAddress(e.target.value)}
                                                    placeholder="Calle, Número, Referencia..."
                                                    autoComplete="street-address"
                                                    className={cn(
                                                        "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors min-h-[100px] pr-12",
                                                        isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                                    )}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleDetectLocation}
                                                    className={cn(
                                                        "absolute right-3 top-4 p-2.5 rounded-xl transition-all z-10",
                                                        isTechTheme ? "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white" : "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white"
                                                    )}
                                                >
                                                    <MapPin className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery Scheduling (for Meal Prep) */}
                                    {shop?.businessType === "meal_prep" && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Horario de Entrega</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="scheduledDate" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                                                    <input
                                                        id="scheduledDate"
                                                        type="date"
                                                        value={scheduledDate}
                                                        onChange={e => setScheduledDate(e.target.value)}
                                                        min={new Date().toISOString().split("T")[0]}
                                                        className={cn(
                                                            "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors",
                                                            isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label htmlFor="scheduledTime" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Horario</label>
                                                    <select
                                                        id="scheduledTime"
                                                        value={scheduledTime}
                                                        onChange={e => setScheduledTime(e.target.value)}
                                                        className={cn(
                                                            "w-full bg-white/5 border p-4 rounded-xl text-white outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-colors appearance-none",
                                                            isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                                        )}
                                                    >
                                                        <option value="" className="bg-slate-900">Seleccionar...</option>
                                                        <option value="08:00 - 12:00" className="bg-slate-900">Mañana (8am - 12pm)</option>
                                                        <option value="12:00 - 16:00" className="bg-slate-900">Tarde (12pm - 4pm)</option>
                                                        <option value="16:00 - 20:00" className="bg-slate-900">Noche (4pm - 8pm)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Timing - FIXED COLORS */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Forma de Pago</h3>
                                <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                                    <button
                                        onClick={(e) => { e.preventDefault(); setPaymentTiming("pay_on_delivery"); }}
                                        className={cn("flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm", paymentTiming === "pay_on_delivery" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white")}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Al Recibir
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setPaymentTiming("pay_now"); }}
                                        className={cn("flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm", paymentTiming === "pay_now" ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white")}
                                    >
                                        <CreditCard className="w-4 h-4" /> Pagar Ahora
                                    </button>
                                </div>

                                {paymentTiming === "pay_now" && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sube Comprobante</label>
                                        <label className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed bg-white/5 transition-all cursor-pointer",
                                            isTechTheme ? "border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/5" : "border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5"
                                        )}>
                                            {receiptPreview ? <img src={receiptPreview} alt="Vista previa del comprobante" width={320} height={160} className="max-h-40 rounded-lg shadow-2xl object-contain" /> : (
                                                <>
                                                    <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Toca para cargar foto</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleReceiptChange} className="hidden" />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer - FIXED NO ABSOLUTE OVERLAP */}
                        <div className={cn(
                            "shrink-0 p-6 border-t",
                            isTech3D ? "bg-black/50 border-cyan-500/15" : "bg-slate-900 border-white/10"
                        )}>
                            {!orderSuccess ? (
                                <div className="space-y-5">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">
                                                {requireUpfront ? "Monto a pagar hoy" : "Total a pagar"}
                                            </p>
                                            <p className="text-4xl font-black text-white leading-none">
                                                ${(requireUpfront ? upfrontAmount : totalPrice).toLocaleString()}
                                            </p>
                                            {requireUpfront && (
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">
                                                    Restante al recibir: ${remainingBalance.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Items</p>
                                            <p className="text-xl font-bold text-white">{products.length + services.length}</p>
                                        </div>
                                    </div>
                                    {formError && (
                                        <div role="alert" aria-live="polite" className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                            <span>{formError}</span>
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !hasItems}
                                        className={cn(
                                            "w-full py-9 rounded-2xl text-white font-black text-2xl shadow-2xl transition-all active:scale-95",
                                            isTech3D
                                                ? "hover:scale-[1.02] hover:opacity-90"
                                                : isTechDrop
                                                    ? "bg-cyan-500 shadow-cyan-500/20 hover:bg-cyan-400 hover:scale-[1.02]"
                                                    : "bg-gradient-to-r from-red-500 to-orange-500 shadow-orange-500/40 hover:scale-[1.02]"
                                        )}
                                        style={isTech3D ? {
                                            background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #7c3aed 100%)",
                                            boxShadow: "0 4px 30px rgba(6,182,212,0.4)"
                                        } : undefined}
                                    >
                                        {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : (
                                            <div className="flex items-center gap-4">
                                                <Check className="w-7 h-7 stroke-[3px]" />
                                                <span>Confirmar Pedido</span>
                                            </div>
                                        )}
                                    </Button>
                                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-40">
                                        Procesando pedido de forma segura y privada
                                    </p>
                                </div>
                            ) : (
                                <div className="py-4 space-y-5 animate-in zoom-in-95">
                                    {/* Header */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 shrink-0 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
                                            <Check className="w-7 h-7 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white">¡Pedido confirmado!</h3>
                                            <p className="text-slate-400 text-sm">Hola {customerName}, tu orden está registrada</p>
                                        </div>
                                    </div>

                                    {/* Order number — prominent */}
                                    <div className={cn(
                                        "p-4 rounded-2xl border text-center",
                                        isTech3D ? "bg-cyan-500/8 border-cyan-500/20" : "bg-white/5 border-white/10"
                                    )}>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Número de seguimiento</p>
                                        <p className={cn("text-2xl font-black tracking-wider", isTech3D ? "text-cyan-400" : "text-white")}>
                                            {orderSuccess!.number}
                                        </p>
                                        <p className="text-[10px] text-slate-600 mt-1">Guarda este número para consultar tu pedido</p>
                                    </div>

                                    {/* Order summary */}
                                    <div className="space-y-1.5">
                                        {products.map(p => (
                                            <div key={p.id} className="flex justify-between text-sm">
                                                <span className="text-slate-400">{p.name} {p.variantName ? `(${p.variantName})` : ""} <span className="text-slate-600">×{p.quantity}</span></span>
                                                <span className="text-white font-bold">${(p.price * p.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-base font-black pt-2 border-t border-white/8">
                                            <span className="text-white">Total</span>
                                            <span className={isTech3D ? "text-cyan-400" : "text-white"}>${totalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* WhatsApp confirmation */}
                                    {whatsappConfirmUrl ? (
                                        <a
                                            href={whatsappConfirmUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bc5a] text-white font-black text-sm transition-all active:scale-95"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                            Guardar confirmación en WhatsApp
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-green-400/80 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                                            <Check className="w-4 h-4 shrink-0" />
                                            Confirmación enviada a tu WhatsApp
                                        </div>
                                    )}

                                    <Button onClick={onClose} className="w-full text-black bg-white hover:bg-white/90 rounded-2xl py-4 font-black text-base transition-all active:scale-95">
                                        Listo
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

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
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    // Manual Payment States
    const [paymentTiming, setPaymentTiming] = useState<"pay_now" | "pay_on_delivery">("pay_now"); // Defaulted to now for better testing
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<ManualPaymentMethod | null>(null);
    const { config: manualPaymentConfig } = useManualPaymentConfig(shop?.id || shop?.slug);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

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
        if (!customerName || !customerPhone || !customerEmail || (deliveryType === "delivery" && !customerAddress)) {
            alert("Por favor completa todos tus datos");
            return;
        }
        setIsSubmitting(true);
        try {
            let receiptUrl = "";
            if (receiptFile && paymentTiming === "pay_now") {
                const storageRef = ref(storage, `receipts/${shop?.id || 'default'}/${Date.now()}`);
                await uploadBytes(storageRef, receiptFile);
                receiptUrl = await getDownloadURL(storageRef);
            }

            // Generate order number
            const date = new Date();
            const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const orderNum = `ORD-${datePart}-${random}`;

            const shopId = shop?.id || "";
            const orderItems = products.map(p => ({
                id: p.id,
                name: p.name + (p.variantName ? ` (${p.variantName})` : ""),
                price: p.price,
                quantity: p.quantity,
                image: p.image || "",
            }));

            // Write to Firestore so admin panel can see the order
            if (shopId) {
                await addDoc(collection(db, "shops", shopId, "orders"), {
                    orderNumber: orderNum,
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress: deliveryType === "delivery" ? customerAddress : "",
                    items: orderItems,
                    subtotal: totalPrice,
                    tax: 0,
                    total: totalPrice,
                    status: "pending",
                    paymentStatus: paymentTiming === "pay_now" ? "paid" : "pending",
                    paymentMethod: paymentTiming,
                    source: "storefront",
                    orderType: deliveryType === "delivery" ? "delivery" : "takeout",
                    receiptUrl: receiptUrl || null,
                    notes: "",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }

            // Phase: Stock Decrement (Real-time sync)
            products.forEach(p => {
                decrementStock(p.id, p.quantity);
            });

            setOrderSuccess({ id: "order-" + Date.now(), number: orderNum });
            clearCart();
        } catch (e) {
            console.error(e);
            alert("Error al procesar el pedido");
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
                            <button onClick={onClose} className={cn(
                                "p-2 rounded-xl transition-colors",
                                isTech3D
                                    ? "bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-white/10"
                                    : "rounded-full bg-white/5 hover:bg-white/10"
                            )}>
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar overscroll-contain">
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
                                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5 text-slate-700 m-auto" />}
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                                        <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej. Juan Pérez" className={cn(
                                            "w-full bg-white/5 border p-4 rounded-xl text-white outline-none transition-all",
                                            isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
                                            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+58 412..." className={cn(
                                                "w-full bg-white/5 border p-4 rounded-xl text-white outline-none transition-all",
                                                isTechTheme ? "border-cyan-500/20 focus:border-cyan-500" : "border-white/10 focus:border-orange-500"
                                            )} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                            <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="juan@email.com" className={cn(
                                                "w-full bg-white/5 border p-4 rounded-xl text-white outline-none transition-all",
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección de Envío</label>
                                            <div className="relative group">
                                                <textarea
                                                    value={customerAddress}
                                                    onChange={e => setCustomerAddress(e.target.value)}
                                                    placeholder="Calle, Número, Referencia..."
                                                    className={cn(
                                                        "w-full bg-white/5 border p-4 rounded-xl text-white outline-none transition-all min-h-[100px] pr-12",
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
                                            {receiptPreview ? <img src={receiptPreview} className="max-h-40 rounded-lg shadow-2xl" /> : (
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
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Total a pagar</p>
                                            <p className="text-4xl font-black text-white leading-none">${totalPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Items</p>
                                            <p className="text-xl font-bold text-white">{products.length + services.length}</p>
                                        </div>
                                    </div>
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
                                <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                        <Check className="w-10 h-10 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">¡Gracias por tu compra!</h3>
                                        <p className="text-slate-400 mt-2 font-medium">Orden registrada: <span className={cn("font-bold", isTech3D ? "text-cyan-400" : "text-orange-400")}>#{orderSuccess.number}</span></p>
                                    </div>
                                    <Button onClick={onClose} className={cn(
                                        "w-full text-white rounded-2xl py-6 font-black text-xl transition-all",
                                        isTech3D ? "hover:opacity-90" : "bg-orange-500 hover:bg-orange-600"
                                    )}
                                    style={isTech3D ? {
                                        background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
                                        boxShadow: "0 4px 20px rgba(6,182,212,0.3)"
                                    } : undefined}
                                    >
                                        Cerrar Carrito
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

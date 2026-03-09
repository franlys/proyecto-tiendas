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
import { useCart, useShop, useOrders, useShopConfig } from "@/components/shared";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui";
import { useManualPaymentConfig } from "@/lib/hooks";
import { StripePayButton } from "@/components/shop/stripe-checkout-button";
import { PayPalPayButton } from "@/components/shop/paypal-checkout-button";
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
    const [paymentTiming, setPaymentTiming] = useState<"pay_now" | "pay_on_delivery">("pay_on_delivery");
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

    const handleDetectLocation = () => {
        if (!navigator.geolocation) return;
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCustomerAddress(`${latitude}, ${longitude}`);
                setIsDetectingLocation(false);
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
            const orderNum = Math.floor(1000 + Math.random() * 9000).toString();
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
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="relative flex flex-col w-full sm:max-w-xl max-h-[94vh] sm:max-h-[85vh] bg-slate-900 border border-white/10 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Premium Header like AppointmentModal */}
                        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/20">
                                    <ShoppingBag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">Tu Carrito</h2>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{shop?.name || "Tienda"}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                            {/* Items Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Productos en carrito</h3>
                                {products.length === 0 ? (
                                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-400">Tu carrito está vacío</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {products.map((item: any, idx) => (
                                            <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 group">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                                                    {item.image ? (
                                                        <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-6 h-6 text-slate-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold truncate">{item.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-slate-400 text-sm">x{item.quantity}</span>
                                                        <span className="text-primary font-bold text-sm">
                                                            ${((item.promoPrice || item.price) + (item.extrasTotal || 0)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-black text-lg">
                                                        ${(((item.promoPrice || item.price) + (item.extrasTotal || 0)) * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Customer Form Section */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Información de entrega</h3>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre Completo</label>
                                        <input
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">WhatsApp</label>
                                            <input
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                                placeholder="+58 412..."
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                            <input
                                                value={customerEmail}
                                                onChange={e => setCustomerEmail(e.target.value)}
                                                placeholder="juan@email.com"
                                                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Método de entrega</label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                                            <button
                                                onClick={() => setDeliveryType("delivery")}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                                    deliveryType === "delivery" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                <Truck className="w-4 h-4" /> Delivery
                                            </button>
                                            <button
                                                onClick={() => setDeliveryType("pickup")}
                                                className={cn(
                                                    "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                                    deliveryType === "pickup" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                <Store className="w-4 h-4" /> Recoger
                                            </button>
                                        </div>
                                    </div>
                                    {deliveryType === "delivery" && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dirección de Envío</label>
                                            <div className="relative">
                                                <textarea
                                                    value={customerAddress}
                                                    onChange={e => setCustomerAddress(e.target.value)}
                                                    placeholder="Calle, Número, Referencia..."
                                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-primary transition-all placeholder:text-slate-600 min-h-[100px] resize-none pr-12"
                                                />
                                                <button
                                                    onClick={handleDetectLocation}
                                                    className={cn(
                                                        "absolute right-3 top-4 p-2 rounded-lg transition-colors",
                                                        isDetectingLocation ? "text-primary animate-pulse" : "text-slate-500 hover:text-primary"
                                                    )}
                                                >
                                                    <MapPin className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Timing - Restoring */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Forma de Pago</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                                    <button
                                        onClick={() => setPaymentTiming("pay_on_delivery")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                            paymentTiming === "pay_on_delivery" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        <Check className="w-4 h-4" /> Pago al Recibir
                                    </button>
                                    <button
                                        onClick={() => setPaymentTiming("pay_now")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                            paymentTiming === "pay_now" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        <CreditCard className="w-4 h-4" /> Pagar Ahora
                                    </button>
                                </div>

                                {/* Receipt Upload if Pay Now is selected */}
                                {paymentTiming === "pay_now" && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Subir Comprobante</label>
                                            <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                                                {receiptPreview ? (
                                                    <img src={receiptPreview} className="max-h-40 rounded-lg object-contain shadow-2xl" />
                                                ) : (
                                                    <>
                                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">Toca para cargar comprobante</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" onChange={handleReceiptChange} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-6 z-30">
                            {!orderSuccess ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total a pagar</p>
                                            <p className="text-3xl font-black text-white mt-1">${totalPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Items</p>
                                            <p className="text-xl font-bold text-white mt-1">{products.length + services.length}</p>
                                        </div>
                                    </div>

                                    {/* Stripe / PayPal buttons if enabled and timing is pay_now */}
                                    {paymentTiming === "pay_now" && (
                                        <div className="space-y-3">
                                            {stripeEnabled && (
                                                <StripePayButton
                                                    shopId={shop?.id || shop?.slug || ""}
                                                    orderId={orderId}
                                                    items={stripeItems}
                                                    customerEmail={customerEmail}
                                                    customerName={customerName}
                                                    currency={currency}
                                                    disabled={!customerName || !customerPhone || !customerEmail}
                                                />
                                            )}
                                            {paypalEnabled && (
                                                <PayPalPayButton
                                                    shopId={shop?.id || shop?.slug || ""}
                                                    orderId={orderId}
                                                    items={stripeItems}
                                                    currency={currency}
                                                    disabled={!customerName || !customerPhone || !customerEmail}
                                                />
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !hasItems}
                                        className="w-full py-8 rounded-2xl font-black text-xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                <span>Confirmar Pedido</span>
                                            </>
                                        )}
                                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    </Button>
                                    <p className="text-center text-[10px] text-slate-500 uppercase tracking-tighter opacity-50">
                                        Tu pedido se enviará automáticamente a WhatsApp
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                        <Check className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">¡Pedido Confirmado!</h3>
                                        <p className="text-slate-400 text-sm mt-1">Número de orden: <span className="text-primary font-bold">#{orderSuccess.number}</span></p>
                                    </div>
                                    <Button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white rounded-2xl py-6 font-bold">
                                        Entendido
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

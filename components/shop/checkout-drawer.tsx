"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Truck, Store, Loader2, Check } from "lucide-react";
import { useCart, useShop } from "@/components/shared";
import { Button } from "@/components/ui";

interface CheckoutDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
    const { products, totalPrice, clearCart } = useCart();
    const shop = useShop();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ number: string } | null>(null);

    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setOrderSuccess({ number: "001" });
            clearCart();
            setIsSubmitting(false);
        }, 1000);
    };

    if (!isOpen && !orderSuccess) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative flex flex-col w-full sm:max-w-xl bg-slate-900 border border-white/10 rounded-t-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white uppercase">Tu Carrito</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {products.map((item, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between">
                                    <span className="text-white font-bold">{item.name} x{item.quantity}</span>
                                    <span className="text-white font-black">${item.price}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-white/10 bg-slate-900">
                            {!orderSuccess ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-xs">Total</span>
                                        <span className="text-2xl font-black text-white">${totalPrice}</span>
                                    </div>
                                    <Button onClick={handleSubmit} disabled={isSubmitting || products.length === 0} className="w-full py-6 rounded-xl bg-primary text-white font-bold">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Pedido"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-4 space-y-4">
                                    <h3 className="text-xl font-bold text-white">Pedido Confirmado</h3>
                                    <Button onClick={onClose} className="w-full bg-white/10 text-white rounded-xl py-3">Cerrar</Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

"use client";

import { useState } from "react";
import { CreditCard, Loader2, Apple, Wallet, Lock } from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/types/payment.types";

interface StripeCheckoutButtonProps {
    shopId: string;
    orderId: string;
    items: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        image?: string;
    }>;
    deliveryFee?: number;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    currency?: Currency;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
}

export function StripeCheckoutButton({
    shopId,
    orderId,
    items,
    deliveryFee = 0,
    customerEmail,
    customerName,
    customerPhone,
    currency = "USD",
    onSuccess,
    onError,
    disabled = false,
    className = "",
}: StripeCheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + deliveryFee;

    const handleCheckout = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);

        try {
            const successUrl = `${window.location.origin}/${shopId}/order-success`;
            const cancelUrl = `${window.location.origin}/${shopId}/checkout`;

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    orderId,
                    items,
                    deliveryFee,
                    customerEmail,
                    customerName,
                    customerPhone,
                    successUrl,
                    cancelUrl,
                }),
            });

            const data = await response.json();

            if (data.error) {
                onError?.(data.error);
                return;
            }

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
                onSuccess?.();
            }
        } catch (error) {
            console.error("Checkout error:", error);
            onError?.("Error al procesar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Payment Summary */}
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-white">{formatCurrency(subtotal, currency)}</span>
                </div>
                {deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Envío</span>
                        <span className="text-white">{formatCurrency(deliveryFee, currency)}</span>
                    </div>
                )}
                <div className="pt-2 border-t border-zinc-800 flex justify-between">
                    <span className="text-white font-medium">Total</span>
                    <span className="text-lg font-bold text-emerald-400">
                        {formatCurrency(total, currency)}
                    </span>
                </div>
            </div>

            {/* Checkout Button */}
            <button
                onClick={handleCheckout}
                disabled={disabled || isLoading}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                    disabled || isLoading
                        ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                }`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Pagar {formatCurrency(total, currency)}
                    </>
                )}
            </button>

            {/* Payment Methods */}
            <div className="flex items-center justify-center gap-4 text-zinc-500">
                <div className="flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Tarjeta</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <Apple className="w-4 h-4" />
                    <span>Apple Pay</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                    <Wallet className="w-4 h-4" />
                    <span>Google Pay</span>
                </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Lock className="w-3 h-3" />
                <span>Pago seguro procesado por Stripe</span>
            </div>
        </div>
    );
}

/**
 * Simpler inline checkout button (just the button, no summary)
 */
export function StripePayButton({
    shopId,
    orderId,
    items,
    deliveryFee = 0,
    customerEmail,
    customerName,
    currency = "USD",
    onError,
    disabled = false,
    children,
}: Omit<StripeCheckoutButtonProps, "onSuccess" | "className"> & {
    children?: React.ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) + deliveryFee;

    const handleCheckout = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);

        try {
            const successUrl = `${window.location.origin}/${shopId}/order-success`;
            const cancelUrl = `${window.location.origin}/${shopId}`;

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    orderId,
                    items,
                    deliveryFee,
                    customerEmail,
                    customerName,
                    successUrl,
                    cancelUrl,
                }),
            });

            const data = await response.json();

            if (data.error) {
                onError?.(data.error);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            onError?.("Error al procesar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={disabled || isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none"
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                </>
            ) : (
                children || (
                    <>
                        <CreditCard className="w-4 h-4" />
                        Pagar {formatCurrency(total, currency)}
                    </>
                )
            )}
        </button>
    );
}

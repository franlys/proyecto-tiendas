"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/types/payment.types";

declare global {
    interface Window {
        paypal?: any;
    }
}

interface PayPalCheckoutButtonProps {
    shopId: string;
    orderId: string;
    items: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
    }>;
    deliveryFee?: number;
    currency?: Currency;
    onSuccess?: (details: any) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
    disabled?: boolean;
    className?: string;
}

export function PayPalCheckoutButton({
    shopId,
    orderId,
    items,
    deliveryFee = 0,
    currency = "USD",
    onSuccess,
    onError,
    onCancel,
    disabled = false,
    className = "",
}: PayPalCheckoutButtonProps) {
    const paypalRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const total = subtotal + deliveryFee;

    // Load PayPal SDK
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

        if (!clientId) {
            setError("PayPal no está configurado");
            setIsLoading(false);
            return;
        }

        // Check if already loaded
        if (window.paypal) {
            setSdkLoaded(true);
            setIsLoading(false);
            return;
        }

        // Load the script
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
        script.async = true;

        script.onload = () => {
            setSdkLoaded(true);
            setIsLoading(false);
        };

        script.onerror = () => {
            setError("Error al cargar PayPal");
            setIsLoading(false);
        };

        document.body.appendChild(script);

        return () => {
            // Don't remove script as it might be used by other components
        };
    }, [currency]);

    // Render PayPal buttons
    useEffect(() => {
        if (!sdkLoaded || !window.paypal || !paypalRef.current || disabled) {
            return;
        }

        // Clear previous buttons
        paypalRef.current.innerHTML = "";

        window.paypal
            .Buttons({
                style: {
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 50,
                },

                // Create order on PayPal
                createOrder: async () => {
                    setIsProcessing(true);
                    setError(null);

                    try {
                        const response = await fetch("/api/paypal/create-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                shopId,
                                orderId,
                                items,
                                deliveryFee,
                            }),
                        });

                        const data = await response.json();

                        if (data.error) {
                            throw new Error(data.error);
                        }

                        return data.orderId;
                    } catch (err: any) {
                        setError(err.message || "Error al crear la orden");
                        setIsProcessing(false);
                        throw err;
                    }
                },

                // Capture payment when approved
                onApprove: async (data: any) => {
                    try {
                        const response = await fetch("/api/paypal/capture-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                paypalOrderId: data.orderID,
                                shopId,
                            }),
                        });

                        const captureData = await response.json();

                        if (captureData.error) {
                            throw new Error(captureData.error);
                        }

                        setIsProcessing(false);
                        onSuccess?.(captureData);

                        // Redirect to success page
                        window.location.href = `/${shopId}/order-success?orderId=${orderId}`;
                    } catch (err: any) {
                        setError(err.message || "Error al procesar el pago");
                        setIsProcessing(false);
                        onError?.(err.message);
                    }
                },

                onCancel: () => {
                    setIsProcessing(false);
                    onCancel?.();
                },

                onError: (err: any) => {
                    console.error("PayPal error:", err);
                    setError("Error en PayPal. Por favor intenta de nuevo.");
                    setIsProcessing(false);
                    onError?.(err.message);
                },
            })
            .render(paypalRef.current);
    }, [sdkLoaded, disabled, shopId, orderId, items, deliveryFee, onSuccess, onError, onCancel]);

    if (error && !isLoading) {
        return (
            <div className={`p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center ${className}`}>
                {error}
            </div>
        );
    }

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
                    <span className="text-lg font-bold text-amber-400">
                        {formatCurrency(total, currency)}
                    </span>
                </div>
            </div>

            {/* PayPal Button Container */}
            <div className="relative">
                {(isLoading || isProcessing) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    </div>
                )}
                <div
                    ref={paypalRef}
                    className={`min-h-[50px] ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                />
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
                <span>Pago seguro procesado por PayPal</span>
            </div>
        </div>
    );
}

/**
 * Simple PayPal pay button (inline, no summary)
 */
export function PayPalPayButton({
    shopId,
    orderId,
    items,
    deliveryFee = 0,
    currency = "USD",
    onSuccess,
    onError,
    disabled = false,
    className = "",
}: Omit<PayPalCheckoutButtonProps, "onCancel">) {
    const paypalRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    // Load PayPal SDK
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId || window.paypal) {
            setSdkLoaded(!!window.paypal);
            setIsLoading(false);
            return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
        script.async = true;
        script.onload = () => {
            setSdkLoaded(true);
            setIsLoading(false);
        };
        script.onerror = () => setIsLoading(false);
        document.body.appendChild(script);
    }, [currency]);

    // Render button
    useEffect(() => {
        if (!sdkLoaded || !window.paypal || !paypalRef.current || disabled) return;

        paypalRef.current.innerHTML = "";

        window.paypal
            .Buttons({
                style: {
                    layout: "horizontal",
                    color: "gold",
                    shape: "rect",
                    label: "pay",
                    height: 45,
                    tagline: false,
                },
                createOrder: async () => {
                    const response = await fetch("/api/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ shopId, orderId, items, deliveryFee }),
                    });
                    const data = await response.json();
                    if (data.error) throw new Error(data.error);
                    return data.orderId;
                },
                onApprove: async (data: any) => {
                    const response = await fetch("/api/paypal/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paypalOrderId: data.orderID, shopId }),
                    });
                    const captureData = await response.json();
                    if (captureData.error) throw new Error(captureData.error);
                    onSuccess?.(captureData);
                    window.location.href = `/${shopId}/order-success?orderId=${orderId}`;
                },
                onError: (err: any) => onError?.(err.message),
            })
            .render(paypalRef.current);
    }, [sdkLoaded, disabled, shopId, orderId, items, deliveryFee, onSuccess, onError]);

    if (isLoading) {
        return (
            <div className={`h-[45px] bg-zinc-800 rounded-lg animate-pulse ${className}`} />
        );
    }

    return <div ref={paypalRef} className={className} />;
}

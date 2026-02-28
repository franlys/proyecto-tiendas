"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Loader2,
    Apple,
    Wallet,
    DollarSign,
    RefreshCw,
    Shield,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import type {
    ShopPaymentConfig,
    PaymentMethod,
    Currency,
    StripeCountry,
} from "@/lib/types/payment.types";
import { PAYMENT_METHOD_LABELS, STRIPE_COUNTRY_LABELS, STRIPE_COUNTRY_DEFAULT_CURRENCY } from "@/lib/types/payment.types";

interface PaymentSettingsProps {
    shopId: string;
    shopName: string;
    ownerEmail: string;
    currentConfig?: ShopPaymentConfig;
    onConfigChange?: (config: ShopPaymentConfig) => void;
}

export function PaymentSettings({
    shopId,
    shopName,
    ownerEmail,
    currentConfig,
    onConfigChange,
}: PaymentSettingsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<ShopPaymentConfig | null>(
        currentConfig || null
    );
    const [selectedCountry, setSelectedCountry] = useState<StripeCountry>(
        currentConfig?.stripeCountry || "DO" // Default to Dominican Republic
    );

    // Check account status on mount
    useEffect(() => {
        if (config?.stripeAccountId) {
            refreshAccountStatus();
        }
    }, []);

    const refreshAccountStatus = async () => {
        setIsRefreshing(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/stripe/connect?shopId=${shopId}`
            );
            const data = await response.json();

            if (data.connected) {
                const updatedConfig: ShopPaymentConfig = {
                    ...config!,
                    enabled: data.chargesEnabled,
                    stripeOnboardingComplete: data.onboardingComplete,
                    stripeDetailsSubmitted: data.detailsSubmitted,
                    stripeChargesEnabled: data.chargesEnabled,
                    stripePayoutsEnabled: data.payoutsEnabled,
                    stripeAccountStatus: data.status,
                };
                setConfig(updatedConfig);
                onConfigChange?.(updatedConfig);
            }
        } catch (err) {
            console.error("Error refreshing status:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const startStripeOnboarding = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const returnUrl = `${window.location.origin}/agency/shop/${shopId}?tab=config&stripe=success`;
            const refreshUrl = `${window.location.origin}/agency/shop/${shopId}?tab=config&stripe=refresh`;

            const response = await fetch("/api/stripe/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    email: ownerEmail,
                    shopName,
                    country: selectedCountry, // Send selected country
                    returnUrl,
                    refreshUrl,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            // Redirect to Stripe onboarding
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            setError("Error al conectar con Stripe");
            console.error(err);
        } finally {
            setIsConnecting(false);
        }
    };

    const togglePaymentMethod = (method: PaymentMethod) => {
        if (!config) return;

        const methods = config.methods.includes(method)
            ? config.methods.filter((m) => m !== method)
            : [...config.methods, method];

        const updatedConfig = { ...config, methods };
        setConfig(updatedConfig);
        onConfigChange?.(updatedConfig);
    };

    const togglePaymentsEnabled = () => {
        if (!config?.stripeChargesEnabled) return;

        const updatedConfig = { ...config, enabled: !config.enabled };
        setConfig(updatedConfig);
        onConfigChange?.(updatedConfig);
    };

    const setCurrency = (currency: Currency) => {
        if (!config) return;

        const updatedConfig = { ...config, currency };
        setConfig(updatedConfig);
        onConfigChange?.(updatedConfig);
    };

    // Not connected state
    if (!config?.stripeAccountId) {
        return (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Acepta Pagos en Línea
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Conecta tu cuenta de Stripe para aceptar pagos con tarjeta,
                            Apple Pay y Google Pay. Los pagos van directamente a tu cuenta.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <CreditCard className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-slate-300">Tarjetas</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <Apple className="w-4 h-4 text-white" />
                                <span className="text-sm text-slate-300">Apple Pay</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                                <Wallet className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-slate-300">Google Pay</span>
                            </div>
                        </div>

                        {/* Country Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                País de tu negocio
                            </label>
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value as StripeCountry)}
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                {(Object.keys(STRIPE_COUNTRY_LABELS) as StripeCountry[]).map((code) => (
                                    <option key={code} value={code}>
                                        {STRIPE_COUNTRY_LABELS[code]}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                                Stripe te pedirá verificar tu identidad con documentos de este país
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={startStripeOnboarding}
                            disabled={isConnecting}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Conectar Stripe
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-slate-500 mt-3">
                            <Shield className="w-3 h-3 inline mr-1" />
                            Proceso seguro. No almacenamos datos de tarjetas.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Pending onboarding state
    if (!config.stripeChargesEnabled) {
        return (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Completa la Configuración de Stripe
                        </h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Tu cuenta está conectada pero necesitas completar la
                            verificación para poder recibir pagos.
                        </p>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                                {config.stripeDetailsSubmitted ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                                )}
                                <span className="text-sm text-slate-300">
                                    Información enviada
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {config.stripeChargesEnabled ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                                )}
                                <span className="text-sm text-slate-300">
                                    Pagos habilitados
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={startStripeOnboarding}
                                disabled={isConnecting}
                                className="bg-amber-500 hover:bg-amber-400"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                )}
                                Completar Verificación
                            </Button>

                            <Button
                                onClick={refreshAccountStatus}
                                disabled={isRefreshing}
                                variant="outline"
                                className="border-amber-500/30 text-amber-400"
                            >
                                {isRefreshing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fully connected state
    return (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                Stripe Conectado
                            </h3>
                            <p className="text-sm text-slate-400">
                                Tu cuenta está lista para recibir pagos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={refreshAccountStatus}
                            disabled={isRefreshing}
                            variant="ghost"
                            size="sm"
                        >
                            {isRefreshing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </Button>

                        <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                            Dashboard
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-medium">Pagos en Línea</h4>
                        <p className="text-sm text-slate-400">
                            {config.enabled
                                ? "Los clientes pueden pagar en línea"
                                : "Los clientes solo pueden pagar en persona"}
                        </p>
                    </div>
                    <button
                        onClick={togglePaymentsEnabled}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                            config.enabled ? "bg-green-500" : "bg-zinc-700"
                        }`}
                    >
                        <div
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                config.enabled ? "left-8" : "left-1"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {config.enabled && (
                <>
                    {/* Payment Methods */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                        <h4 className="text-white font-medium">Métodos de Pago</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(["card", "apple_pay", "google_pay"] as PaymentMethod[]).map(
                                (method) => (
                                    <button
                                        key={method}
                                        onClick={() => togglePaymentMethod(method)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                            config.methods.includes(method)
                                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                        }`}
                                    >
                                        {method === "card" && <CreditCard className="w-5 h-5" />}
                                        {method === "apple_pay" && <Apple className="w-5 h-5" />}
                                        {method === "google_pay" && <Wallet className="w-5 h-5" />}
                                        <span className="text-sm">
                                            {PAYMENT_METHOD_LABELS[method]}
                                        </span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Currency */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                        <h4 className="text-white font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Moneda
                        </h4>

                        <div className="flex gap-2">
                            {(["USD", "MXN", "DOP"] as Currency[]).map((currency) => (
                                <button
                                    key={currency}
                                    onClick={() => setCurrency(currency)}
                                    className={`px-4 py-2 rounded-lg border transition-all ${
                                        config.currency === currency
                                            ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                    }`}
                                >
                                    {currency}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

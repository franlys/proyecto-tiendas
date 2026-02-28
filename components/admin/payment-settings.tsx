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
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui";
import type {
    ShopPaymentConfig,
    PaymentMethod,
    Currency,
    PaymentProvider,
    StripeCountry,
} from "@/lib/types/payment.types";
import { PAYMENT_METHOD_LABELS, STRIPE_COUNTRY_LABELS } from "@/lib/types/payment.types";

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [config, setConfig] = useState<ShopPaymentConfig | null>(
        currentConfig || null
    );

    // PayPal specific state
    const [paypalEmail, setPaypalEmail] = useState(currentConfig?.paypalEmail || ownerEmail);

    // Stripe specific state
    const [selectedCountry, setSelectedCountry] = useState<StripeCountry>(
        currentConfig?.stripeCountry || "US"
    );

    // Provider selection (only shown when not configured)
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(
        currentConfig?.provider || "paypal"
    );

    // Check if already configured
    const isPayPalConfigured = config?.provider === "paypal" && config?.paypalEmail;
    const isStripeConfigured = config?.provider === "stripe" && config?.stripeAccountId;
    const isConfigured = isPayPalConfigured || isStripeConfigured;

    // Stripe status check
    useEffect(() => {
        if (config?.stripeAccountId && config?.provider === "stripe") {
            refreshStripeStatus();
        }
    }, []);

    const refreshStripeStatus = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`/api/stripe/connect?shopId=${shopId}`);
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

    // Configure PayPal (simple - just save the email)
    const configurePayPal = async () => {
        if (!paypalEmail || !paypalEmail.includes("@")) {
            setError("Por favor ingresa un email de PayPal válido");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const newConfig: ShopPaymentConfig = {
                enabled: true,
                provider: "paypal",
                paypalEmail: paypalEmail,
                paypalOnboardingComplete: true,
                methods: ["paypal", "card"],
                currency: "USD",
            };

            setConfig(newConfig);
            onConfigChange?.(newConfig);
            setSuccessMessage("PayPal configurado correctamente");

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError("Error al configurar PayPal");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Start Stripe onboarding
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
                    country: selectedCountry,
                    returnUrl,
                    refreshUrl,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

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

    const togglePaymentsEnabled = () => {
        if (!config) return;
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

    const resetConfig = () => {
        setConfig(null);
        onConfigChange?.({
            enabled: false,
            provider: "none",
            methods: [],
            currency: "USD",
        });
    };

    // =====================
    // NOT CONFIGURED STATE
    // =====================
    if (!isConfigured) {
        return (
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Acepta Pagos en Línea
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">
                                Configura un método de pago para que tus clientes puedan pagar directamente.
                            </p>

                            {/* Provider Selection */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => setSelectedProvider("paypal")}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        selectedProvider === "paypal"
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">PP</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">PayPal</h4>
                                            <span className="text-xs text-green-400">Recomendado</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Solo necesitas tu email de PayPal. Funciona globalmente.
                                    </p>
                                </button>

                                <button
                                    onClick={() => setSelectedProvider("stripe")}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                                        selectedProvider === "stripe"
                                            ? "border-purple-500 bg-purple-500/10"
                                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">S</span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">Stripe</h4>
                                            <span className="text-xs text-slate-400">Avanzado</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Requiere verificación. Solo países soportados.
                                    </p>
                                </button>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {/* PayPal Configuration */}
                            {selectedProvider === "paypal" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Mail className="w-4 h-4 inline mr-2" />
                                            Email de PayPal
                                        </label>
                                        <input
                                            type="email"
                                            value={paypalEmail}
                                            onChange={(e) => setPaypalEmail(e.target.value)}
                                            placeholder="tu-email@paypal.com"
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Los pagos se enviarán a esta cuenta de PayPal
                                        </p>
                                    </div>

                                    <Button
                                        onClick={configurePayPal}
                                        disabled={isLoading || !paypalEmail}
                                        className="w-full bg-[#003087] hover:bg-[#002060]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Configurando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Activar PayPal
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Stripe Configuration */}
                            {selectedProvider === "stripe" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            País del negocio
                                        </label>
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => setSelectedCountry(e.target.value as StripeCountry)}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        >
                                            {(Object.keys(STRIPE_COUNTRY_LABELS) as StripeCountry[]).map((code) => (
                                                <option key={code} value={code}>
                                                    {STRIPE_COUNTRY_LABELS[code]}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-amber-400 mt-1">
                                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                                            Stripe requiere verificación de identidad del país seleccionado
                                        </p>
                                    </div>

                                    <Button
                                        onClick={startStripeOnboarding}
                                        disabled={isConnecting}
                                        className="w-full bg-[#635BFF] hover:bg-[#5046E5]"
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
                                </div>
                            )}

                            <p className="text-xs text-slate-500 mt-4 text-center">
                                <Shield className="w-3 h-3 inline mr-1" />
                                Proceso seguro. No almacenamos datos de tarjetas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =====================
    // PAYPAL CONFIGURED
    // =====================
    if (isPayPalConfigured) {
        return (
            <div className="space-y-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        {successMessage}
                    </div>
                )}

                {/* Status Card */}
                <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#003087] flex items-center justify-center">
                                <span className="text-white font-bold">PP</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    PayPal Configurado
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {config.paypalEmail}
                                </p>
                            </div>
                        </div>

                        <a
                            href="https://www.paypal.com/businessmanage/account/aboutBusiness"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                            Dashboard
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-medium">Pagos en Línea</h4>
                            <p className="text-sm text-slate-400">
                                {config.enabled
                                    ? "Los clientes pueden pagar con PayPal"
                                    : "Los pagos están desactivados"}
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
                                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                }`}
                            >
                                {currency}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Change Provider */}
                <div className="pt-4 border-t border-zinc-800">
                    <button
                        onClick={resetConfig}
                        className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                    >
                        Cambiar proveedor de pagos
                    </button>
                </div>
            </div>
        );
    }

    // =====================
    // STRIPE CONFIGURED (Pending or Active)
    // =====================
    if (isStripeConfigured) {
        // Pending verification
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
                                Tu cuenta está conectada pero necesitas completar la verificación.
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                    {config.stripeDetailsSubmitted ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                                    )}
                                    <span className="text-sm text-slate-300">Información enviada</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {config.stripeChargesEnabled ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-amber-400" />
                                    )}
                                    <span className="text-sm text-slate-300">Pagos habilitados</span>
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
                                    onClick={refreshStripeStatus}
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

                            <div className="mt-4 pt-4 border-t border-amber-500/20">
                                <button
                                    onClick={resetConfig}
                                    className="text-sm text-slate-500 hover:text-slate-400"
                                >
                                    Usar PayPal en su lugar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Fully connected
        return (
            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#635BFF] flex items-center justify-center">
                                <span className="text-white font-bold">S</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Stripe Conectado</h3>
                                <p className="text-sm text-slate-400">Tu cuenta está lista para recibir pagos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={refreshStripeStatus}
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
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500 rounded-lg text-indigo-400">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-sm">Tarjetas</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500 rounded-lg text-indigo-400">
                                    <Apple className="w-4 h-4" />
                                    <span className="text-sm">Apple Pay</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500 rounded-lg text-indigo-400">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-sm">Google Pay</span>
                                </div>
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

    return null;
}

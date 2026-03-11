"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Shield,
    Mail,
    Plus,
    Trash2,
    QrCode,
    Link2,
    Building2,
    Smartphone,
    Bitcoin,
    DollarSign,
    Eye,
    EyeOff,
    Copy,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import type {
    ShopPaymentConfig,
    Currency,
    ManualPaymentMethod,
    ManualPaymentMethodType,
    ShopManualPaymentConfig,
} from "@/lib/types/payment.types";
import {
    MANUAL_PAYMENT_METHOD_LABELS,
    MANUAL_PAYMENT_METHOD_ICONS,
    DEFAULT_MANUAL_PAYMENT_CONFIG,
} from "@/lib/types/payment.types";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PaymentSettingsProps {
    shopId: string;
    shopName: string;
    ownerEmail: string;
    currentConfig?: ShopPaymentConfig;
    onConfigChange?: (config: ShopPaymentConfig) => void;
}

// Payment method type options for the selector
const PAYMENT_METHOD_OPTIONS: { type: ManualPaymentMethodType; label: string; icon: React.ReactNode; description: string }[] = [
    { type: "bank_transfer", label: "Cuenta Bancaria", icon: <Building2 className="w-5 h-5" />, description: "Transferencias y depósitos" },
    { type: "mobile_payment", label: "Pago Móvil", icon: <Smartphone className="w-5 h-5" />, description: "Pagos por teléfono" },
    { type: "zelle", label: "Zelle", icon: <DollarSign className="w-5 h-5" />, description: "Zelle / Venmo" },
    { type: "crypto", label: "Criptomonedas", icon: <Bitcoin className="w-5 h-5" />, description: "Bitcoin, USDT, etc." },
    { type: "paypal_manual", label: "PayPal Manual", icon: <Mail className="w-5 h-5" />, description: "Email de PayPal" },
    { type: "other", label: "Otro", icon: <CreditCard className="w-5 h-5" />, description: "Método personalizado" },
];

export function PaymentSettings({
    shopId,
    shopName,
    ownerEmail,
    currentConfig,
    onConfigChange,
}: PaymentSettingsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Manual payment config
    const [manualConfig, setManualConfig] = useState<ShopManualPaymentConfig>(DEFAULT_MANUAL_PAYMENT_CONFIG);

    // QR code state
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [paymentLinkUrl, setPaymentLinkUrl] = useState<string>("");

    // Add method modal
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [selectedMethodType, setSelectedMethodType] = useState<ManualPaymentMethodType | null>(null);
    const [editingMethod, setEditingMethod] = useState<ManualPaymentMethod | null>(null);

    // Method form fields
    const [methodName, setMethodName] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountType, setAccountType] = useState<"corriente" | "ahorro">("corriente");
    const [accountHolder, setAccountHolder] = useState("");
    const [identificationNumber, setIdentificationNumber] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [network, setNetwork] = useState("");
    const [instructions, setInstructions] = useState("");
    const [methodQrUrl, setMethodQrUrl] = useState("");

    // Load existing config
    useEffect(() => {
        loadConfig();
    }, [shopId]);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const configRef = doc(db, "shops", shopId, "settings", "payments");
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const data = configSnap.data() as ShopManualPaymentConfig;
                setManualConfig(data);

                // Load QR and link if stored
                if ((data as any).qrCodeUrl) setQrCodeUrl((data as any).qrCodeUrl);
                if ((data as any).paymentLinkUrl) setPaymentLinkUrl((data as any).paymentLinkUrl);
            }
        } catch (err) {
            console.error("Error loading payment config:", err);
            setError("Error al cargar la configuración");
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfig = async (newConfig: ShopManualPaymentConfig) => {
        setIsSaving(true);
        setError(null);
        try {
            const configRef = doc(db, "shops", shopId, "settings", "payments");
            await setDoc(configRef, {
                ...newConfig,
                qrCodeUrl,
                paymentLinkUrl,
                updatedAt: new Date().toISOString(),
            });

            setManualConfig(newConfig);
            setSuccessMessage("Configuración guardada");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error("Error saving config:", err);
            setError("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    const resetMethodForm = () => {
        setMethodName("");
        setBankName("");
        setAccountNumber("");
        setAccountType("corriente");
        setAccountHolder("");
        setIdentificationNumber("");
        setPhoneNumber("");
        setEmail("");
        setWalletAddress("");
        setNetwork("");
        setInstructions("");
        setMethodQrUrl("");
        setSelectedMethodType(null);
        setEditingMethod(null);
    };

    const handleAddMethod = () => {
        if (!selectedMethodType || !methodName) {
            setError("Por favor completa los campos requeridos");
            return;
        }

        const newMethod: ManualPaymentMethod = {
            id: editingMethod?.id || `method-${Date.now()}`,
            type: selectedMethodType,
            name: methodName,
            isActive: true,
            bankName: bankName || undefined,
            accountNumber: accountNumber || undefined,
            accountType: accountType || undefined,
            accountHolder: accountHolder || undefined,
            identificationNumber: identificationNumber || undefined,
            phoneNumber: phoneNumber || undefined,
            email: email || undefined,
            walletAddress: walletAddress || undefined,
            network: network || undefined,
            instructions: instructions || undefined,
            icon: methodQrUrl || undefined,
        };

        let updatedMethods: ManualPaymentMethod[];

        if (editingMethod) {
            // Update existing
            updatedMethods = manualConfig.paymentMethods.map(m =>
                m.id === editingMethod.id ? newMethod : m
            );
        } else {
            // Add new
            updatedMethods = [...manualConfig.paymentMethods, newMethod];
        }

        const updatedConfig: ShopManualPaymentConfig = {
            ...manualConfig,
            enabled: true,
            paymentMethods: updatedMethods,
        };

        saveConfig(updatedConfig);
        setShowAddMethod(false);
        resetMethodForm();
    };

    const handleEditMethod = (method: ManualPaymentMethod) => {
        setEditingMethod(method);
        setSelectedMethodType(method.type);
        setMethodName(method.name);
        setBankName(method.bankName || "");
        setAccountNumber(method.accountNumber || "");
        setAccountType(method.accountType || "corriente");
        setAccountHolder(method.accountHolder || "");
        setIdentificationNumber(method.identificationNumber || "");
        setPhoneNumber(method.phoneNumber || "");
        setEmail(method.email || "");
        setWalletAddress(method.walletAddress || "");
        setNetwork(method.network || "");
        setInstructions(method.instructions || "");
        setMethodQrUrl(method.icon || "");
        setShowAddMethod(true);
    };

    const handleDeleteMethod = (methodId: string) => {
        const updatedMethods = manualConfig.paymentMethods.filter(m => m.id !== methodId);
        const updatedConfig: ShopManualPaymentConfig = {
            ...manualConfig,
            paymentMethods: updatedMethods,
            enabled: updatedMethods.length > 0,
        };
        saveConfig(updatedConfig);
    };

    const handleToggleMethod = (methodId: string) => {
        const updatedMethods = manualConfig.paymentMethods.map(m =>
            m.id === methodId ? { ...m, isActive: !m.isActive } : m
        );
        const updatedConfig: ShopManualPaymentConfig = {
            ...manualConfig,
            paymentMethods: updatedMethods,
        };
        saveConfig(updatedConfig);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccessMessage("Copiado al portapapeles");
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    // Method form modal
    if (showAddMethod) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                        {editingMethod ? "Editar Método de Pago" : "Agregar Método de Pago"}
                    </h3>
                    <button
                        onClick={() => { setShowAddMethod(false); resetMethodForm(); }}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Method Type Selection */}
                {!selectedMethodType && (
                    <div className="grid grid-cols-2 gap-3">
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => setSelectedMethodType(option.type)}
                                className="p-4 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-cyan-500/50 transition-all text-left"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        {option.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{option.label}</h4>
                                        <p className="text-xs text-slate-400">{option.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Method Form */}
                {selectedMethodType && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                            <span className="text-2xl">{MANUAL_PAYMENT_METHOD_ICONS[selectedMethodType]}</span>
                            <span className="text-cyan-400 font-medium">{MANUAL_PAYMENT_METHOD_LABELS[selectedMethodType]}</span>
                            <button
                                onClick={() => setSelectedMethodType(null)}
                                className="ml-auto text-slate-400 hover:text-white text-sm"
                            >
                                Cambiar
                            </button>
                        </div>

                        {/* Common: Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nombre del método *
                            </label>
                            <input
                                type="text"
                                value={methodName}
                                onChange={(e) => setMethodName(e.target.value)}
                                placeholder="Ej: Banco Popular, Binance Pay"
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>

                        {/* Bank Transfer Fields */}
                        {selectedMethodType === "bank_transfer" && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Banco
                                        </label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            placeholder="Ej: Banreservas"
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Tipo de cuenta
                                        </label>
                                        <select
                                            value={accountType}
                                            onChange={(e) => setAccountType(e.target.value as "corriente" | "ahorro")}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        >
                                            <option value="corriente">Corriente</option>
                                            <option value="ahorro">Ahorro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Número de cuenta
                                    </label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="Ej: 1234567890"
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Titular de la cuenta
                                        </label>
                                        <input
                                            type="text"
                                            value={accountHolder}
                                            onChange={(e) => setAccountHolder(e.target.value)}
                                            placeholder="Nombre completo"
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Cédula / RNC
                                        </label>
                                        <input
                                            type="text"
                                            value={identificationNumber}
                                            onChange={(e) => setIdentificationNumber(e.target.value)}
                                            placeholder="Ej: 001-1234567-8"
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Mobile Payment / Zelle */}
                        {(selectedMethodType === "mobile_payment" || selectedMethodType === "zelle") && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="Ej: +1 809 123 4567"
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email (opcional)
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* PayPal Manual */}
                        {selectedMethodType === "paypal_manual" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email de PayPal
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu-email@paypal.com"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        )}

                        {/* Crypto */}
                        {selectedMethodType === "crypto" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Red / Network
                                    </label>
                                    <input
                                        type="text"
                                        value={network}
                                        onChange={(e) => setNetwork(e.target.value)}
                                        placeholder="Ej: BEP20, TRC20, ERC20"
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Dirección de wallet
                                    </label>
                                    <input
                                        type="text"
                                        value={walletAddress}
                                        onChange={(e) => setWalletAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 font-mono text-sm focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </>
                        )}

                        {/* QR Code upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <QrCode className="w-4 h-4 inline mr-2" />
                                Código QR (opcional)
                            </label>
                            <FirebaseImageUpload
                                value={methodQrUrl}
                                onChange={setMethodQrUrl}
                                folder="shops/payment-qr"
                                shopId={shopId}
                                aspectRatio="square"
                                maxSizeMB={5}
                                accept="image"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Sube un QR para que los clientes puedan escanearlo
                            </p>
                        </div>

                        {/* Instructions */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Instrucciones adicionales (opcional)
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Ej: Enviar captura de pantalla al WhatsApp..."
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleAddMethod}
                                disabled={isSaving || !methodName}
                                className="flex-1 bg-cyan-500 hover:bg-cyan-400"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                {editingMethod ? "Guardar Cambios" : "Agregar Método"}
                            </Button>
                            <Button
                                onClick={() => { setShowAddMethod(false); resetMethodForm(); }}
                                variant="outline"
                                className="border-zinc-700"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Main view
    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Manual Payment Methods Section */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Métodos de Pago - {shopName}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Configura cuentas bancarias, QR de pago, y enlaces para que tus clientes puedan pagarte.
                        </p>
                    </div>
                </div>

                {/* QR Code and Payment Link Quick Setup */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* QR Code */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <QrCode className="w-5 h-5 text-cyan-400" />
                            <h4 className="text-white font-medium">QR de Pago General</h4>
                        </div>
                        <FirebaseImageUpload
                            value={qrCodeUrl}
                            onChange={(url) => {
                                setQrCodeUrl(url);
                                saveConfig({ ...manualConfig, qrCodeUrl: url } as any);
                            }}
                            folder="shops/payment-qr"
                            shopId={shopId}
                            aspectRatio="square"
                            maxSizeMB={5}
                            accept="image"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            QR principal que se mostrará a los clientes
                        </p>
                    </div>

                    {/* Payment Link */}
                    <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Link2 className="w-5 h-5 text-cyan-400" />
                            <h4 className="text-white font-medium">Enlace de Pago</h4>
                        </div>
                        <input
                            type="url"
                            value={paymentLinkUrl}
                            onChange={(e) => setPaymentLinkUrl(e.target.value)}
                            onBlur={() => saveConfig({ ...manualConfig, paymentLinkUrl } as any)}
                            placeholder="https://paypal.me/tunegocio"
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Link de PayPal.me, Binance Pay, etc.
                        </p>
                    </div>
                </div>

                {/* Configured Methods List */}
                {manualConfig.paymentMethods.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h4 className="text-white font-medium flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Cuentas Configuradas
                        </h4>
                        {manualConfig.paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                className={`p-4 rounded-xl border transition-all ${
                                    method.isActive
                                        ? "bg-green-500/10 border-green-500/30"
                                        : "bg-zinc-800/50 border-zinc-700 opacity-60"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{MANUAL_PAYMENT_METHOD_ICONS[method.type]}</span>
                                        <div>
                                            <p className="text-white font-medium">{method.name}</p>
                                            <p className="text-sm text-slate-400">
                                                {method.bankName && `${method.bankName} • `}
                                                {method.accountNumber && `****${method.accountNumber.slice(-4)}`}
                                                {method.email && method.email}
                                                {method.phoneNumber && method.phoneNumber}
                                                {method.walletAddress && `${method.walletAddress.slice(0, 8)}...`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleMethod(method.id)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                method.isActive
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-zinc-700 text-zinc-400"
                                            }`}
                                            title={method.isActive ? "Desactivar" : "Activar"}
                                        >
                                            {method.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleEditMethod(method)}
                                            className="p-2 rounded-lg bg-zinc-700 text-slate-300 hover:bg-zinc-600 transition-colors"
                                            title="Editar"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMethod(method.id)}
                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {method.icon && (
                                    <div className="mt-3 flex justify-center">
                                        <img src={method.icon} alt="QR" className="h-24 w-24 rounded-lg" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Method Button */}
                <Button
                    onClick={() => setShowAddMethod(true)}
                    className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Método de Pago
                </Button>

                {/* Settings */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                    {/* Require Receipt */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-medium">Requerir Comprobante</h4>
                            <p className="text-sm text-slate-400">
                                Los clientes deben subir foto del comprobante
                            </p>
                        </div>
                        <button
                            onClick={() => saveConfig({ ...manualConfig, requiresReceipt: !manualConfig.requiresReceipt })}
                            className={`relative w-14 h-7 rounded-full transition-colors ${
                                manualConfig.requiresReceipt ? "bg-cyan-500" : "bg-zinc-700"
                            }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                    manualConfig.requiresReceipt ? "left-8" : "left-1"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Upfront Payment */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex-1 pr-4">
                            <h4 className="text-white font-medium flex items-center gap-2">
                                Pago Anticipado (%)
                                {manualConfig.requireUpfrontPayment && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                                        Activo
                                    </span>
                                )}
                            </h4>
                            <p className="text-sm text-slate-400">
                                {manualConfig.requireUpfrontPayment
                                    ? `El cliente paga ${manualConfig.upfrontPaymentPercentage ?? 50}% ahora y el resto al recibir`
                                    : "El cliente paga el total al ordenar"}
                            </p>
                            {manualConfig.requireUpfrontPayment && (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="number"
                                        min="10"
                                        max="90"
                                        value={manualConfig.upfrontPaymentPercentage ?? 50}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            saveConfig({ ...manualConfig, upfrontPaymentPercentage: isNaN(val) ? 50 : val });
                                        }}
                                        className="w-20 px-3 py-1.5 text-center rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-amber-500 text-sm"
                                    />
                                    <span className="text-slate-400 text-sm font-medium">%</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => saveConfig({
                                ...manualConfig,
                                requireUpfrontPayment: !manualConfig.requireUpfrontPayment,
                                upfrontPaymentPercentage: manualConfig.upfrontPaymentPercentage ?? 50,
                            })}
                            className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                                manualConfig.requireUpfrontPayment ? "bg-amber-500" : "bg-zinc-700"
                            }`}
                        >
                            <div
                                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                                    manualConfig.requireUpfrontPayment ? "left-8" : "left-1"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Coming Soon: Stripe & PayPal */}
            <div className="p-6 rounded-2xl bg-zinc-800/50 border border-zinc-700">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-white">Próximamente</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 opacity-50">
                    <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-[#003087] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">PP</span>
                            </div>
                            <div>
                                <h4 className="text-white font-medium">PayPal</h4>
                                <span className="text-xs text-amber-400">En desarrollo</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Integración directa con PayPal para cobros automáticos.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Stripe</h4>
                                <span className="text-xs text-amber-400">En desarrollo</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Acepta tarjetas de crédito, Apple Pay y Google Pay.
                        </p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 text-center">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Estas integraciones estarán disponibles pronto para cobros automáticos.
                </p>
            </div>
        </div>
    );
}

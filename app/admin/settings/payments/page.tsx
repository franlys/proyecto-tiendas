"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CreditCard,
    Plus,
    Trash2,
    Save,
    Check,
    Loader2,
    Building2,
    Phone,
    Wallet,
    Bitcoin,
    Mail,
    AlertCircle,
    GripVertical,
    Edit2,
    ToggleLeft,
    ToggleRight,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn, cleanForFirestore } from "@/lib/utils";
import type {
    ManualPaymentMethod,
    ManualPaymentMethodType,
    ShopManualPaymentConfig,
} from "@/lib/types/payment.types";
import {
    DEFAULT_MANUAL_PAYMENT_CONFIG,
    MANUAL_PAYMENT_METHOD_LABELS,
    MANUAL_PAYMENT_METHOD_ICONS,
} from "@/lib/types/payment.types";

// Payment method type options
const PAYMENT_METHOD_TYPES: {
    type: ManualPaymentMethodType;
    label: string;
    icon: string;
    description: string;
}[] = [
        {
            type: "bank_transfer",
            label: "Transferencia Bancaria",
            icon: "🏦",
            description: "Cuenta bancaria para transferencias",
        },
        {
            type: "mobile_payment",
            label: "Pago Móvil",
            icon: "📱",
            description: "Pagos por teléfono (ej: Pago Móvil Venezuela)",
        },
        {
            type: "zelle",
            label: "Zelle",
            icon: "💸",
            description: "Pagos por Zelle (USA)",
        },
        {
            type: "paypal_manual",
            label: "PayPal",
            icon: "🅿️",
            description: "Transferencia manual a PayPal",
        },
        {
            type: "crypto",
            label: "Criptomonedas",
            icon: "₿",
            description: "Bitcoin, USDT, etc.",
        },
        {
            type: "cash",
            label: "Efectivo",
            icon: "💵",
            description: "Pago en efectivo al recibir",
        },
        {
            type: "other",
            label: "Otro",
            icon: "💳",
            description: "Otro método de pago",
        },
    ];

export default function PaymentSettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { getShop } = useShops();

    const [config, setConfig] = useState<ShopManualPaymentConfig>(DEFAULT_MANUAL_PAYMENT_CONFIG);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMethod, setEditingMethod] = useState<ManualPaymentMethod | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Load config from Firestore
    useEffect(() => {
        async function loadConfig() {
            if (!user?.shopId) return;

            try {
                const { db } = await import("@/lib/firebase");
                const { doc, getDoc } = await import("firebase/firestore");

                const configRef = doc(db, "shops", user.shopId, "settings", "payments");
                const configSnap = await getDoc(configRef);

                if (configSnap.exists()) {
                    setConfig(configSnap.data() as ShopManualPaymentConfig);
                }
            } catch (err) {
                console.error("Error loading payment config:", err);
            } finally {
                setIsLoading(false);
            }
        }

        if (!authLoading) {
            loadConfig();
        }
    }, [user?.shopId, authLoading]);

    // Save config to Firestore
    const handleSave = async () => {
        if (!user?.shopId) return;

        setIsSaving(true);
        try {
            const { db } = await import("@/lib/firebase");
            const { doc, setDoc } = await import("firebase/firestore");

            const configRef = doc(db, "shops", user.shopId, "settings", "payments");

            // Explicitly strip undefined to avoid Firestore errors, and prevent JSON.parse from turning undefined array items into nulls (which might also cause issues).
            const deepStripUndefined = (obj: any): any => {
                if (obj === null || obj === undefined) return null;
                if (Array.isArray(obj)) {
                    // Filter out undefined entirely from arrays
                    return obj.filter(item => item !== undefined).map(deepStripUndefined);
                }
                if (typeof obj === 'object') {
                    const result: any = {};
                    for (const key in obj) {
                        if (obj[key] !== undefined) {
                            result[key] = deepStripUndefined(obj[key]);
                        }
                    }
                    return result;
                }
                return obj;
            };

            const cleanConfig = deepStripUndefined(config);
            console.log("PAYMENT_SAVE_PAYLOAD:", cleanConfig); // Force log to verify

            await setDoc(configRef, cleanConfig);

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error("Error saving payment config:", err);
            alert("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle payment system
    const toggleEnabled = () => {
        setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
        setIsSaved(false);
    };

    // Toggle method active status
    const toggleMethodActive = (methodId: string) => {
        setConfig(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.map(m =>
                m.id === methodId ? { ...m, isActive: !m.isActive } : m
            ),
        }));
        setIsSaved(false);
    };

    // Delete method
    const deleteMethod = (methodId: string) => {
        if (!confirm("¿Eliminar este método de pago?")) return;
        setConfig(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.filter(m => m.id !== methodId),
        }));
        setIsSaved(false);
    };

    // Add/Update method
    const saveMethod = (method: ManualPaymentMethod) => {
        setConfig(prev => {
            const exists = prev.paymentMethods.find(m => m.id === method.id);
            if (exists) {
                return {
                    ...prev,
                    paymentMethods: prev.paymentMethods.map(m =>
                        m.id === method.id ? method : m
                    ),
                };
            } else {
                return {
                    ...prev,
                    paymentMethods: [...prev.paymentMethods, method],
                };
            }
        });
        setEditingMethod(null);
        setShowAddModal(false);
        setIsSaved(false);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const shop = user?.shopId ? getShop(user.shopId) : null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-white/10 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/settings">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-display text-2xl font-bold text-white">
                                        Métodos de Pago
                                    </h1>
                                    <p className="text-slate-400 text-sm">
                                        Configura cómo tus clientes pueden pagarte
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleSave} disabled={isSaved || isSaving}>
                            {isSaved ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Guardado
                                </>
                            ) : (
                                <>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? "Guardando..." : "Guardar"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Enable/Disable Toggle */}
                <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/10">
                    <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={toggleEnabled}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-xl",
                                config.enabled ? "bg-green-500/20" : "bg-white/10"
                            )}>
                                <CreditCard className={cn(
                                    "w-6 h-6",
                                    config.enabled ? "text-green-400" : "text-slate-400"
                                )} />
                            </div>
                            <div>
                                <h2 className="text-white font-semibold">
                                    Sistema de Pagos Manuales
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {config.enabled
                                        ? "Los clientes pueden enviar comprobantes de pago"
                                        : "Activa para recibir comprobantes de pago"}
                                </p>
                            </div>
                        </div>
                        <div className={cn(
                            "relative w-14 h-7 rounded-full transition-colors",
                            config.enabled ? "bg-green-500" : "bg-white/20"
                        )}>
                            <div className={cn(
                                "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg",
                                config.enabled ? "translate-x-8" : "translate-x-1"
                            )} />
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                {config.enabled && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <p className="font-medium mb-1">¿Cómo funciona?</p>
                            <ol className="list-decimal list-inside space-y-1 text-blue-300/80">
                                <li>El cliente selecciona un método de pago</li>
                                <li>Ve los datos de tu cuenta para hacer la transferencia</li>
                                <li>Sube una foto del comprobante</li>
                                <li>Recibes un email para validar el pago</li>
                            </ol>
                        </div>
                    </div>
                )}

                {config.enabled && (
                    <>
                        {/* General Settings */}
                        <div className="glass-panel rounded-2xl p-6 mb-6 border border-white/10">
                            <h3 className="text-white font-semibold mb-4">Configuración General</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Moneda Principal
                                    </label>
                                    <select
                                        value={config.defaultCurrency}
                                        onChange={(e) => setConfig(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="USD">USD - Dólar</option>
                                        <option value="DOP">DOP - Peso Dominicano</option>
                                        <option value="MXN">MXN - Peso Mexicano</option>
                                        <option value="VES">VES - Bolívar</option>
                                        <option value="COP">COP - Peso Colombiano</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Instrucciones Generales (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={config.paymentInstructions || ""}
                                        onChange={(e) => setConfig(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                                        placeholder="Ej: Envía el comprobante por WhatsApp"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods List */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-semibold">Métodos de Pago</h3>
                                <Button
                                    size="sm"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Agregar
                                </Button>
                            </div>

                            {config.paymentMethods.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay métodos de pago configurados</p>
                                    <p className="text-sm mt-1">Agrega uno para que tus clientes puedan pagarte</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {config.paymentMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                                method.isActive
                                                    ? "bg-white/5 border-white/10"
                                                    : "bg-white/[0.02] border-white/5 opacity-60"
                                            )}
                                        >
                                            <div className="text-2xl">
                                                {MANUAL_PAYMENT_METHOD_ICONS[method.type]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {method.name}
                                                </p>
                                                <p className="text-sm text-slate-400 truncate">
                                                    {MANUAL_PAYMENT_METHOD_LABELS[method.type]}
                                                    {method.bankName && ` • ${method.bankName}`}
                                                    {method.email && ` • ${method.email}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleMethodActive(method.id)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        method.isActive
                                                            ? "text-green-400 hover:bg-green-500/20"
                                                            : "text-slate-500 hover:bg-white/10"
                                                    )}
                                                    title={method.isActive ? "Desactivar" : "Activar"}
                                                >
                                                    {method.isActive ? (
                                                        <ToggleRight className="w-5 h-5" />
                                                    ) : (
                                                        <ToggleLeft className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setEditingMethod(method)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteMethod(method.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Add/Edit Modal */}
            {(showAddModal || editingMethod) && (
                <PaymentMethodModal
                    method={editingMethod}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingMethod(null);
                    }}
                    onSave={saveMethod}
                />
            )}
        </div>
    );
}

// Modal Component
interface PaymentMethodModalProps {
    method: ManualPaymentMethod | null;
    onClose: () => void;
    onSave: (method: ManualPaymentMethod) => void;
}

function PaymentMethodModal({ method, onClose, onSave }: PaymentMethodModalProps) {
    const isEditing = !!method;
    const [formData, setFormData] = useState<ManualPaymentMethod>(
        method || {
            id: `pm-${Date.now()}`,
            type: "bank_transfer",
            name: "",
            isActive: true,
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert("Por favor ingresa un nombre para el método de pago");
            return;
        }
        onSave(formData);
    };

    const updateField = (field: keyof ManualPaymentMethod, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-slate-900 rounded-2xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {isEditing ? "Editar Método de Pago" : "Agregar Método de Pago"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Tipo de Método
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHOD_TYPES.map((type) => (
                                <button
                                    key={type.type}
                                    type="button"
                                    onClick={() => updateField("type", type.type)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                        formData.type === type.type
                                            ? "bg-primary/20 border-primary text-white"
                                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                    )}
                                >
                                    <span className="text-xl">{type.icon}</span>
                                    <span className="text-sm font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Nombre del Método *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateField("name", e.target.value)}
                            placeholder="Ej: Banco Popular, Zelle Personal"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                            required
                        />
                    </div>

                    {/* Bank Transfer Fields */}
                    {formData.type === "bank_transfer" && (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Banco
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankName || ""}
                                    onChange={(e) => updateField("bankName", e.target.value)}
                                    placeholder="Ej: Banco Popular"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Titular de la Cuenta
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountHolder || ""}
                                    onChange={(e) => updateField("accountHolder", e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Número de Cuenta
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountNumber || ""}
                                    onChange={(e) => updateField("accountNumber", e.target.value)}
                                    placeholder="Número de cuenta bancaria"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Tipo de Cuenta
                                    </label>
                                    <select
                                        value={formData.accountType || "corriente"}
                                        onChange={(e) => updateField("accountType", e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                                    >
                                        <option value="corriente">Corriente</option>
                                        <option value="ahorro">Ahorro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Cédula/RIF
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.identificationNumber || ""}
                                        onChange={(e) => updateField("identificationNumber", e.target.value)}
                                        placeholder="V-12345678"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Mobile Payment Fields */}
                    {formData.type === "mobile_payment" && (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber || ""}
                                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                                    placeholder="0412-1234567"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Banco
                                </label>
                                <input
                                    type="text"
                                    value={formData.bankName || ""}
                                    onChange={(e) => updateField("bankName", e.target.value)}
                                    placeholder="Ej: Banesco"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Cédula
                                </label>
                                <input
                                    type="text"
                                    value={formData.identificationNumber || ""}
                                    onChange={(e) => updateField("identificationNumber", e.target.value)}
                                    placeholder="V-12345678"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </>
                    )}

                    {/* Zelle/PayPal Fields */}
                    {(formData.type === "zelle" || formData.type === "paypal_manual") && (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ""}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Nombre del Beneficiario
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountHolder || ""}
                                    onChange={(e) => updateField("accountHolder", e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </>
                    )}

                    {/* Crypto Fields */}
                    {formData.type === "crypto" && (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Dirección de Wallet
                                </label>
                                <input
                                    type="text"
                                    value={formData.walletAddress || ""}
                                    onChange={(e) => updateField("walletAddress", e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    Red / Network
                                </label>
                                <input
                                    type="text"
                                    value={formData.network || ""}
                                    onChange={(e) => updateField("network", e.target.value)}
                                    placeholder="Ej: BEP20, TRC20, ERC20"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                            </div>
                        </>
                    )}

                    {/* Instructions (for all) */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Instrucciones Adicionales (opcional)
                        </label>
                        <textarea
                            value={formData.instructions || ""}
                            onChange={(e) => updateField("instructions", e.target.value)}
                            placeholder="Instrucciones especiales para este método..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1">
                            {isEditing ? "Guardar Cambios" : "Agregar Método"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

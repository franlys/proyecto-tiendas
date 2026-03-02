"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Upload,
    Check,
    Copy,
    ChevronRight,
    Loader2,
    Camera,
    Image as ImageIcon,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import type {
    ManualPaymentMethod,
    ManualPaymentMethodType,
    ShopManualPaymentConfig,
} from "@/lib/types/payment.types";
import {
    MANUAL_PAYMENT_METHOD_ICONS,
    MANUAL_PAYMENT_METHOD_LABELS,
} from "@/lib/types/payment.types";

interface ManualPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentConfig: ShopManualPaymentConfig;
    totalAmount: number;
    currency?: string;
    orderId: string;
    shopId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    onPaymentSubmitted: (receiptUrl: string, paymentMethodId: string) => void;
}

export function ManualPaymentModal({
    isOpen,
    onClose,
    paymentConfig,
    totalAmount,
    currency = "USD",
    orderId,
    shopId,
    customerName,
    customerPhone,
    customerEmail,
    onPaymentSubmitted,
}: ManualPaymentModalProps) {
    const [step, setStep] = useState<"select" | "details" | "upload" | "success">("select");
    const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethod | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [referenceNumber, setReferenceNumber] = useState("");
    const [customerNote, setCustomerNote] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activePaymentMethods = paymentConfig.paymentMethods.filter(m => m.isActive);

    const handleSelectMethod = (method: ManualPaymentMethod) => {
        setSelectedMethod(method);
        setStep("details");
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError("Por favor selecciona una imagen válida");
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("La imagen debe ser menor a 5MB");
                return;
            }
            setReceiptFile(file);
            setReceiptPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleSubmitPayment = async () => {
        if (!receiptFile || !selectedMethod) return;

        setIsUploading(true);
        setError(null);

        try {
            // 1. Upload image to Firebase Storage
            const formData = new FormData();
            formData.append("file", receiptFile);
            formData.append("shopId", shopId);
            formData.append("orderId", orderId);
            formData.append("type", "payment-receipt");

            const uploadResponse = await fetch("/api/upload/image", {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Error al subir el comprobante");
            }

            const { url: receiptUrl } = await uploadResponse.json();

            // 2. Submit payment receipt to the system
            const receiptData = {
                orderId,
                shopId,
                customerName,
                customerPhone,
                customerEmail,
                paymentMethodId: selectedMethod.id,
                paymentMethodName: selectedMethod.name,
                paymentMethodType: selectedMethod.type,
                amount: totalAmount,
                currency,
                receiptUrl,
                referenceNumber: referenceNumber || undefined,
                customerNote: customerNote || undefined,
            };

            const submitResponse = await fetch("/api/payments/submit-receipt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(receiptData),
            });

            if (!submitResponse.ok) {
                throw new Error("Error al enviar el comprobante");
            }

            // 3. Success!
            setStep("success");
            onPaymentSubmitted(receiptUrl, selectedMethod.id);

        } catch (err: any) {
            console.error("Payment submission error:", err);
            setError(err.message || "Error al procesar el pago");
        } finally {
            setIsUploading(false);
        }
    };

    const renderPaymentMethodDetails = (method: ManualPaymentMethod) => {
        const fields: Array<{ label: string; value: string; copyable?: boolean }> = [];

        switch (method.type) {
            case "bank_transfer":
                if (method.bankName) fields.push({ label: "Banco", value: method.bankName });
                if (method.accountHolder) fields.push({ label: "Titular", value: method.accountHolder, copyable: true });
                if (method.accountNumber) fields.push({ label: "Número de Cuenta", value: method.accountNumber, copyable: true });
                if (method.accountType) fields.push({ label: "Tipo de Cuenta", value: method.accountType === "corriente" ? "Corriente" : "Ahorro" });
                if (method.identificationNumber) fields.push({ label: "Cédula/RIF", value: method.identificationNumber, copyable: true });
                break;
            case "mobile_payment":
                if (method.phoneNumber) fields.push({ label: "Teléfono", value: method.phoneNumber, copyable: true });
                if (method.bankName) fields.push({ label: "Banco", value: method.bankName });
                if (method.identificationNumber) fields.push({ label: "Cédula", value: method.identificationNumber, copyable: true });
                break;
            case "zelle":
            case "paypal_manual":
                if (method.email) fields.push({ label: "Email", value: method.email, copyable: true });
                if (method.accountHolder) fields.push({ label: "Nombre", value: method.accountHolder, copyable: true });
                break;
            case "crypto":
                if (method.walletAddress) fields.push({ label: "Dirección", value: method.walletAddress, copyable: true });
                if (method.network) fields.push({ label: "Red", value: method.network });
                break;
            default:
                if (method.instructions) fields.push({ label: "Instrucciones", value: method.instructions });
        }

        return fields;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl border border-white/10 shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">
                        {step === "select" && "Método de Pago"}
                        {step === "details" && "Datos para Transferir"}
                        {step === "upload" && "Subir Comprobante"}
                        {step === "success" && "¡Pago Enviado!"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Select Payment Method */}
                        {step === "select" && (
                            <motion.div
                                key="select"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-3"
                            >
                                <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl mb-4">
                                    <p className="text-sm text-slate-300">
                                        Total a pagar: <span className="text-white font-bold text-lg">${totalAmount.toLocaleString()} {currency}</span>
                                    </p>
                                </div>

                                {paymentConfig.paymentInstructions && (
                                    <p className="text-sm text-slate-400 mb-4">
                                        {paymentConfig.paymentInstructions}
                                    </p>
                                )}

                                {activePaymentMethods.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No hay métodos de pago disponibles</p>
                                    </div>
                                ) : (
                                    activePaymentMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => handleSelectMethod(method)}
                                            className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-xl flex items-center gap-4 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl">
                                                {MANUAL_PAYMENT_METHOD_ICONS[method.type]}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-white font-medium">{method.name}</p>
                                                <p className="text-sm text-slate-400">
                                                    {MANUAL_PAYMENT_METHOD_LABELS[method.type]}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                        </button>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Payment Details */}
                        {step === "details" && selectedMethod && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {/* Method header */}
                                <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl">
                                        {MANUAL_PAYMENT_METHOD_ICONS[selectedMethod.type]}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{selectedMethod.name}</p>
                                        <p className="text-sm text-primary">
                                            Monto: ${totalAmount.toLocaleString()} {currency}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment details */}
                                <div className="space-y-3">
                                    {renderPaymentMethodDetails(selectedMethod).map((field, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-white/5 border border-white/10 rounded-lg"
                                        >
                                            <p className="text-xs text-slate-400 mb-1">{field.label}</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-white font-mono text-sm break-all">{field.value}</p>
                                                {field.copyable && (
                                                    <button
                                                        onClick={() => handleCopy(field.value, field.label)}
                                                        className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    >
                                                        {copiedField === field.label ? (
                                                            <Check className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Instructions */}
                                {selectedMethod.instructions && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                        <p className="text-sm text-amber-200">{selectedMethod.instructions}</p>
                                    </div>
                                )}

                                {/* Next button */}
                                <Button
                                    onClick={() => setStep("upload")}
                                    className="w-full py-4 bg-primary hover:bg-primary/90"
                                >
                                    Ya realicé el pago
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>

                                {/* Back button */}
                                <button
                                    onClick={() => setStep("select")}
                                    className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
                                >
                                    ← Elegir otro método
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Upload Receipt */}
                        {step === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {/* Upload area */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                {receiptPreview ? (
                                    <div className="relative">
                                        <img
                                            src={receiptPreview}
                                            alt="Comprobante"
                                            className="w-full h-64 object-contain bg-black/50 rounded-xl"
                                        />
                                        <button
                                            onClick={() => {
                                                setReceiptFile(null);
                                                setReceiptPreview(null);
                                            }}
                                            className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-48 border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
                                    >
                                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-medium">Subir comprobante</p>
                                            <p className="text-sm text-slate-400">Toca para tomar foto o seleccionar imagen</p>
                                        </div>
                                    </button>
                                )}

                                {/* Reference number */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Número de referencia (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        placeholder="Ej: 12345678"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                    />
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Nota adicional (opcional)
                                    </label>
                                    <textarea
                                        value={customerNote}
                                        onChange={(e) => setCustomerNote(e.target.value)}
                                        placeholder="Algún comentario sobre el pago..."
                                        rows={2}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 resize-none"
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submit button */}
                                <Button
                                    onClick={handleSubmitPayment}
                                    disabled={!receiptFile || isUploading}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 mr-2" />
                                            Enviar Comprobante
                                        </>
                                    )}
                                </Button>

                                {/* Back button */}
                                <button
                                    onClick={() => setStep("details")}
                                    className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors"
                                >
                                    ← Volver a los datos
                                </button>
                            </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8 space-y-4"
                            >
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                    <Check className="w-10 h-10 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">¡Comprobante Enviado!</h3>
                                    <p className="text-slate-400 text-sm mt-2">
                                        El dueño del negocio revisará tu pago y recibirás una confirmación pronto.
                                    </p>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full bg-primary hover:bg-primary/90 py-4"
                                >
                                    Entendido
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

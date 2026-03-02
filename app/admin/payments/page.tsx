"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    CreditCard,
    Check,
    X,
    Clock,
    Loader2,
    Eye,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    FileText,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { PaymentReceipt } from "@/lib/types/payment.types";
import {
    RECEIPT_STATUS_LABELS,
    RECEIPT_STATUS_COLORS,
    MANUAL_PAYMENT_METHOD_ICONS,
} from "@/lib/types/payment.types";

type ReceiptStatus = "pending" | "approved" | "rejected";

export default function PaymentReceiptsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { getShop } = useShops();

    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
    const [filterStatus, setFilterStatus] = useState<ReceiptStatus | "all">("pending");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Load receipts from Firestore
    const loadReceipts = async () => {
        if (!user?.shopId) return;

        setIsLoading(true);
        try {
            const { db } = await import("@/lib/firebase");
            const { collection, getDocs, orderBy, query } = await import("firebase/firestore");

            const receiptsRef = collection(db, "shops", user.shopId, "payment-receipts");
            const q = query(receiptsRef, orderBy("submittedAt", "desc"));
            const snapshot = await getDocs(q);

            const loadedReceipts: PaymentReceipt[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                submittedAt: doc.data().submittedAt?.toDate() || new Date(),
                reviewedAt: doc.data().reviewedAt?.toDate(),
            })) as PaymentReceipt[];

            setReceipts(loadedReceipts);
        } catch (err) {
            console.error("Error loading receipts:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.shopId) {
            loadReceipts();
        }
    }, [user?.shopId, authLoading]);

    // Update receipt status
    const updateReceiptStatus = async (receiptId: string, status: ReceiptStatus, rejectionReason?: string) => {
        if (!user?.shopId) return;

        setIsUpdating(receiptId);
        try {
            const { db } = await import("@/lib/firebase");
            const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");

            const receiptRef = doc(db, "shops", user.shopId, "payment-receipts", receiptId);
            await updateDoc(receiptRef, {
                status,
                rejectionReason: rejectionReason || null,
                reviewedAt: serverTimestamp(),
                reviewedBy: user.id,
            });

            // Also update the order payment status
            const receipt = receipts.find(r => r.id === receiptId);
            if (receipt?.orderId) {
                const orderRef = doc(db, "shops", user.shopId, "orders", receipt.orderId);
                await updateDoc(orderRef, {
                    paymentStatus: status === "approved" ? "paid" : status === "rejected" ? "rejected" : "pending_validation",
                    updatedAt: serverTimestamp(),
                });
            }

            // Reload receipts
            await loadReceipts();
            setSelectedReceipt(null);

        } catch (err) {
            console.error("Error updating receipt:", err);
            alert("Error al actualizar el comprobante");
        } finally {
            setIsUpdating(null);
        }
    };

    // Filter receipts
    const filteredReceipts = receipts.filter(receipt => {
        const matchesStatus = filterStatus === "all" || receipt.status === filterStatus;
        const matchesSearch = searchQuery === "" ||
            receipt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            receipt.customerPhone.includes(searchQuery) ||
            receipt.orderId?.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        pending: receipts.filter(r => r.status === "pending").length,
        approved: receipts.filter(r => r.status === "approved").length,
        rejected: receipts.filter(r => r.status === "rejected").length,
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-white/10 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-display text-2xl font-bold text-white">
                                        Comprobantes de Pago
                                    </h1>
                                    <p className="text-slate-400 text-sm">
                                        Valida los pagos de tus clientes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/admin/settings/payments">
                                <Button variant="outline" size="sm">
                                    Configurar Métodos
                                </Button>
                            </Link>
                            <Button onClick={loadReceipts} variant="ghost" size="sm">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={() => setFilterStatus("pending")}
                        className={cn(
                            "glass-panel rounded-xl p-4 border transition-all text-left",
                            filterStatus === "pending" ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                <p className="text-xs text-slate-400">Pendientes</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilterStatus("approved")}
                        className={cn(
                            "glass-panel rounded-xl p-4 border transition-all text-left",
                            filterStatus === "approved" ? "border-green-500/50 bg-green-500/10" : "border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.approved}</p>
                                <p className="text-xs text-slate-400">Aprobados</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setFilterStatus("rejected")}
                        className={cn(
                            "glass-panel rounded-xl p-4 border transition-all text-left",
                            filterStatus === "rejected" ? "border-red-500/50 bg-red-500/10" : "border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                                <p className="text-xs text-slate-400">Rechazados</p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre, teléfono u orden..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={cn(
                            "px-4 py-3 rounded-xl border transition-colors",
                            filterStatus === "all"
                                ? "bg-primary/20 border-primary text-white"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                    >
                        Ver Todos
                    </button>
                </div>

                {/* Receipts List */}
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                    {filteredReceipts.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay comprobantes {filterStatus !== "all" ? RECEIPT_STATUS_LABELS[filterStatus].toLowerCase() : ""}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredReceipts.map((receipt) => (
                                <div
                                    key={receipt.id}
                                    className={cn(
                                        "p-4 hover:bg-white/5 transition-colors cursor-pointer",
                                        selectedReceipt?.id === receipt.id && "bg-white/5"
                                    )}
                                    onClick={() => setSelectedReceipt(selectedReceipt?.id === receipt.id ? null : receipt)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Method Icon */}
                                        <div className="text-2xl">
                                            {MANUAL_PAYMENT_METHOD_ICONS[receipt.paymentMethodType] || "💳"}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium truncate">
                                                    {receipt.customerName}
                                                </p>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    RECEIPT_STATUS_COLORS[receipt.status]
                                                )}>
                                                    {RECEIPT_STATUS_LABELS[receipt.status]}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 truncate">
                                                {receipt.paymentMethodName} • {new Date(receipt.submittedAt).toLocaleDateString("es", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right">
                                            <p className="text-white font-bold">
                                                ${receipt.amount.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {receipt.currency}
                                            </p>
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="text-slate-400">
                                            {selectedReceipt?.id === receipt.id ? (
                                                <ChevronUp className="w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedReceipt?.id === receipt.id && (
                                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                                            {/* Receipt Image */}
                                            <div className="relative aspect-video max-w-md mx-auto rounded-xl overflow-hidden bg-black/50">
                                                <Image
                                                    src={receipt.receiptUrl}
                                                    alt="Comprobante"
                                                    fill
                                                    className="object-contain"
                                                />
                                                <a
                                                    href={receipt.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink className="w-4 h-4 text-white" />
                                                </a>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        <a
                                                            href={`https://wa.me/${receipt.customerPhone.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            className="text-primary hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {receipt.customerPhone}
                                                        </a>
                                                    </div>
                                                    {receipt.customerEmail && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail className="w-4 h-4 text-slate-400" />
                                                            <span className="text-slate-300">{receipt.customerEmail}</span>
                                                        </div>
                                                    )}
                                                    {receipt.orderId && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <FileText className="w-4 h-4 text-slate-400" />
                                                            <Link
                                                                href={`/admin/orders?orderId=${receipt.orderId}`}
                                                                className="text-primary hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Ver Orden
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {receipt.referenceNumber && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-slate-400">Referencia:</span>
                                                            <span className="text-white font-mono">{receipt.referenceNumber}</span>
                                                        </div>
                                                    )}
                                                    {receipt.customerNote && (
                                                        <div className="text-sm">
                                                            <span className="text-slate-400">Nota:</span>
                                                            <p className="text-slate-300 mt-1">{receipt.customerNote}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {receipt.status === "pending" && (
                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateReceiptStatus(receipt.id, "approved");
                                                        }}
                                                        disabled={isUpdating === receipt.id}
                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                    >
                                                        {isUpdating === receipt.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4 mr-2" />
                                                                Aprobar Pago
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const reason = prompt("Razón del rechazo (opcional):");
                                                            if (reason !== null) {
                                                                updateReceiptStatus(receipt.id, "rejected", reason);
                                                            }
                                                        }}
                                                        disabled={isUpdating === receipt.id}
                                                        variant="outline"
                                                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Rechazar
                                                    </Button>
                                                </div>
                                            )}

                                            {receipt.status === "rejected" && receipt.rejectionReason && (
                                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                    <p className="text-sm text-red-400">
                                                        <strong>Razón del rechazo:</strong> {receipt.rejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

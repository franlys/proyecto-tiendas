"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ============================================
// DEBUG LOGGING - AGENCY PAGE
// ============================================
const DEBUG_PREFIX = "🏢 [AGENCY-DEBUG]";

function debugLog(action: string, data?: unknown) {
  console.log(`${DEBUG_PREFIX} ${action}`, data ?? "");
}
import {
  Shield,
  Edit,
  Store,
  Plus,
  Power,
  Settings,
  Eye,
  Key,
  LogOut,
  Loader2,
  X,
  Check,
  Copy,
  ExternalLink,
  Users,
  TrendingUp,
  Database,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Calendar,
  Sparkles,
  Ban,
  Building2,
  Bot,
  Activity,
  Layers,
} from "lucide-react";
import {
  AuthProvider,
  useAuth,
  ShopsProvider,
  useShops,
  type ManagedShop,
  type SubscriptionStatus,
} from "@/components/shared";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

import { ShopCategory } from "@/components/shared";
import { BUSINESS_TYPE_LABELS } from "@/lib/constants";
import { BusinessTypeMultiSelector } from "@/components/admin/business-type-selector";
import { getBusinessType, normalizeBusinessType } from "@/lib/types/business-types-v2";
import { useCombinedBusinessFeatures } from "@/lib/hooks";

function CreateShopModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; slug: string; category: ShopCategory; businessTypes: string[]; description: string; phone: string; wholesale: boolean; customDomain: string; monthlyPrice: number }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [businessTypes, setBusinessTypes] = useState<string[]>(["tienda_general"]);
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [wholesale, setWholesale] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState(1500); // Default to 1500 DOP/MXN

  const combinedFeatures = useCombinedBusinessFeatures(businessTypes);

  // Derivar category del primer businessType seleccionado (principal)
  const primaryType = businessTypes[0];
  const category = (getBusinessType(primaryType)?.category || "retail") as ShopCategory;

  // Auto-generar slug desde nombre
  useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && slug && phone && businessTypes.length > 0) {
      onCreate({ name, slug, category, businessTypes, description, phone, wholesale, customDomain, monthlyPrice });
      setName("");
      setSlug("");
      setCustomDomain("");
      setBusinessTypes(["tienda_general"]);
      setDescription("");
      setPhone("");
      setWholesale(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Nueva Tienda</h2>
            <p className="text-sm text-slate-400">
              Crea una tienda para tu cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Fix It Center"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo(s) de Negocio
            </label>
            <BusinessTypeMultiSelector
              value={businessTypes}
              onChange={setBusinessTypes}
              maxSelections={3}
            />
            {/* Identity Preview Block */}
            <div className="mt-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Identidad Identificada</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-[10px] text-slate-400">
                  Categoría: <span className="text-white font-medium">{category.toUpperCase()}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Etiquetas: <span className="text-white font-medium">{combinedFeatures.labels?.products} / {combinedFeatures.labels?.services}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={wholesale}
                  onChange={(e) => setWholesale(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-black/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-white">Ventas al Por Mayor</span>
                <span className="block text-xs text-slate-400">Habilita precios de mayoreo y registro B2B</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL (slug)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="fix-it-center"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dominio Personalizado (Opcional)
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="ej. mipizzeria.com"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">
              No incluyas "http://" ni "www".
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 1 55 0000 0000"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Tienda
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Payment status configuration
const SUBSCRIPTION_STATUS_CONFIG: Record<SubscriptionStatus, {
  label: string;
  color: string;
  icon: typeof Check;
}> = {
  active: { label: "Al día", color: "green", icon: Check },
  trial: { label: "Prueba", color: "blue", icon: Sparkles },
  past_due: { label: "Vencido", color: "amber", icon: AlertTriangle },
  canceled: { label: "Cancelado", color: "red", icon: Ban },
};

function ShopRow({
  shop,
  onPaymentAction,
  onDeleteClick
}: {
  shop: ManagedShop;
  onPaymentAction: (shop: ManagedShop) => void;
  onDeleteClick: (shop: ManagedShop) => void;
}) {
  const { toggleShopStatus, updateShop } = useShops();
  const [copied, setCopied] = useState(false);

  const toggleWholesale = () => {
    updateShop(shop.slug, { wholesaleEnabled: !shop.wholesaleEnabled });
  };

  const copyCredentials = () => {
    const text = `Usuario: ${shop.ownerUsername}\nContraseña: ${shop.ownerPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[shop.subscriptionStatus] || SUBSCRIPTION_STATUS_CONFIG.trial;
  const StatusIcon = statusConfig.icon;

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      {/* Shop Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
            <span className="text-white font-bold">
              {shop.name ? shop.name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{shop.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                {shop.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5 uppercase tracking-wider">
                {shop.businessType ? (BUSINESS_TYPE_LABELS[normalizeBusinessType(shop.businessType)] || shop.businessType) : "RETAIL"}
              </span>
              {shop.wholesaleEnabled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider font-bold">
                  MAYOREO
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Shop Status */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => toggleShopStatus(shop.slug)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              shop.isActive
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            )}
          >
            <Power className="w-4 h-4" />
            {shop.isActive ? "Activa" : "Inactiva"}
          </button>
          <button
            onClick={toggleWholesale}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              shop.wholesaleEnabled
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
            )}
            title={shop.wholesaleEnabled ? "Desactivar modo mayorista" : "Activar modo mayorista"}
          >
            🏢 {shop.wholesaleEnabled ? "Mayoreo ON" : "Mayoreo"}
          </button>
        </div>
      </td>

      {/* Payment Status */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              statusConfig.color === "green" && "bg-green-500/20 text-green-400",
              statusConfig.color === "blue" && "bg-blue-500/20 text-blue-400",
              statusConfig.color === "amber" && "bg-amber-500/20 text-amber-400",
              statusConfig.color === "red" && "bg-red-500/20 text-red-400"
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <p className="text-xs text-slate-500">
            ${shop.monthlyPrice}/mes
          </p>
        </div>
      </td>

      {/* Next Payment */}
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-slate-300">
            {new Date(shop.nextPaymentDate).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            })}
          </p>
          <p className="text-xs text-slate-500">
            {shop.subscriptionStatus === "active" ? "Recurrente" : "Manual"}
          </p>
        </div>
      </td>

      {/* Credentials */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 rounded bg-white/5 text-sm text-slate-300">
            {shop.ownerUsername}
          </code>
          <button
            onClick={copyCredentials}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copiar credenciales"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {/* Payment Action */}
          <button
            onClick={() => onPaymentAction(shop)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              shop.subscriptionStatus === "past_due"
                ? "text-green-400 hover:bg-green-500/20 animate-pulse"
                : "text-slate-400 hover:text-gold hover:bg-gold/10"
            )}
            title="Gestionar Pago"
          >
            <DollarSign className="w-4 h-4" />
          </button>

          <Link
            href={`/${shop.slug}`}
            target="_blank"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Ver tienda"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/agency/shop/${shop.slug}`}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            title="Configurar tienda"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDeleteClick(shop)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Eliminar tienda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeleteShopModal({
  shop,
  onClose,
}: {
  shop: ManagedShop | null;
  onClose: () => void;
}) {
  const { deleteShop } = useShops();
  const [confirmName, setConfirmName] = useState("");

  if (!shop) return null;

  const handleDelete = () => {
    debugLog("DELETE MODAL - Attempting delete", {
      shopSlug: shop.slug,
      shopName: shop.name,
      confirmName,
      matches: confirmName === shop.name,
    });

    if (confirmName === shop.name) {
      debugLog("DELETE MODAL - Confirmation matched, calling deleteShop");
      deleteShop(shop.slug);
      debugLog("DELETE MODAL - deleteShop called, closing modal");
      onClose();
    } else {
      debugLog("DELETE MODAL - Confirmation did NOT match", {
        expected: shop.name,
        received: confirmName,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-red-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Eliminar Tienda</h2>
            <p className="text-sm text-slate-400">Esta acción no se puede deshacer</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Estás a punto de eliminar permanentemente la tienda <strong className="text-white">{shop.name}</strong>.
            Todos los datos, inventario y usuarios asociados serán borrados.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Escribe <span className="text-white select-all font-mono bg-white/10 px-1 rounded">{shop.name}</span> para confirmar:
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-red-500/50"
              placeholder={shop.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={confirmName !== shop.name}
              onClick={handleDelete}
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Eliminar
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  shop,
  onClose,
}: {
  shop: ManagedShop | null;
  onClose: () => void;
}) {
  const { registerPayment, updateSubscriptionStatus, updatePaymentLink, updateShop } = useShops();
  const [paymentLink, setPaymentLink] = useState(shop?.paymentLink || "");
  const [showLinkField, setShowLinkField] = useState(false);
  const [price, setPrice] = useState(shop?.monthlyPrice?.toString() || "0");
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  if (!shop) return null;

  const handleRegisterPayment = () => {
    registerPayment(shop.slug);
    onClose();
  };

  const handleSaveLink = () => {
    updatePaymentLink(shop.slug, paymentLink);
    setShowLinkField(false);
  };

  const handleSavePrice = async () => {
    await updateShop(shop.id, { monthlyPrice: Number(price) });
    setIsEditingPrice(false);
  };

  // Mostrar botón de confirmar pago si está en trial o past_due
  const canConfirmPayment = shop.subscriptionStatus === "past_due" || shop.subscriptionStatus === "trial";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-gold/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gestionar Pago</h2>
            <p className="text-sm text-slate-400">{shop.name}</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 rounded-xl bg-white/5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Estado actual</span>
            <span
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                shop.subscriptionStatus === "active" && "bg-green-500/20 text-green-400",
                shop.subscriptionStatus === "trial" && "bg-blue-500/20 text-blue-400",
                shop.subscriptionStatus === "past_due" && "bg-amber-500/20 text-amber-400",
                shop.subscriptionStatus === "canceled" && "bg-red-500/20 text-red-400"
              )}
            >
              {(SUBSCRIPTION_STATUS_CONFIG[shop.subscriptionStatus] || SUBSCRIPTION_STATUS_CONFIG.trial).label}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400">Monto mensual</span>
            {isEditingPrice ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-24 px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-right font-bold"
                />
                <span className="text-white font-bold">DOP</span>
                <button onClick={handleSavePrice} className="p-1 hover:text-green-400"><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">${shop.monthlyPrice} DOP</span>
                <button onClick={() => setIsEditingPrice(true)} className="text-slate-500 hover:text-white"><Edit className="w-3 h-3" /></button>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Próx. Vencimiento</span>
            <span className="text-slate-400">
              {new Date(shop.nextPaymentDate).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Botón principal: Confirmar pago manual */}
          {canConfirmPayment && (
            <div className="space-y-2">
              <Button
                onClick={() => handleRegisterPayment()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {shop.subscriptionStatus === "trial" ? "Confirmar Primer Pago" : "Confirmar Pago Recibido"}
              </Button>
              <p className="text-xs text-center text-slate-400">
                Registra un pago en efectivo o transferencia. Activa la tienda por 30 días.
              </p>
            </div>
          )}

          {shop.subscriptionStatus === "active" && (
            <Button
              variant="outline"
              onClick={() => {
                updateSubscriptionStatus(shop.slug, "past_due");
                onClose();
              }}
              className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Marcar como Vencido
            </Button>
          )}

          {shop.subscriptionStatus === "canceled" && (
            <Button
              onClick={() => {
                updateSubscriptionStatus(shop.slug, "active");
                onClose();
              }}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Reactivar Suscripción
            </Button>
          )}

          {/* Link de pago opcional (colapsable) */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setShowLinkField(!showLinkField)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showLinkField ? "▼ Ocultar link de pago online" : "▶ Agregar link de pago online (opcional)"}
            </button>
            {showLinkField && (
              <div className="mt-3 flex gap-2">
                <input
                  type="url"
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://checkout.stripe.com/..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleSaveLink}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {shop.subscriptionStatus !== "canceled" && (
            <Button
              variant="ghost"
              onClick={() => {
                updateSubscriptionStatus(shop.slug, "canceled");
                onClose();
              }}
              className="w-full text-red-400 hover:bg-red-500/10"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancelar Suscripción
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AgencyContent() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isSuperAdmin, isLoading } = useAuth();
  const { shops, createShop, restoreDemos } = useShops();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShopForPayment, setSelectedShopForPayment] = useState<ManagedShop | null>(null);
  const [shopToDelete, setShopToDelete] = useState<ManagedShop | null>(null);

  // Debug: Log auth state on mount and changes
  useEffect(() => {
    debugLog("AUTH STATE CHECK", {
      isLoading,
      isAuthenticated,
      isSuperAdmin,
      user: user ? { name: user.name, role: user.role, id: user.id } : null,
    });
  }, [isLoading, isAuthenticated, isSuperAdmin, user]);

  // Debug: Log shops when they change
  useEffect(() => {
    debugLog("SHOPS LOADED", {
      count: shops.length,
      shops: shops.map(s => ({ slug: s.slug, name: s.name, isActive: s.isActive })),
    });
  }, [shops]);

  // Proteger ruta
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        debugLog("REDIRECT - Not authenticated, going to /login");
        router.push("/login");
      } else if (!isSuperAdmin) {
        debugLog("REDIRECT - Not super admin, going to /admin", { role: user?.role });
        router.push("/admin");
      } else {
        debugLog("ACCESS GRANTED ✅ - Super Admin verified");
      }
    }
  }, [isAuthenticated, isSuperAdmin, isLoading, router, user?.role]);

  const handleLogout = () => {
    debugLog("LOGOUT - User logging out", { user: user?.name });
    logout();
    router.push("/login");
  };

  const handleDeleteClick = (shop: ManagedShop) => {
    debugLog("DELETE CLICK - Opening delete modal", { shopSlug: shop.slug, shopName: shop.name });
    setShopToDelete(shop);
  };

  const handleCreateShop = async (data: { name: string; slug: string; category: ShopCategory; businessTypes: string[]; description: string; phone: string; wholesale: boolean; customDomain: string; monthlyPrice: number }) => {
    try {
      debugLog("CREATE SHOP - Form submitted", data);
      // Pass businessType (primary) and businessTypes (all) to createShop
      const newShop = await createShop({
        ...data,
        businessType: data.businessTypes[0], // Primary type for backwards compatibility
      });
      debugLog("CREATE SHOP - Result", { success: !!newShop, shopId: newShop?.id });
      setShowCreateModal(false);
    } catch (error: any) {
      console.error("CREATE SHOP ERROR:", error);
      alert(`Error al crear la tienda: ${error.message || "Error desconocido"}. Revisa la consola y tu conexión.`);
    }
  };

  if (isLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  const activeShops = shops.filter((s) => s.isActive).length;
  const totalShops = shops.length;
  const paidShops = shops.filter((s) => s.subscriptionStatus === "active").length;
  const pastDueShops = shops.filter((s) => s.subscriptionStatus === "past_due").length;
  const monthlyRevenue = shops
    .filter((s) => s.subscriptionStatus === "active" || s.subscriptionStatus === "trial")
    .reduce((sum, s) => sum + (s.monthlyPrice || 0), 0);
  const pendingRevenue = shops
    .filter((s) => s.subscriptionStatus === "past_due")
    .reduce((sum, s) => sum + (s.monthlyPrice || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-panel">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/20">
                <img src="/logo.png" alt="Linko" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Linko Agency
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Centro de Control · {user?.name}
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto ml-4 hide-scrollbar">
              {/* Profile Link */}
              <Link href="/agency/profile">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Mi Agencia</span>
                </Button>
              </Link>

              <Link href="/agency/system-health">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Sistema</span>
                </Button>
              </Link>

              <Link href="/agency/business-types">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap">
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Tipos</span>
                </Button>
              </Link>

              <Link href="/admin/templates">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap text-violet-400 hover:text-violet-300 hover:bg-violet-400/10">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Plantillas</span>
                </Button>
              </Link>

              <Link href="/admin/automation">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Bot WA</span>
                </Button>
              </Link>

              <Link href="/">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3 whitespace-nowrap">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Landing</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="px-2 sm:px-3 whitespace-nowrap text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Salir</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-5 border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalShops}</p>
                <p className="text-xs text-slate-400">Tiendas</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">${monthlyRevenue}</p>
                <p className="text-xs text-slate-400">MRR Activo</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{pastDueShops}</p>
                <p className="text-xs text-slate-400">Vencidos</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-gold/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gold">${pendingRevenue}</p>
                <p className="text-xs text-slate-400">Por Cobrar</p>
              </div>
            </div>
          </div>
        </div>



        {/* Shops Table */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Tiendas</h2>
              <p className="text-sm text-slate-400">
                Gestiona las tiendas de tus clientes
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tienda
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Tienda
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Pago
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Próximo Cobro
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <ShopRow
                    key={shop.id}
                    shop={shop}
                    onPaymentAction={setSelectedShopForPayment}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {shops.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No hay tiendas aún</p>
              <p className="text-sm text-slate-500">
                Crea tu primera tienda para comenzar
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Create Shop Modal */}
      <CreateShopModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateShop}
      />

      {/* Payment Modal */}
      {selectedShopForPayment && (
        <PaymentModal
          shop={selectedShopForPayment}
          onClose={() => setSelectedShopForPayment(null)}
        />
      )}

      <DeleteShopModal
        shop={shopToDelete}
        onClose={() => setShopToDelete(null)}
      />
    </div>
  );
}

export default function AgencyPage() {
  return (
    <AuthProvider>
      <ShopsProvider>
        <AgencyContent />
      </ShopsProvider>
    </AuthProvider>
  );
}

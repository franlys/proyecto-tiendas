"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared";
import { Button } from "@/components/ui";
import {
    BUSINESS_TYPE_CONFIG,
    BUSINESS_CATEGORY_LABELS,
    type BusinessType,
    type BusinessCategory,
} from "@/lib/types/business.types";
import {
    Store,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    Search,
    Save,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface ShopData {
    id: string;
    name: string;
    slug: string;
    businessType: BusinessType;
    isActive: boolean;
}

// Agrupar tipos de negocio por categoría
const GROUPED_TYPES = Object.entries(BUSINESS_TYPE_CONFIG).reduce((acc, [key, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(config); // config already has id field
    return acc;
}, {} as Record<BusinessCategory, (typeof BUSINESS_TYPE_CONFIG[BusinessType])[]>);

// Tipos legacy que no deberían usarse
const LEGACY_TYPES = ["beauty", "retail", "repair", "restaurant", "rentcar", "technology"];

export default function BusinessTypesPage() {
    const { user } = useAuth();
    const [shops, setShops] = useState<ShopData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedCategories, setExpandedCategories] = useState<Set<BusinessCategory>>(new Set(["food", "beauty", "retail"]));
    const [selectedShop, setSelectedShop] = useState<string | null>(null);
    const [showReference, setShowReference] = useState(true);

    // Cargar tiendas
    useEffect(() => {
        loadShops();
    }, []);

    async function loadShops() {
        setLoading(true);
        try {
            const res = await fetch("/api/debug/list-shops");
            const data = await res.json();
            setShops(data.shops || []);
        } catch (error) {
            console.error("Error loading shops:", error);
            toast.error("Error al cargar tiendas");
        } finally {
            setLoading(false);
        }
    }

    async function updateBusinessType(shopId: string, newType: BusinessType) {
        setSaving(shopId);
        try {
            const res = await fetch(`/api/admin/shops/${shopId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessType: newType }),
            });

            if (!res.ok) {
                throw new Error("Failed to update");
            }

            // Actualizar estado local
            setShops(prev => prev.map(shop =>
                shop.id === shopId ? { ...shop, businessType: newType } : shop
            ));

            toast.success("Tipo de negocio actualizado", {
                description: `Cambiado a: ${BUSINESS_TYPE_CONFIG[newType]?.label || newType}`,
            });
        } catch (error) {
            console.error("Error updating business type:", error);
            toast.error("Error al actualizar");
        } finally {
            setSaving(null);
            setSelectedShop(null);
        }
    }

    const toggleCategory = (category: BusinessCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const filteredShops = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeConfig = (type: BusinessType) => BUSINESS_TYPE_CONFIG[type] || BUSINESS_TYPE_CONFIG.otro;

    if (user?.role !== "super_admin") {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
                <p className="text-slate-400 mt-2">Solo Super Admin puede acceder a esta página</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Store className="w-8 h-8 text-cyan-400" />
                            Tipos de Negocio
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Gestiona el tipo de negocio de cada tienda y sus características
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowReference(!showReference)}
                            className="border-white/20"
                        >
                            {showReference ? "Ocultar" : "Mostrar"} Referencia
                        </Button>
                        <Button
                            variant="outline"
                            onClick={loadShops}
                            disabled={loading}
                            className="border-white/20"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Recargar
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Panel de Tiendas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar tienda..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10">
                                <h2 className="font-semibold text-white">Tiendas ({filteredShops.length})</h2>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                                    {filteredShops.map(shop => {
                                        const config = getTypeConfig(shop.businessType);
                                        const isLegacy = LEGACY_TYPES.includes(shop.businessType);
                                        const isEditing = selectedShop === shop.id;

                                        return (
                                            <div
                                                key={shop.id}
                                                className={`p-4 hover:bg-white/5 transition-colors ${isEditing ? "bg-cyan-500/10" : ""}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{config.icon}</span>
                                                        <div>
                                                            <h3 className="font-medium text-white">{shop.name}</h3>
                                                            <p className="text-sm text-slate-400">/{shop.slug}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isLegacy && (
                                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                                                Legacy
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-white/10 rounded-lg text-sm text-slate-300">
                                                            {config.label}
                                                        </span>
                                                        <Button
                                                            size="sm"
                                                            variant={isEditing ? "default" : "outline"}
                                                            onClick={() => setSelectedShop(isEditing ? null : shop.id)}
                                                            disabled={saving === shop.id}
                                                            className="border-white/20"
                                                        >
                                                            {saving === shop.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                "Cambiar"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Selector de tipo */}
                                                {isEditing && (
                                                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                                                        <p className="text-sm text-slate-400 mb-3">Selecciona el nuevo tipo:</p>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                                            {Object.entries(BUSINESS_TYPE_CONFIG)
                                                                .filter(([key]) => !LEGACY_TYPES.includes(key))
                                                                .map(([key, typeConfig]) => (
                                                                    <button
                                                                        key={key}
                                                                        onClick={() => updateBusinessType(shop.id, key as BusinessType)}
                                                                        className={`p-2 rounded-lg text-left flex items-center gap-2 transition-colors ${shop.businessType === key
                                                                            ? "bg-cyan-500/20 border border-cyan-500"
                                                                            : "bg-white/5 border border-transparent hover:bg-white/10"
                                                                            }`}
                                                                    >
                                                                        <span>{typeConfig.icon}</span>
                                                                        <span className="text-sm text-white truncate">{typeConfig.label}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Features actuales */}
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {Object.entries(config.features).map(([feature, enabled]) => (
                                                        enabled && (
                                                            <span
                                                                key={feature}
                                                                className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-xs rounded"
                                                            >
                                                                {feature}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel de Referencia */}
                    {showReference && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white">Tabla de Referencia</h2>

                            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                <div className="max-h-[700px] overflow-y-auto">
                                    {(Object.entries(GROUPED_TYPES) as [BusinessCategory, typeof GROUPED_TYPES[BusinessCategory]][]).map(([category, types]) => (
                                        <div key={category} className="border-b border-white/10 last:border-b-0">
                                            <button
                                                onClick={() => toggleCategory(category)}
                                                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                                            >
                                                <span className="font-medium text-white">
                                                    {BUSINESS_CATEGORY_LABELS[category]} ({types.length})
                                                </span>
                                                {expandedCategories.has(category) ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                            </button>

                                            {expandedCategories.has(category) && (
                                                <div className="divide-y divide-white/5">
                                                    {types.filter(t => !LEGACY_TYPES.includes(t.id)).map(type => (
                                                        <div key={type.id} className="p-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xl">{type.icon}</span>
                                                                <span className="font-medium text-white">{type.label}</span>
                                                                <code className="text-xs bg-white/10 px-1 rounded text-slate-400">
                                                                    {type.id}
                                                                </code>
                                                            </div>
                                                            <p className="text-sm text-slate-400 mb-3">{type.description}</p>

                                                            {/* Features Grid */}
                                                            <div className="grid grid-cols-5 gap-1 text-xs">
                                                                <FeatureBadge name="Catalogo" enabled={type.features.catalog} />
                                                                <FeatureBadge name="Servicios" enabled={type.features.services} />
                                                                <FeatureBadge name="Citas" enabled={type.features.bookings} />
                                                                <FeatureBadge name="Pedidos" enabled={type.features.orders} />
                                                                <FeatureBadge name="Inventario" enabled={type.features.inventory} />
                                                                <FeatureBadge name="Mayoreo" enabled={type.features.wholesale} />
                                                                <FeatureBadge name="Reparaciones" enabled={type.features.repairs} />
                                                                <FeatureBadge name="Rentas" enabled={type.features.rentals} />
                                                                <FeatureBadge name="Mesas" enabled={type.features.tables} />
                                                                <FeatureBadge name="Delivery" enabled={type.features.delivery} />
                                                            </div>

                                                            {/* Labels */}
                                                            <div className="mt-2 flex gap-2 flex-wrap text-xs">
                                                                <span className="text-slate-500">CTA: <span className="text-cyan-400">{type.labels.cta}</span></span>
                                                                <span className="text-slate-500">Productos: <span className="text-cyan-400">{type.labels.products}</span></span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeatureBadge({ name, enabled }: { name: string; enabled: boolean }) {
    return (
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${enabled ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-500"
            }`}>
            {enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span className="truncate">{name}</span>
        </div>
    );
}

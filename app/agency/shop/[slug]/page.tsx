"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Store,
    Shield,
    Users,
    Key,
    Save,
    Loader2,
    CheckCircle,
    AlertTriangle,
    MessageCircle,
} from "lucide-react";
import {
    AuthProvider,
    useAuth,
    ShopsProvider,
    useShops,
    useAgency,
    ManagedShop,
    ShopCategory,
    AgencyProvider,
} from "@/components/shared";
import { Button } from "@/components/ui";

function ShopDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { shops, getShop, isShopActive } = useShops();
    const { isSuperAdmin, isLoading: authLoading } = useAuth();

    const [shop, setShop] = useState<ManagedShop | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<"overview" | "config" | "security">("overview");
    const [loading, setLoading] = useState(true);

    // Form States
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState<ShopCategory>("beauty");
    const [phone, setPhone] = useState("");

    // Security State
    const [newPassword, setNewPassword] = useState("");

    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.push("/login");
            return;
        }

        if (shops.length > 0 && params.slug) {
            const foundShop = getShop(params.slug as string);
            if (foundShop) {
                setShop(foundShop);
                setName(foundShop.name);
                setSlug(foundShop.slug);
                setCategory(foundShop.category || "beauty");
                setPhone(foundShop.contact?.phone || "");
                setLoading(false);
            } else {
                router.push("/agency");
            }
        }
    }, [shops, params.slug, isSuperAdmin, authLoading, getShop, router]);

    if (loading || !shop) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F172A] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/agency">
                            <Button variant="ghost" size="sm" className="!px-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Store className="w-5 h-5 text-cyan-400" />
                                {shop.name}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>/{shop.slug}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span className="uppercase text-xs tracking-wider">{shop.category || "beauty"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "overview"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-4 h-4" />
                                <span>Vista General</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("config")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "config"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Store className="w-4 h-4" />
                                <span>Configuración</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "security"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Key className="w-4 h-4" />
                                <span>Seguridad</span>
                            </div>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        Estado de la Cuenta
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-black/20">
                                            <p className="text-sm text-slate-400 mb-1">Suscripción</p>
                                            <p className="font-semibold capitalize text-green-400">
                                                {shop.subscriptionStatus}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-black/20">
                                            <p className="text-sm text-slate-400 mb-1">Plan</p>
                                            <p className="font-semibold text-white">
                                                ${shop.monthlyPrice} / mes
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-400" />
                                        Monitoreo de Personal
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Visualiza el uso de asientos. No se muestra información personal.
                                    </p>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Usuarios Activos (Staff)</p>
                                            <p className="text-sm text-slate-400">Owner + 2 Empleados</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-amber-400 text-sm">Privacidad Activada</h4>
                                        <p className="text-xs text-amber-300/80 mt-1">
                                            Como Super Admin, no tienes acceso a ver Inventario, Ventas ni Clientes de esta tienda.
                                            Solo el propietario ({shop.ownerUsername}) puede gestionar esos datos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "config" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4">Configuración Pública</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Comercial</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as ShopCategory)}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                        >
                                            <option value="beauty">Belleza / Spa</option>
                                            <option value="retail">Retail / Tienda</option>
                                            <option value="repair">Taller / Reparación</option>
                                            <option value="restaurant">Restaurante</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp de Contacto</label>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-400">
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button disabled className="opacity-50 cursor-not-allowed">
                                            <Save className="w-4 h-4 mr-2" />
                                            Guardar Cambios (Demo)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-red-400" />
                                    Credenciales de Acceso
                                </h3>

                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 mb-6">
                                    <p className="text-sm text-slate-400 mb-2">Usuario Principal (Owner)</p>
                                    <code className="text-lg font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                                        {shop.ownerUsername}
                                    </code>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-white">Resetear Contraseña</h4>
                                    <p className="text-sm text-slate-400">
                                        Si el cliente olvidó su contraseña, puedes establecer una nueva aquí.
                                    </p>
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Nueva contraseña temporal"
                                            className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <Button
                                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20"
                                            onClick={() => alert(`Contraseña para ${shop.ownerUsername} actualizada a: ${newPassword}`)}
                                        >
                                            Resetear
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ShopDetailPage() {
    return (
        <AuthProvider>
            <AgencyProvider>
                <ShopsProvider>
                    <ShopDetailContent />
                </ShopsProvider>
            </AgencyProvider>
        </AuthProvider>
    );
}

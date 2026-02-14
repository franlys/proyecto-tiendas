"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Store,
    Camera,
    Phone,
    Mail,
    MapPin,
    Clock,
    Instagram,
    Facebook,
    Globe,
    Save,
    Loader2,
    CheckCircle,
    LayoutDashboard,
    Palette,
    MessageCircle,
    Bot,
    CreditCard
} from "lucide-react";
import {
    AuthProvider,
    useAuth,
    ShopsProvider,
    useShops,
} from "@/components/shared";
import { Button, PhoneInput, type PhoneInputValue } from "@/components/ui";

import { BankAccountsManager } from "@/components/admin/bank-accounts-manager";
import { ShopBankAccount } from "@/lib/constants";

interface ShopProfile {
    logo: string;
    name: string;
    description: string;
    slogan: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    city: string;
    ownerNotificationPhone?: string;
    // Bank Accounts
    bankAccounts: ShopBankAccount[];
    // Social media
    instagram: string;
    facebook: string;
    website: string;
    tiktok: string;
    // Hours
    schedule: {
        monday: { open: string; close: string; closed: boolean };
        tuesday: { open: string; close: string; closed: boolean };
        wednesday: { open: string; close: string; closed: boolean };
        thursday: { open: string; close: string; closed: boolean };
        friday: { open: string; close: string; closed: boolean };
        saturday: { open: string; close: string; closed: boolean };
        sunday: { open: string; close: string; closed: boolean };
    };
    // Theme
    primaryColor: string;
    accentColor: string;
}

const DEFAULT_SCHEDULE = {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "14:00", closed: false },
    sunday: { open: "00:00", close: "00:00", closed: true },
};

const DAY_LABELS: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
};

function ProfileContent() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { getShop, updateShop } = useShops();

    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "contact" | "schedule" | "social" | "theme" | "payment">("general");

    const [profile, setProfile] = useState<ShopProfile>({
        logo: "",
        name: "",
        description: "",
        slogan: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        city: "",
        ownerNotificationPhone: "",
        bankAccounts: [],
        instagram: "",
        facebook: "",
        website: "",
        tiktok: "",
        schedule: DEFAULT_SCHEDULE,
        primaryColor: "#06B6D4",
        accentColor: "#D4AF37",
    });

    // Load profile from localStorage
    useEffect(() => {
        if (user?.shopId) {
            const storageKey = `nexo-shop-profile-${user.shopId}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setProfile(prev => ({ ...prev, ...parsed }));
                } catch {
                    // Use defaults
                }
            }

            // Also load shop data
            const shop = getShop(user.shopId);
            if (shop) {
                setProfile(prev => ({
                    ...prev,
                    name: prev.name || shop.name,
                    description: prev.description || shop.description || "",
                    phone: prev.phone || shop.contact?.phone || "",
                    ownerNotificationPhone: prev.ownerNotificationPhone || shop.ownerNotificationPhone || "",
                    bankAccounts: prev.bankAccounts.length > 0 ? prev.bankAccounts : (shop.bankAccounts || []),
                }));
            }
        }
    }, [user?.shopId, getShop]);

    // Redirect if not authenticated or not shop owner
    useEffect(() => {
        if (!authLoading && (!user || !user.shopId)) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    const handleSave = () => {
        if (!user?.shopId) return;

        setSaving(true);
        const storageKey = `nexo-shop-profile-${user.shopId}`;
        localStorage.setItem(storageKey, JSON.stringify(profile));

        // Also update main shop data
        updateShop(user.shopId, {
            name: profile.name,
            description: profile.description,
            contact: {
                phone: profile.phone,
                email: profile.email,
                address: profile.address,
                city: profile.city
            },
            ownerNotificationPhone: profile.ownerNotificationPhone,
            bankAccounts: profile.bankAccounts,
        });

        setTimeout(() => {
            setSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }, 500);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const updateScheduleDay = (day: string, field: "open" | "close" | "closed", value: string | boolean) => {
        setProfile(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day as keyof typeof prev.schedule],
                    [field]: value,
                },
            },
        }));
    };

    if (authLoading || !user) {
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
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin"
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                                    <Store className="w-6 h-6 text-cyan-400" />
                                    Mi Negocio
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    Configura la información de tu tienda
                                </p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2">
                            <Link href="/admin">
                                <Button variant="ghost" size="sm">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-2">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "general"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Store className="w-4 h-4" />
                                <span>Información General</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("contact")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "contact"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4" />
                                <span>Contacto</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("schedule")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "schedule"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4" />
                                <span>Horarios</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("social")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "social"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Instagram className="w-4 h-4" />
                                <span>Redes Sociales</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("theme")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "theme"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Palette className="w-4 h-4" />
                                <span>Tema y Colores</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("payment")}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === "payment"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4" />
                                <span>Métodos de Pago</span>
                            </div>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {/* General Info Tab */}
                        {activeTab === "general" && (
                            <div className="space-y-6">
                                {/* Logo Upload */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-cyan-400" />
                                        Logo de la Tienda
                                    </h3>
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                                                {profile.logo ? (
                                                    <img
                                                        src={profile.logo}
                                                        alt="Logo"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-white text-3xl font-bold">
                                                        {profile.name?.charAt(0) || "T"}
                                                    </span>
                                                )}
                                            </div>
                                            <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center cursor-pointer hover:bg-cyan-400 transition-colors">
                                                <Camera className="w-4 h-4 text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Sube tu logo</p>
                                            <p className="text-sm text-slate-400">
                                                Recomendado: 200x200px, PNG o JPG
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                    <h3 className="text-lg font-bold mb-4">Información Básica</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Nombre del Negocio *
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ej: Mi Tienda"
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Eslogan (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.slogan}
                                            onChange={(e) => setProfile(prev => ({ ...prev, slogan: e.target.value }))}
                                            placeholder="Ej: Tu mejor opción en tecnología"
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Descripción
                                        </label>
                                        <textarea
                                            value={profile.description}
                                            onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Describe brevemente tu negocio..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Tab */}
                        {activeTab === "contact" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-green-400" />
                                    Información de Contacto
                                </h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <PhoneInput
                                        value={profile.phone}
                                        onChange={(value: PhoneInputValue) => setProfile(prev => ({ ...prev, phone: value.fullPhone }))}
                                        label="Teléfono"
                                        variant="dark"
                                    />

                                    <PhoneInput
                                        value={profile.whatsapp}
                                        onChange={(value: PhoneInputValue) => setProfile(prev => ({ ...prev, whatsapp: value.fullPhone }))}
                                        label="WhatsApp"
                                        variant="dark"
                                    />
                                </div>

                                <div>
                                    <PhoneInput
                                        value={profile.ownerNotificationPhone}
                                        onChange={(value: PhoneInputValue) => setProfile(prev => ({ ...prev, ownerNotificationPhone: value.fullPhone }))}
                                        label="Teléfono de Notificaciones (Privado)"
                                        variant="dark"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Este número recibirá alertas de nuevos pedidos y stock bajo. No será visible para los clientes.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="contacto@mitienda.com"
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.address}
                                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                                        placeholder="Calle Principal #123"
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.city}
                                        onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                                        placeholder="Ciudad, Estado"
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Schedule Tab */}
                        {activeTab === "schedule" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Horarios de Atención
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Configura los horarios en que tu negocio está abierto
                                </p>

                                <div className="space-y-3">
                                    {Object.entries(profile.schedule).map(([day, hours]) => (
                                        <div
                                            key={day}
                                            className={`flex items-center gap-4 p-3 rounded-xl ${hours.closed ? "bg-black/20 opacity-50" : "bg-black/20"
                                                }`}
                                        >
                                            <div className="w-24">
                                                <span className="text-white font-medium">{DAY_LABELS[day]}</span>
                                            </div>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={hours.closed}
                                                    onChange={(e) => updateScheduleDay(day, "closed", e.target.checked)}
                                                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-cyan-500 focus:ring-cyan-500"
                                                />
                                                <span className="text-sm text-slate-400">Cerrado</span>
                                            </label>

                                            {!hours.closed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => updateScheduleDay(day, "open", e.target.value)}
                                                        className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                                                    />
                                                    <span className="text-slate-400">a</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => updateScheduleDay(day, "close", e.target.value)}
                                                        className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Social Media Tab */}
                        {activeTab === "social" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Instagram className="w-5 h-5 text-pink-400" />
                                    Redes Sociales
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Conecta tus redes sociales para que tus clientes te encuentren
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Instagram className="w-4 h-4 inline mr-2 text-pink-400" />
                                            Instagram
                                        </label>
                                        <div className="flex">
                                            <span className="px-4 py-3 bg-black/30 border border-r-0 border-white/10 rounded-l-xl text-slate-400 text-sm">
                                                instagram.com/
                                            </span>
                                            <input
                                                type="text"
                                                value={profile.instagram}
                                                onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                                                placeholder="tu_usuario"
                                                className="flex-1 px-4 py-3 rounded-r-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Facebook className="w-4 h-4 inline mr-2 text-blue-400" />
                                            Facebook
                                        </label>
                                        <div className="flex">
                                            <span className="px-4 py-3 bg-black/30 border border-r-0 border-white/10 rounded-l-xl text-slate-400 text-sm">
                                                facebook.com/
                                            </span>
                                            <input
                                                type="text"
                                                value={profile.facebook}
                                                onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
                                                placeholder="tu_pagina"
                                                className="flex-1 px-4 py-3 rounded-r-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <svg className="w-4 h-4 inline mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                            </svg>
                                            TikTok
                                        </label>
                                        <div className="flex">
                                            <span className="px-4 py-3 bg-black/30 border border-r-0 border-white/10 rounded-l-xl text-slate-400 text-sm">
                                                tiktok.com/@
                                            </span>
                                            <input
                                                type="text"
                                                value={profile.tiktok}
                                                onChange={(e) => setProfile(prev => ({ ...prev, tiktok: e.target.value }))}
                                                placeholder="tu_usuario"
                                                className="flex-1 px-4 py-3 rounded-r-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            <Globe className="w-4 h-4 inline mr-2 text-cyan-400" />
                                            Sitio Web
                                        </label>
                                        <input
                                            type="url"
                                            value={profile.website}
                                            onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                                            placeholder="https://www.tutienda.com"
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theme Tab */}
                        {activeTab === "theme" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-yellow-400" />
                                    Tema y Colores
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Personaliza los colores de tu tienda
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Color Principal
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={profile.primaryColor}
                                                onChange={(e) => setProfile(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                                            />
                                            <input
                                                type="text"
                                                value={profile.primaryColor}
                                                onChange={(e) => setProfile(prev => ({ ...prev, primaryColor: e.target.value }))}
                                                className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Color de Acento
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={profile.accentColor}
                                                onChange={(e) => setProfile(prev => ({ ...prev, accentColor: e.target.value }))}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
                                            />
                                            <input
                                                type="text"
                                                value={profile.accentColor}
                                                onChange={(e) => setProfile(prev => ({ ...prev, accentColor: e.target.value }))}
                                                className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/10">
                                    <p className="text-sm text-slate-400 mb-3">Vista previa:</p>
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                                            style={{ backgroundColor: profile.primaryColor }}
                                        >
                                            {profile.name?.charAt(0) || "T"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{profile.name || "Tu Tienda"}</p>
                                            <p
                                                className="text-sm"
                                                style={{ color: profile.accentColor }}
                                            >
                                                {profile.slogan || "Tu eslogan aquí"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Tab */}
                        {activeTab === "payment" && (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                    Cuentas Bancarias
                                </h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Agrega las cuentas donde tus clientes podrán realizar depósitos o transferencias.
                                    Esta información se enviará automáticamente por WhatsApp al confirmar un pedido.
                                </p>

                                <BankAccountsManager
                                    accounts={profile.bankAccounts}
                                    onChange={(accounts) => setProfile(prev => ({ ...prev, bankAccounts: accounts }))}
                                />
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end gap-3 mt-6">
                            {saveSuccess && (
                                <span className="flex items-center gap-2 text-green-400 text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    Guardado correctamente
                                </span>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdminProfilePage() {
    return (
        <AuthProvider>
            <ShopsProvider>
                <ProfileContent />
            </ShopsProvider>
        </AuthProvider>
    );
}

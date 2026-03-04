"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    Loader2,
    Save,
    Plus,
    Trash2,
    Utensils,
    Lock,
    Unlock,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn, cleanForFirestore } from "@/lib/utils";
import type { MealPrepShopConfig, MealPrepCategoryRule } from "@/lib/types/meal-prep.types";

const DEFAULT_MEAL_PREP_CONFIG: MealPrepShopConfig = {
    categories: [
        { categoryId: "carbs", label: "Carbohidratos" },
        { categoryId: "proteins", label: "Proteínas" },
        { categoryId: "veggies", label: "Vegetales" },
    ],
    customInstructionsEnabled: true,
    premiumProteinsCategories: [],
};

export default function MealPrepSettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { getShop } = useShops();

    const [config, setConfig] = useState<MealPrepShopConfig>(DEFAULT_MEAL_PREP_CONFIG);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Editing State
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryId, setNewCategoryId] = useState("");

    // Load config from Firestore
    useEffect(() => {
        async function loadConfig() {
            if (!user?.shopId) return;

            try {
                const { db } = await import("@/lib/firebase");
                const { doc, getDoc } = await import("firebase/firestore");

                const configRef = doc(db, "shops", user.shopId);
                const configSnap = await getDoc(configRef);

                if (configSnap.exists()) {
                    const shopData = configSnap.data();
                    if (shopData.mealPrepConfig) {
                        setConfig(shopData.mealPrepConfig as MealPrepShopConfig);
                    }
                }
            } catch (err) {
                console.error("Error loading meal prep config:", err);
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
            const { doc, updateDoc } = await import("firebase/firestore");

            const shopRef = doc(db, "shops", user.shopId);

            // Firebase doesn't support undefined values, strip them before saving using the dedicated utility
            const cleanConfig = cleanForFirestore(config);

            await updateDoc(shopRef, {
                mealPrepConfig: cleanConfig
            });

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error("Error saving meal prep config:", err);
            alert("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    // Category Toggles
    const handleAddCategory = () => {
        if (!newCategoryId || !newCategoryName) return;
        setConfig(prev => ({
            ...prev,
            categories: [
                ...prev.categories,
                { categoryId: newCategoryId, label: newCategoryName }
            ]
        }));
        setNewCategoryId("");
        setNewCategoryName("");
        setIsSaved(false);
    };

    const handleDeleteCategory = (id: string) => {
        if (!confirm("¿Eliminar esta categoría?")) return;
        setConfig(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.categoryId !== id)
        }));
        setIsSaved(false);
    };

    const toggleExclusion = (categoryId: string, targetCategoryId: string) => {
        setConfig(prev => {
            const cats = prev.categories.map(c => {
                if (c.categoryId === categoryId) {
                    const excludes = c.excludesCategories || [];
                    if (excludes.includes(targetCategoryId)) {
                        return { ...c, excludesCategories: excludes.filter(e => e !== targetCategoryId) };
                    } else {
                        return { ...c, excludesCategories: [...excludes, targetCategoryId] };
                    }
                }
                return c;
            });
            return { ...prev, categories: cats };
        });
        setIsSaved(false);
    };

    const togglePremium = (categoryId: string) => {
        setConfig(prev => {
            const premiums = prev.premiumProteinsCategories || [];
            if (premiums.includes(categoryId)) {
                return { ...prev, premiumProteinsCategories: premiums.filter(p => p !== categoryId) };
            } else {
                return { ...prev, premiumProteinsCategories: [...premiums, categoryId] };
            }
        });
        setIsSaved(false);
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center">
                                    <Utensils className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="font-display text-2xl font-bold text-white">
                                        Reglas de Meal Prep
                                    </h1>
                                    <p className="text-slate-400 text-sm">
                                        Configura exclusiones y comportamiento de tus comidas
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

            <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">

                {/* Global Meal Prep settings */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gold" />
                        Opciones del Modal
                    </h2>

                    <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <div>
                            <p className="font-medium text-white">Permitir Instrucciones Manuales</p>
                            <p className="text-sm text-slate-400 mt-1">
                                Deja que los clientes escriban notas adicionales al fondo del plato.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.customInstructionsEnabled}
                            onChange={(e) => {
                                setConfig(prev => ({ ...prev, customInstructionsEnabled: e.target.checked }));
                                setIsSaved(false);
                            }}
                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                    </label>
                </div>


                {/* Categorías Dinámicas */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Categorías
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Agrega las IDs y nombres de tus variantes (ej: ID: vegetales, Nombre: Verduras).
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 mb-6">
                        {config.categories.map((category) => (
                            <div key={category.categoryId} className="flex flex-col gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg">🍱</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{category.label}</p>
                                            <p className="text-xs text-slate-400 font-mono">ID: {category.categoryId}</p>
                                        </div>
                                    </div>

                                    {/* Action tags */}
                                    <div className="flex items-center gap-3">
                                        <label className="flex gap-2 items-center text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={config.premiumProteinsCategories?.includes(category.categoryId) || false}
                                                onChange={() => togglePremium(category.categoryId)}
                                            />
                                            {config.premiumProteinsCategories?.includes(category.categoryId) ? 'Es Premium' : 'Hacer Premium'}
                                        </label>
                                        <button
                                            onClick={() => handleDeleteCategory(category.categoryId)}
                                            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors border border-rose-500/20 hover:border-transparent"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Exclusions section */}
                                <div>
                                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-rose-400" />
                                        Si eligen algo de <strong>{category.label}</strong>, bloquear:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {config.categories.map(otherCat => {
                                            if (otherCat.categoryId === category.categoryId) return null;
                                            const isExcluded = category.excludesCategories?.includes(otherCat.categoryId);
                                            return (
                                                <button
                                                    key={otherCat.categoryId}
                                                    onClick={() => toggleExclusion(category.categoryId, otherCat.categoryId)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 border",
                                                        isExcluded
                                                            ? "bg-rose-500/20 border-rose-500/50 text-white"
                                                            : "bg-black/20 border-white/10 text-slate-400 hover:border-white/30"
                                                    )}
                                                >
                                                    {isExcluded ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-50" />}
                                                    {otherCat.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form to add new Category */}
                    <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/5 space-y-4">
                        <p className="text-sm font-medium text-white">Nueva Categoría</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="ID interno (ej: carbs)"
                                value={newCategoryId}
                                onChange={(e) => setNewCategoryId(e.target.value)}
                                className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50 text-sm font-mono"
                            />
                            <input
                                type="text"
                                placeholder="Nombre UI (ej: Carbohidratos)"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary/50 text-sm"
                            />
                            <Button
                                onClick={handleAddCategory}
                                disabled={!newCategoryId || !newCategoryName}
                                className="whitespace-nowrap sm:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Package,
    Plus,
    Trash2,
    Save,
    Check,
    Loader2,
    Tag,
    AlertTriangle,
    Settings,
    AlertCircle,
    MenuSquare,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops, useInventory, InventoryProvider } from "@/components/shared";
import type { Product } from "@/lib/constants";
import type {
    MealPrepShopConfig,
    MealPrepPackage,
    MealPrepDynamicCategory,
    MealPrepExtraItem,
    MealPrepRule,
} from "@/lib/types/meal-prep.types";
import { v4 as uuidv4 } from "uuid";

type Tab = "packages" | "categories" | "rules";

// Separamos el contenido para poder usar el contexto de inventario
function MealPrepSettingsContent() {
    const { user, isLoading: authLoading } = useAuth();
    const { getShop, updateShop, isLoading: shopsLoading } = useShops();
    const { products } = useInventory(); // Extraer catálogo para sugerencias de categorías

    const [activeTab, setActiveTab] = useState<Tab>("packages");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Status
    const [packages, setPackages] = useState<MealPrepPackage[]>([]);
    const [categories, setCategories] = useState<MealPrepDynamicCategory[]>([]);
    const [extras, setExtras] = useState<MealPrepExtraItem[]>([]);
    const [rules, setRules] = useState<MealPrepRule[]>([]);
    const [customInstructionsEnabled, setCustomInstructionsEnabled] = useState(false);

    // Get unique existing categories from catalog
    const existingCatalogCategories = useMemo(() => {
        const uniqueCats = new Set<string>();
        products.forEach(p => {
            if (p.category && p.category !== "meal_prep_package") {
                uniqueCats.add(p.category);
            }
        });
        return Array.from(uniqueCats).sort();
    }, [products]);

    // Load from Firestore
    useEffect(() => {
        if (user?.shopId && !shopsLoading) {
            const shop = getShop(user.shopId);
            if (shop?.mealPrepConfig) {
                setPackages(shop.mealPrepConfig.packages || []);
                setCategories(shop.mealPrepConfig.categories || []);
                setExtras(shop.mealPrepConfig.extras || []);
                setRules(shop.mealPrepConfig.rules || []);
                setCustomInstructionsEnabled(
                    shop.mealPrepConfig.customInstructionsEnabled ?? false
                );
            }
        }
    }, [user?.shopId, shopsLoading, getShop]);

    if (authLoading || shopsLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const handleSave = async () => {
        if (!user?.shopId) return;

        setIsSaving(true);
        try {
            const mealPrepConfig: MealPrepShopConfig = {
                packages,
                categories,
                extras,
                rules,
                customInstructionsEnabled,
            };

            await updateShop(user.shopId, { mealPrepConfig });

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error("Error saving meal prep config:", err);
            alert("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    // Load Defaults
    const loadDefaults = () => {
        // Paquetes Base
        const defaultPackages: MealPrepPackage[] = [
            { id: uuidv4(), name: "Paquete de 3 platos", mealsPerWeek: 3, daysPerWeek: 1, price: 13, isActive: true },
            { id: uuidv4(), name: "Paquete de 4 platos", mealsPerWeek: 4, daysPerWeek: 1, price: 13, isActive: true },
            { id: uuidv4(), name: "Paquete de 5 platos", mealsPerWeek: 5, daysPerWeek: 1, price: 13, isActive: true },
            { id: uuidv4(), name: "Paquete de 6 platos", mealsPerWeek: 6, daysPerWeek: 1, price: 13, isActive: true },
        ];

        // Categorías Comunes
        const proteinsId = uuidv4();
        const carbsId = uuidv4();
        const veggiesId = uuidv4();
        const premiumProteinsId = uuidv4();

        const defaultCategories: MealPrepDynamicCategory[] = [
            { id: proteinsId, name: "Proteínas", isPremium: false, isRequired: true, selectionLimit: 1, extraPrice: 0 },
            { id: carbsId, name: "Carbohidratos", isPremium: false, isRequired: false, selectionLimit: 1, extraPrice: 0 },
            { id: veggiesId, name: "Vegetales", isPremium: false, isRequired: false, selectionLimit: 1, extraPrice: 0 },
            { id: premiumProteinsId, name: "Proteínas Premium", isPremium: true, isRequired: false, selectionLimit: 1, extraPrice: 0 },
        ];

        // Extras (Proteínas Premium Base)
        const defaultExtras: MealPrepExtraItem[] = [
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Res Premium", price: 1, isActive: true },
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Camarones", price: 5, isActive: true },
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Salmón", price: 7, isActive: true },
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Churrasco", price: 6, isActive: true },
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Filete Mignon", price: 7, isActive: true },
            { id: uuidv4(), categoryId: premiumProteinsId, name: "Steak / Filete", price: 5, isActive: true },
        ];

        // Reglas Base (Ejemplo: Si eliges proteina normal, no puedes elegir proteina premium)
        const defaultRules: MealPrepRule[] = [
            { id: uuidv4(), type: "exclude", sourceCategoryId: proteinsId, targetCategoryId: premiumProteinsId }
        ];

        setPackages(defaultPackages);
        setCategories(defaultCategories);
        setExtras(defaultExtras);
        setRules(defaultRules);

        // Save automatically after loading defaults
        setTimeout(() => {
            alert("Ajustes iniciales cargados. No olvides presionar 'Guardar Cambios' para aplicarlos en tu tienda en vivo.");
        }, 300);
    };

    // ======================
    // PACKAGES LOGIC
    // ======================
    const addPackage = () => {
        setPackages([
            ...packages,
            {
                id: uuidv4(),
                name: "Nuevo Paquete",
                mealsPerWeek: 3,
                daysPerWeek: 1,
                price: 39,
                isActive: true,
            },
        ]);
    };

    const updatePackage = (id: string, field: keyof MealPrepPackage, value: any) => {
        setPackages(
            packages.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
    };

    const deletePackage = (id: string) => {
        setPackages(packages.filter((p) => p.id !== id));
    };

    // ======================
    // CATEGORIES LOGIC
    // ======================
    const addCategory = () => {
        setCategories([
            ...categories,
            {
                id: uuidv4(),
                name: "Nueva Categoría",
                isPremium: false,
                isRequired: false,
                selectionLimit: 1,
                extraPrice: 0,
            },
        ]);
    };

    const updateCategory = (id: string, field: keyof MealPrepDynamicCategory, value: any) => {
        setCategories(
            categories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    };

    const deleteCategory = (id: string) => {
        setCategories(categories.filter((c) => c.id !== id));
        setExtras(extras.filter((e) => e.categoryId !== id));
        setRules(rules.filter((r) => r.sourceCategoryId !== id && r.targetCategoryId !== id));
    };

    // ======================
    // EXTRAS LOGIC
    // ======================
    const addExtra = (categoryId: string) => {
        setExtras([
            ...extras,
            {
                id: uuidv4(),
                name: "Ingrediente",
                price: 0,
                categoryId,
                isActive: true,
            },
        ]);
    };

    const updateExtra = (id: string, field: keyof MealPrepExtraItem, value: any) => {
        setExtras(
            extras.map((e) => (e.id === id ? { ...e, [field]: value } : e))
        );
    };

    const deleteExtra = (id: string) => {
        setExtras(extras.filter((e) => e.id !== id));
    };

    // ======================
    // RULES LOGIC
    // ======================
    const addRule = () => {
        if (categories.length < 2) return alert("Necesitas al menos 2 categorías para crear reglas.");
        setRules([
            ...rules,
            {
                id: uuidv4(),
                type: "exclude",
                sourceCategoryId: categories[0].id,
                targetCategoryId: categories[1].id,
            },
        ]);
    };

    const updateRule = (id: string, field: keyof MealPrepRule, value: any) => {
        setRules(rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const deleteRule = (id: string) => {
        setRules(rules.filter((r) => r.id !== id));
    };

    return (
        <div className="max-w-5xl mx-auto md:px-6 px-4 py-8 space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" />
                        Configuración Meal Prep
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Gestiona tus paquetes de comida, categorías de ingredientes, extras y exclusiones.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Botón para cargar defaults (útil para migración inicial) */}
                    {(packages.length === 0 && categories.length === 0) && (
                        <Button
                            onClick={loadDefaults}
                            variant="outline"
                            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                        >
                            <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                            Cargar Ajustes Predeterminados
                        </Button>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white min-w-[140px]"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isSaved ? (
                            <Check className="w-5 h-5 mr-2" />
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        {isSaved ? "Guardado" : "Guardar Cambios"}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5 w-fit overflow-x-auto max-w-full">
                <button
                    onClick={() => setActiveTab("packages")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === "packages"
                        ? "bg-primary text-white shadow-lg"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <Package className="w-4 h-4" />
                    Paquetes Base
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === "categories"
                        ? "bg-primary text-white shadow-lg"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <MenuSquare className="w-4 h-4" />
                    Categorías e Ingredientes
                </button>
                <button
                    onClick={() => setActiveTab("rules")}
                    className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${activeTab === "rules"
                        ? "bg-primary text-white shadow-lg"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Lógica & Reglas
                </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 md:p-6">
                {/* PACKAGES TAB */}
                {activeTab === "packages" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Paquetes Disponibles</h2>
                                <p className="text-sm text-zinc-400">
                                    Agrega los paquetes que los clientes pueden elegir (ej: 4 comidas a la semana).
                                </p>
                            </div>
                            <Button onClick={addPackage} variant="outline" className="border-dashed border-zinc-700 bg-black/20 text-white w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Paquete
                            </Button>
                        </div>

                        {packages.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-zinc-400">No hay paquetes configurados</h3>
                                <p className="text-sm text-zinc-500 mb-4">Empieza agregando tu primer paquete base.</p>
                                <Button onClick={addPackage} variant="outline" className="text-white border-zinc-700">Agregar Paquete</Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-end md:items-start justify-between gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1 block">Nombre del Paquete</label>
                                                <input
                                                    type="text"
                                                    value={pkg.name}
                                                    onChange={(e) => updatePackage(pkg.id, "name", e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                    placeholder="Ej: Plan Mantenimiento"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1 block">Comidas por semana</label>
                                                <input
                                                    type="number"
                                                    value={pkg.mealsPerWeek}
                                                    onChange={(e) => updatePackage(pkg.id, "mealsPerWeek", Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1 block">Días de Entrega</label>
                                                <input
                                                    type="number"
                                                    value={pkg.daysPerWeek}
                                                    onChange={(e) => updatePackage(pkg.id, "daysPerWeek", Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500 mb-1 block">Precio Total ($)</label>
                                                <input
                                                    type="number"
                                                    value={pkg.price}
                                                    onChange={(e) => updatePackage(pkg.id, "price", Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => deletePackage(pkg.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 md:mt-6 shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === "categories" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Categorías de Menú</h2>
                                <p className="text-sm text-zinc-400">
                                    Crea opciones como "Proteínas", "Carbohidratos" y asocia ingredientes y cobros extras.
                                </p>
                            </div>
                            <Button onClick={addCategory} variant="outline" className="border-dashed border-zinc-700 bg-black/20 text-white w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Categoría
                            </Button>
                        </div>

                        {categories.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                                <MenuSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-zinc-400">No hay categorías</h3>
                                <p className="text-sm text-zinc-500 mb-4">Empieza agregando tu primera categoría de inventario.</p>
                                <Button onClick={addCategory} variant="outline" className="text-white border-zinc-700">Agregar Categoría</Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Datalist para sugerir categorías del catálogo real */}
                                <datalist id="catalog-categories">
                                    {existingCatalogCategories.map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>

                                {categories.map((cat) => (
                                    <div key={cat.id} className="p-4 md:p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                                        {/* Category Header */}
                                        <div className="flex flex-col md:flex-row items-end md:items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Nombre de Categoría</label>
                                                    <input
                                                        type="text"
                                                        list="catalog-categories"
                                                        value={cat.name}
                                                        onChange={(e) => updateCategory(cat.id, "name", e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                        placeholder="Elige o escribe (Ej: Proteínas)"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Límite de Selección (por plato)</label>
                                                    <input
                                                        type="number"
                                                        value={cat.selectionLimit || 1}
                                                        onChange={(e) => updateCategory(cat.id, "selectionLimit", Number(e.target.value))}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 md:mt-6 bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                                                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white">
                                                        <input
                                                            type="checkbox"
                                                            checked={cat.isRequired}
                                                            onChange={(e) => updateCategory(cat.id, "isRequired", e.target.checked)}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary focus:ring-offset-zinc-950"
                                                        />
                                                        Es obligatoria
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white">
                                                        <input
                                                            type="checkbox"
                                                            checked={cat.isPremium}
                                                            onChange={(e) => updateCategory(cat.id, "isPremium", e.target.checked)}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-zinc-950"
                                                        />
                                                        Es Premium ⭐
                                                    </label>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-500 mb-1 block">Precio Extra (Opcional $)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                                                        <input
                                                            type="number"
                                                            value={cat.extraPrice || 0}
                                                            onChange={(e) => updateCategory(cat.id, "extraPrice", Number(e.target.value))}
                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 mt-1">Precio para añadir esta categoría o desbloquearla.</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => deleteCategory(cat.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 shrink-0"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        {/* Category Extras */}
                                        <div className="pl-2 md:pl-4 border-l-2 border-zinc-800 space-y-3">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                                    <Tag className="w-4 h-4" /> Elementos / Ingredientes
                                                </h4>
                                                <Button
                                                    onClick={() => addExtra(cat.id)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-primary hover:text-primary hover:bg-primary/10 w-fit"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" /> Nuevo Ingrediente
                                                </Button>
                                            </div>

                                            {extras.filter((e) => e.categoryId === cat.id).length === 0 ? (
                                                <p className="text-xs text-zinc-600 italic py-2">No hay ingredientes registrados en esta categoría.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                                    {extras
                                                        .filter((e) => e.categoryId === cat.id)
                                                        .map((extra) => (
                                                            <div key={extra.id} className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-white/5">
                                                                <input
                                                                    type="text"
                                                                    value={extra.name}
                                                                    onChange={(e) => updateExtra(extra.id, "name", e.target.value)}
                                                                    className="flex-1 bg-transparent border-0 px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary rounded"
                                                                    placeholder="Nombre..."
                                                                />
                                                                <div className="relative w-24 shrink-0">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                                                                    <input
                                                                        type="number"
                                                                        value={extra.price}
                                                                        onChange={(e) => updateExtra(extra.id, "price", Number(e.target.value))}
                                                                        className="w-full bg-zinc-950 border border-zinc-700 rounded pl-6 pr-2 py-1 text-white text-sm focus:outline-none focus:border-primary"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={() => deleteExtra(extra.id)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RULES TAB */}
                {activeTab === "rules" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Lógica y Reglas</h2>
                                <p className="text-sm text-zinc-400">
                                    Aplica condiciones al menú. Ej: "Si seleccionan una Proteína Premium, ocultar Frutas".
                                </p>
                            </div>
                            <Button onClick={addRule} variant="outline" className="border-dashed border-zinc-700 bg-black/20 text-white w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Regla
                            </Button>
                        </div>

                        {/* Custom Special Requests Switch */}
                        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between mb-8 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setCustomInstructionsEnabled(!customInstructionsEnabled)}>
                            <div>
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary" />
                                    Permitir Platos Personalizados (Notas libres)
                                </h3>
                                <p className="text-sm text-zinc-400 mt-1">Si está activo, el cliente podrá escribir instrucciones libres fuera del flujo.</p>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${customInstructionsEnabled ? "bg-primary" : "bg-zinc-700"}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customInstructionsEnabled ? "translate-x-6" : "translate-x-1"}`} />
                            </div>
                        </div>

                        {rules.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                                <Zap className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-zinc-400">No hay reglas condicionales</h3>
                                <p className="text-sm text-zinc-500 mb-4">Haz tu menú dinámico con exclusiones o cobros extra condicionales.</p>
                                <Button onClick={addRule} variant="outline" className="text-white border-zinc-700">Agregar Regla</Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-center gap-4">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/10 shrink-0 self-start md:self-center">
                                            <AlertCircle className="w-5 h-5 text-indigo-400" />
                                        </div>

                                        <div className="flex flex-col md:flex-row items-start md:items-center flex-wrap gap-3 flex-1 w-full">
                                            <span className="text-sm text-zinc-400 shrink-0">Si el cliente elige de</span>
                                            <select
                                                value={rule.sourceCategoryId}
                                                onChange={(e) => updateRule(rule.id, "sourceCategoryId", e.target.value)}
                                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary w-full md:w-auto"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>

                                            <span className="text-sm text-zinc-400 shrink-0">, entonces</span>
                                            <select
                                                value={rule.type}
                                                onChange={(e) => updateRule(rule.id, "type", e.target.value)}
                                                className="bg-indigo-900/20 text-indigo-300 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none w-full md:w-auto"
                                            >
                                                <option value="exclude">Ocultar</option>
                                                <option value="require">Requerir obligatoriamente</option>
                                                <option value="surcharge">Aplicar cobro extra a</option>
                                            </select>

                                            <span className="text-sm text-zinc-400 shrink-0">la categoría</span>
                                            <select
                                                value={rule.targetCategoryId}
                                                onChange={(e) => updateRule(rule.id, "targetCategoryId", e.target.value)}
                                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary w-full md:w-auto"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>

                                            {rule.type === "surcharge" && (
                                                <div className="relative w-full md:w-auto md:ml-2">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                                                    <input
                                                        type="number"
                                                        value={rule.surchargeAmount || 0}
                                                        onChange={(e) => updateRule(rule.id, "surchargeAmount", Number(e.target.value))}
                                                        className="w-full md:w-28 bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary"
                                                        placeholder="Monto"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => deleteRule(rule.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="w-8 h-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 shrink-0 self-end md:self-center"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrapper para inyectar InventoryContext y usar sus hooks
export default function MealPrepSettingsPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!user?.shopId) {
        return <div className="p-8 text-center text-red-400">Error: Tienda no encontrada.</div>;
    }

    // Importante tener a mano useAuth para inyectar shopId
    return (
        <InventoryProvider shopId={user.shopId}>
            <MealPrepSettingsContent />
        </InventoryProvider>
    );
}

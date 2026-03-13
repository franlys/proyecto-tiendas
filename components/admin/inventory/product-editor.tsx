"use client";

import { useState, useEffect } from "react";
import { Product, ProductVariant, ProductCategory, PRODUCT_CATEGORY_LABELS, ProductExtra, MealPlate, ProductColor } from "@/lib/constants";
import type { ProductExtra as ProductExtraType } from "@/lib/types/product-extra.types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Tag, Palette, Check } from "lucide-react";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
    CustomCategory,
    CATEGORY_COLOR_PRESETS,
    DEFAULT_CATEGORY_COLORS,
    generateCategoryId
} from "@/lib/types/custom-category.types";
import { cn } from "@/lib/utils";

interface ProductEditorProps {
    product?: Product; // If null, creating new
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    shopId: string; // Required for image uploads
    hideStock?: boolean; // For menu-only businesses (meal prep, etc.)
    allProducts?: Product[]; // For selecting components for predefined plates
    businessType?: string; // Business type to determine which sections to show
}

// Food business types that should show Extras/Toppings section
const FOOD_BUSINESS_TYPES = [
    "restaurante",
    "restaurant", // legacy
    "cafeteria",
    "bar",
    "pasteleria",
    "food_truck",
    "meal_prep",
];

// Extended product with custom category support
interface ExtendedProduct extends Omit<Product, 'category'> {
    category: ProductCategory | string;
    customCategory?: string; // The display name for custom categories
    categoryColors?: {
        backgroundColor: string;
        textColor: string;
    };
    // Meal Prep support
    plateCount?: number;
    isCustomizable?: boolean;
    allowedComponentCategories?: string[];
    predefinedPlates?: MealPlate[];
    infiniteStock?: boolean;
}

const EMPTY_PRODUCT: ExtendedProduct = {
    id: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    lowStockThreshold: 5,
    category: "otros",
    image: "https://via.placeholder.com/400",
    infiniteStock: false,
    predefinedPlates: [],
    variants: [],
    colors: [],
    extras: [],
    extrasRequired: false,
    maxExtras: undefined,
    plateCount: undefined,
    isCustomizable: false,
    allowedComponentCategories: [],
};

export function ProductEditor({ product, isOpen, onClose, onSave, shopId, hideStock = false, allProducts = [], businessType = "" }: ProductEditorProps) {
    // Determine if this is a food business (should show Extras/Toppings)
    const isFoodBusiness = FOOD_BUSINESS_TYPES.includes(businessType.toLowerCase());
    const [formData, setFormData] = useState<ExtendedProduct>(EMPTY_PRODUCT);
    const [hasVariants, setHasVariants] = useState(false);
    const [hasColors, setHasColors] = useState(false);
    const [hasExtras, setHasExtras] = useState(false);
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryBgColor, setNewCategoryBgColor] = useState(DEFAULT_CATEGORY_COLORS.backgroundColor);
    const [newCategoryTextColor, setNewCategoryTextColor] = useState(DEFAULT_CATEGORY_COLORS.textColor);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Load custom categories for this shop
    useEffect(() => {
        async function loadCustomCategories() {
            if (!shopId) return;
            try {
                const docRef = doc(db, "shops", shopId, "settings", "categories");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const cats = data.customCategories || [];
                    // Handle backwards compatibility: convert old string[] format to CustomCategory[]
                    const normalizedCats: CustomCategory[] = cats.map((cat: string | CustomCategory) => {
                        if (typeof cat === 'string') {
                            return {
                                id: generateCategoryId(cat),
                                name: cat,
                                backgroundColor: DEFAULT_CATEGORY_COLORS.backgroundColor,
                                textColor: DEFAULT_CATEGORY_COLORS.textColor,
                            };
                        }
                        return cat;
                    });
                    setCustomCategories(normalizedCats);
                }
            } catch (error) {
                console.error("Error loading custom categories:", error);
            }
        }
        if (isOpen) {
            loadCustomCategories();
        }
    }, [shopId, isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData(product as ExtendedProduct);
                setHasVariants(!!(product.variants && product.variants.length > 0));
                setHasColors(!!(product.colors && product.colors.length > 0));
                setHasExtras(!!(product.extras && product.extras.length > 0));
                // Check if product has a custom category
                const isCustom = !Object.keys(PRODUCT_CATEGORY_LABELS).includes(product.category);
                if (isCustom) {
                    setShowNewCategoryInput(false); // Already has custom, just show it in dropdown
                }
            } else {
                setFormData({ ...EMPTY_PRODUCT, id: `new-${Date.now()}` });
                setHasVariants(false);
                setHasColors(false);
                setHasExtras(false);
                setShowNewCategoryInput(false);
                setNewCategoryName("");
                setNewCategoryBgColor(DEFAULT_CATEGORY_COLORS.backgroundColor);
                setNewCategoryTextColor(DEFAULT_CATEGORY_COLORS.textColor);
                setShowColorPicker(false);
            }
        }
    }, [isOpen, product]);

    // Save new custom category to Firestore
    const saveCustomCategory = async (categoryName: string, bgColor: string, textColor: string): Promise<CustomCategory | null> => {
        if (!shopId || !categoryName.trim()) return null;

        const normalizedName = categoryName.trim();
        const categoryId = generateCategoryId(normalizedName);

        // Don't add duplicates
        if (customCategories.some(c => c.id === categoryId)) return null;

        const newCategory: CustomCategory = {
            id: categoryId,
            name: normalizedName,
            backgroundColor: bgColor,
            textColor: textColor,
        };

        const newCategories = [...customCategories, newCategory];

        try {
            const docRef = doc(db, "shops", shopId, "settings", "categories");
            await setDoc(docRef, { customCategories: newCategories }, { merge: true });
            setCustomCategories(newCategories);
            return newCategory;
        } catch (error) {
            console.error("Error saving custom category:", error);
            return null;
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === "__new__") {
            setShowNewCategoryInput(true);
            setShowColorPicker(false);
            setNewCategoryBgColor(DEFAULT_CATEGORY_COLORS.backgroundColor);
            setNewCategoryTextColor(DEFAULT_CATEGORY_COLORS.textColor);
            setFormData({ ...formData, category: "otros", categoryColors: undefined });
        } else {
            setShowNewCategoryInput(false);
            setShowColorPicker(false);
            // Check if it's a custom category and get its colors
            const customCat = customCategories.find(c => c.id === value);
            if (customCat) {
                setFormData({
                    ...formData,
                    category: value,
                    customCategory: customCat.name,
                    categoryColors: {
                        backgroundColor: customCat.backgroundColor,
                        textColor: customCat.textColor,
                    }
                });
            } else {
                setFormData({ ...formData, category: value, customCategory: undefined, categoryColors: undefined });
            }
        }
    };

    const handleAddCustomCategory = async () => {
        if (newCategoryName.trim()) {
            const savedCategory = await saveCustomCategory(
                newCategoryName.trim(),
                newCategoryBgColor,
                newCategoryTextColor
            );
            if (savedCategory) {
                setFormData({
                    ...formData,
                    category: savedCategory.id,
                    customCategory: savedCategory.name,
                    categoryColors: {
                        backgroundColor: savedCategory.backgroundColor,
                        textColor: savedCategory.textColor,
                    }
                });
            }
            setShowNewCategoryInput(false);
            setShowColorPicker(false);
            setNewCategoryName("");
            setNewCategoryBgColor(DEFAULT_CATEGORY_COLORS.backgroundColor);
            setNewCategoryTextColor(DEFAULT_CATEGORY_COLORS.textColor);
        }
    };

    const handleColorPresetClick = (bg: string, text: string) => {
        setNewCategoryBgColor(bg);
        setNewCategoryTextColor(text);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Clean up variants and extras if disabled
        const cleanData = {
            ...formData,
            variants: hasVariants ? formData.variants : [],
            colors: hasColors ? formData.colors : [],
            extras: hasExtras ? formData.extras : [],
            extrasRequired: hasExtras ? formData.extrasRequired : false,
            maxExtras: hasExtras ? formData.maxExtras : undefined,
        };
        onSave(cleanData as Product);
    };

    // Color management functions
    const addColor = () => {
        const newColor: ProductColor = {
            id: `c-${Date.now()}`,
            name: "",
            hex: "#000000",
        };
        setFormData({
            ...formData,
            colors: [...(formData.colors || []), newColor],
        });
    };

    const updateColor = (index: number, field: keyof ProductColor, value: any) => {
        const newColors = [...(formData.colors || [])];
        newColors[index] = { ...newColors[index], [field]: value };
        setFormData({ ...formData, colors: newColors });
    };

    const removeColor = (index: number) => {
        const newColors = [...(formData.colors || [])];
        newColors.splice(index, 1);
        setFormData({ ...formData, colors: newColors });
    };

    // Extra management functions
    const addExtra = () => {
        const newExtra: ProductExtraType = {
            id: `extra-${Date.now()}`,
            name: "",
            price: 0,
            available: true,
            maxQuantity: 1,
        };
        setFormData({
            ...formData,
            extras: [...(formData.extras || []), newExtra],
        });
    };

    const updateExtra = (index: number, field: keyof ProductExtraType, value: any) => {
        const newExtras = [...(formData.extras || [])];
        newExtras[index] = { ...newExtras[index], [field]: value };
        setFormData({ ...formData, extras: newExtras });
    };

    const removeExtra = (index: number) => {
        const newExtras = [...(formData.extras || [])];
        newExtras.splice(index, 1);
        setFormData({ ...formData, extras: newExtras });
    };

    const addVariant = () => {
        const newVariant: ProductVariant = {
            id: `v-${Date.now()}`,
            name: "",
            price: formData.price,
            wholesalePrice: formData.wholesalePrice,
            stock: 0,
        };
        setFormData({
            ...formData,
            variants: [...(formData.variants || []), newVariant],
        });
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...(formData.variants || [])];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index: number) => {
        const newVariants = [...(formData.variants || [])];
        newVariants.splice(index, 1);
        setFormData({ ...formData, variants: newVariants });
    };

    // Get display name for a category
    const getCategoryLabel = (category: string): string => {
        // Check if it's a predefined category
        if (PRODUCT_CATEGORY_LABELS[category as ProductCategory]) {
            return PRODUCT_CATEGORY_LABELS[category as ProductCategory];
        }
        // Check if it's in custom categories or has customCategory field
        if (formData.customCategory) {
            return formData.customCategory;
        }
        // Try to find in custom categories list
        const customCat = customCategories.find(c => c.id === category);
        return customCat?.name || category;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-white">
                                    {product ? "Editar Producto" : "Nuevo Producto"}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre del Producto</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ej. Ramillete de Rosas"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Descripción</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Detalles del producto, materiales..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Categoría</label>
                                            <select
                                                value={showNewCategoryInput ? "__new__" : formData.category}
                                                onChange={(e) => handleCategoryChange(e.target.value)}
                                                className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none [&>option]:bg-zinc-800 [&>option]:text-white [&>optgroup]:bg-zinc-800 [&>optgroup]:text-zinc-400"
                                            >
                                                {/* Predefined categories */}
                                                <optgroup label="Categorías Predefinidas">
                                                    {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </optgroup>

                                                {/* Custom categories for this shop */}
                                                {customCategories.length > 0 && (
                                                    <optgroup label="Mis Categorías">
                                                        {customCategories.map((cat) => (
                                                            <option
                                                                key={cat.id}
                                                                value={cat.id}
                                                            >
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                )}

                                                {/* Option to add new */}
                                                <optgroup label="─────────">
                                                    <option value="__new__">+ Crear nueva categoría...</option>
                                                </optgroup>
                                            </select>

                                            {/* New category input */}
                                            {showNewCategoryInput && (
                                                <div className="space-y-3 mt-2 p-3 bg-zinc-800/50 rounded-lg border border-indigo-500/30">
                                                    {/* Name input */}
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                            <input
                                                                type="text"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                placeholder="Ej. Arreglos Florales"
                                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Color picker toggle */}
                                                    <div className="flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                                            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                                                        >
                                                            <Palette className="w-4 h-4" />
                                                            Personalizar color
                                                        </button>
                                                        {/* Preview badge */}
                                                        <span
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: newCategoryBgColor,
                                                                color: newCategoryTextColor
                                                            }}
                                                        >
                                                            {newCategoryName || "Vista previa"}
                                                        </span>
                                                    </div>

                                                    {/* Color presets */}
                                                    {showColorPicker && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-zinc-500">Elige un color:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {CATEGORY_COLOR_PRESETS.map((preset) => (
                                                                    <button
                                                                        key={preset.name}
                                                                        type="button"
                                                                        onClick={() => handleColorPresetClick(preset.bg, preset.text)}
                                                                        className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
                                                                        style={{ backgroundColor: preset.bg }}
                                                                        title={preset.name}
                                                                    >
                                                                        {newCategoryBgColor === preset.bg && (
                                                                            <Check
                                                                                className="absolute inset-0 m-auto w-4 h-4"
                                                                                style={{ color: preset.text }}
                                                                            />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {/* Custom color input */}
                                                            <div className="flex gap-2 items-center mt-2">
                                                                <label className="text-xs text-zinc-500">Color personalizado:</label>
                                                                <input
                                                                    type="color"
                                                                    value={newCategoryBgColor}
                                                                    onChange={(e) => setNewCategoryBgColor(e.target.value)}
                                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                                                />
                                                                <select
                                                                    value={newCategoryTextColor}
                                                                    onChange={(e) => setNewCategoryTextColor(e.target.value)}
                                                                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white [&>option]:bg-zinc-900 [&>option]:text-white"
                                                                >
                                                                    <option value="#ffffff">Texto Blanco</option>
                                                                    <option value="#000000">Texto Negro</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Add button */}
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCustomCategory}
                                                        disabled={!newCategoryName.trim()}
                                                        className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Crear Categoría
                                                    </button>
                                                </div>
                                            )}

                                            {/* Show current custom category if selected */}
                                            {!showNewCategoryInput && formData.customCategory && (
                                                <p className="text-xs text-indigo-400 flex items-center gap-1">
                                                    <Tag className="w-3 h-3" />
                                                    Categoría personalizada: {formData.customCategory}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Imagen del Producto</label>
                                            <FirebaseImageUpload
                                                value={formData.image}
                                                onChange={(url) => setFormData({ ...formData, image: url })}
                                                folder="products"
                                                shopId={shopId}
                                                aspectRatio="square"
                                                maxSizeMB={10}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-zinc-800 my-6" />

                                {/* Pricing & Stock Strategy */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">{hideStock ? 'Precios' : 'Precios e Inventario'}</h3>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="hasColors"
                                                checked={hasColors}
                                                onChange={(e) => setHasColors(e.target.checked)}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-cyan-500 focus:ring-cyan-500"
                                            />
                                            <label htmlFor="hasColors" className="text-sm text-zinc-300 cursor-pointer select-none">
                                                Colores Disponibles
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="infiniteStock"
                                                checked={formData.infiniteStock}
                                                onChange={(e) => setFormData({ ...formData, infiniteStock: e.target.checked })}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <label htmlFor="infiniteStock" className="text-sm text-zinc-300 cursor-pointer select-none">
                                                Stock Infinito (Menú)
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="hasVariants"
                                                checked={hasVariants}
                                                onChange={(e) => setHasVariants(e.target.checked)}
                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="hasVariants" className="text-sm text-zinc-300 cursor-pointer select-none">
                                                Variantes (Capacidades, Modelos)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Colors Section */}
                                {hasColors && (
                                    <div className="space-y-4 mb-6 relative">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.colors?.map((color, index) => (
                                                <div key={color.id} className="flex gap-4 p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50 relative overflow-hidden group">
                                                    {/* Color Image Upload */}
                                                    <div className="w-24 shrink-0">
                                                        <FirebaseImageUpload
                                                            value={color.image}
                                                            onChange={(url) => updateColor(index, "image", url)}
                                                            folder="colors"
                                                            shopId={shopId}
                                                            aspectRatio="square"
                                                            maxSizeMB={5}
                                                            label="Foto Color"
                                                        />
                                                    </div>
                                                    {/* Color Info */}
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <label className="block text-xs text-zinc-500 mb-1">Nombre del Color</label>
                                                            <input
                                                                type="text"
                                                                value={color.name}
                                                                onChange={(e) => updateColor(index, "name", e.target.value)}
                                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                                placeholder="Ej. Titanio Natural"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="block text-xs text-zinc-500 min-w-16">Hex Color</label>
                                                            <input
                                                                type="color"
                                                                value={color.hex}
                                                                onChange={(e) => updateColor(index, "hex", e.target.value)}
                                                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0 p-0"
                                                            />
                                                            <span className="text-xs text-zinc-500 font-mono uppercase bg-zinc-900 px-2 py-1 rounded border border-zinc-700">{color.hex || '#000000'}</span>
                                                        </div>
                                                    </div>
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColor(index)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all font-bold"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addColor}
                                            className="flex items-center justify-center w-full gap-2 p-3 border-2 border-dashed border-cyan-700/50 text-cyan-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 rounded-xl font-medium transition-all"
                                        >
                                            <Plus size={18} /> Añadir Nuevo Color
                                        </button>
                                    </div>
                                )}

                                {(!hasVariants) ? (
                                    /* Simple Product Strategy (or menu-only mode) */
                                    <div className={`grid ${hideStock ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-4 bg-zinc-800/50 p-4 rounded-xl border border-zinc-800`}>
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Precio Público</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-amber-500/80 mb-1">P. Mayoreo</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.wholesalePrice || ""}
                                                onChange={(e) => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white placeholder-zinc-600"
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        {!hideStock && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Stock Actual</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.stock}
                                                        disabled={formData.infiniteStock}
                                                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white disabled:opacity-50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-red-400 mb-1">Alerta Mín.</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.lowStockThreshold}
                                                        disabled={formData.infiniteStock}
                                                        onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white disabled:opacity-50"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    /* Variants Strategy */
                                    <div className="space-y-4">
                                        {formData.variants?.map((variant, index) => (
                                            <div key={variant.id} className="flex gap-2 items-end bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                                <div className="flex-1">
                                                    <label className="block text-xs text-zinc-500 mb-1">Nombre Variante</label>
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => updateVariant(index, "name", e.target.value)}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                        placeholder="Ej. Talla M / Calidad A"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-xs text-zinc-500 mb-1">Precio</label>
                                                    <input
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(index, "price", Number(e.target.value))}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-xs text-amber-500/70 mb-1">Mayoreo</label>
                                                    <input
                                                        type="number"
                                                        value={variant.wholesalePrice || ""}
                                                        onChange={(e) => updateVariant(index, "wholesalePrice", Number(e.target.value))}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                    />
                                                </div>
                                                {!hideStock && (
                                                    <div className="w-20">
                                                        <label className="block text-xs text-zinc-500 mb-1">Stock</label>
                                                        <input
                                                            type="number"
                                                            value={variant.stock || 0}
                                                            disabled={formData.infiniteStock}
                                                            onChange={(e) => updateVariant(index, "stock", Number(e.target.value))}
                                                            className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm text-center disabled:opacity-50"
                                                        />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(index)}
                                                    className="p-2 mb-0.5 text-red-400 hover:bg-red-500/20 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
                                        >
                                            <Plus size={16} /> Añadir Variante
                                        </button>
                                    </div>
                                )}

                                <div className="h-px bg-zinc-800 my-6" />

                                {/* Extras Section - Only for food businesses */}
                                {isFoodBusiness && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white">Extras / Toppings</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Toggle switch style for better visibility */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setHasExtras(!hasExtras)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${hasExtras ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                                    >
                                                        <span
                                                            className={`${hasExtras ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                                        />
                                                    </button>
                                                    <span
                                                        onClick={() => setHasExtras(!hasExtras)}
                                                        className="text-sm text-zinc-300 cursor-pointer select-none hover:text-white transition-colors"
                                                    >
                                                        Activar Extras (Toppings, Opciones)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {hasExtras && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-zinc-500">
                                                    Agrega extras opcionales que el cliente puede añadir a su pedido (ej: Oreo, Nutella, Queso extra).
                                                </p>

                                                {/* Extras config */}
                                                <div className="flex gap-4 items-center bg-zinc-800/30 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="extrasRequired"
                                                            checked={formData.extrasRequired || false}
                                                            onChange={(e) => setFormData({ ...formData, extrasRequired: e.target.checked })}
                                                            className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-indigo-500 focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor="extrasRequired" className="text-sm text-zinc-400 cursor-pointer">
                                                            Obligatorio elegir al menos 1
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-sm text-zinc-400">Máx extras:</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.maxExtras || ""}
                                                            onChange={(e) => setFormData({ ...formData, maxExtras: e.target.value ? Number(e.target.value) : undefined })}
                                                            className="w-16 bg-zinc-900 border-zinc-700 rounded px-2 py-1 text-white text-sm"
                                                            placeholder="∞"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Extras list */}
                                                {formData.extras?.map((extra, index) => (
                                                    <div key={extra.id} className="flex gap-2 items-end bg-zinc-800/30 p-3 rounded-lg border border-zinc-800">
                                                        <div className="flex-1">
                                                            <label className="block text-xs text-zinc-500 mb-1">Nombre del Extra</label>
                                                            <input
                                                                type="text"
                                                                value={extra.name}
                                                                onChange={(e) => updateExtra(index, "name", e.target.value)}
                                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                                placeholder="Ej. Oreo, Nutella, Queso extra"
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="block text-xs text-emerald-400 mb-1">Precio +</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={extra.price}
                                                                onChange={(e) => updateExtra(index, "price", Number(e.target.value))}
                                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm"
                                                            />
                                                        </div>
                                                        <div className="w-20">
                                                            <label className="block text-xs text-zinc-500 mb-1">Máx Cant.</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={extra.maxQuantity || 1}
                                                                onChange={(e) => updateExtra(index, "maxQuantity", Number(e.target.value))}
                                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm text-center"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExtra(index)}
                                                            className="p-2 mb-0.5 text-red-400 hover:bg-red-500/20 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={addExtra}
                                                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1"
                                                >
                                                    <Plus size={16} /> Añadir Extra
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="h-px bg-zinc-800 my-6" />

                                {/* Meal Prep Configuration (Only for menu-only businesses) */}
                                {hideStock && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-white text-emerald-400">Configuración Meal Prep</h3>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isMealPrepPackage"
                                                    checked={!!(formData.plateCount && formData.plateCount > 0)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setFormData({
                                                            ...formData,
                                                            plateCount: isChecked ? 5 : undefined,
                                                            isCustomizable: isChecked ? true : false
                                                        });
                                                    }}
                                                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <label htmlFor="isMealPrepPackage" className="text-sm text-zinc-300 cursor-pointer select-none">
                                                    Es un Paquete de Comidas (Meal Prep)
                                                </label>
                                            </div>
                                        </div>

                                        {(formData.plateCount && formData.plateCount > 0) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-4"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Cantidad de Platos</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={formData.plateCount}
                                                            onChange={(e) => setFormData({ ...formData, plateCount: Number(e.target.value) })}
                                                            className="w-full bg-zinc-900 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                            placeholder="Ej. 5, 10, 15"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id="isCustomizable"
                                                                checked={formData.isCustomizable}
                                                                onChange={(e) => setFormData({ ...formData, isCustomizable: e.target.checked })}
                                                                className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                                                            />
                                                            <label htmlFor="isCustomizable" className="text-sm text-zinc-300 cursor-pointer">
                                                                Personalizable por el cliente
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 mt-1">Si está activo, el cliente podrá elegir los ingredientes.</p>
                                                    </div>
                                                </div>

                                                {formData.isCustomizable && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Categorías permitidas para componentes</label>
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {["Proteínas", "Carbohidratos", "Vegetales", "Frutas", "Postres", "Bebidas"].map((cat) => (
                                                                    <button
                                                                        key={cat}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = formData.allowedComponentCategories || [];
                                                                            if (current.includes(cat)) {
                                                                                setFormData({ ...formData, allowedComponentCategories: current.filter(c => c !== cat) });
                                                                            } else {
                                                                                setFormData({ ...formData, allowedComponentCategories: [...current, cat] });
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                                                            (formData.allowedComponentCategories || []).includes(cat)
                                                                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                                                        )}
                                                                    >
                                                                        {cat}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 italic">
                                                                * El sistema buscará productos en el catálogo que pertenezcan a estas categorías para ofrecerlos como opciones.
                                                            </p>
                                                        </div>

                                                        {/* Predefined Plates Editor */}
                                                        <div className="pt-4 border-t border-zinc-800">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-sm font-semibold text-white">Platos Pre-configurados (Opcional)</h4>
                                                                <p className="text-xs text-zinc-500">Configura ejemplos para el cliente</p>
                                                            </div>

                                                            <div className="space-y-4">
                                                                {Array.from({ length: formData.plateCount || 0 }).map((_, plateIdx) => (
                                                                    <div key={plateIdx} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                                                        <p className="text-xs font-bold text-zinc-500 mb-2 uppercase">Plato {plateIdx + 1}</p>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                            {(formData.allowedComponentCategories || []).map(catName => {
                                                                                const currentPlate = (formData.predefinedPlates || [])[plateIdx] || { id: `plate-${plateIdx + 1}`, components: {} };
                                                                                const selectedValue = currentPlate.components[catName] || "";

                                                                                return (
                                                                                    <div key={catName}>
                                                                                        <label className="block text-[10px] text-zinc-500 mb-1">{catName}</label>
                                                                                        <select
                                                                                            value={selectedValue}
                                                                                            onChange={(e) => {
                                                                                                const newPlates = [...(formData.predefinedPlates || [])];
                                                                                                if (!newPlates[plateIdx]) {
                                                                                                    newPlates[plateIdx] = { id: `plate-${plateIdx + 1}`, components: {} };
                                                                                                }
                                                                                                newPlates[plateIdx].components[catName] = e.target.value;
                                                                                                setFormData({ ...formData, predefinedPlates: newPlates });
                                                                                            }}
                                                                                            className="w-full bg-zinc-800 border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                                                                        >
                                                                                            <option value="">Seleccionar...</option>
                                                                                            {allProducts
                                                                                                .filter(p => p.category === catName || p.id === selectedValue)
                                                                                                .map(p => (
                                                                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                                                                ))
                                                                                            }
                                                                                        </select>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-zinc-900 pb-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all"
                                    >
                                        {product ? "Guardar Cambios" : "Crear Producto"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

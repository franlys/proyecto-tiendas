"use client";

import { useState, useEffect } from "react";
import { Product, ProductVariant, ProductCategory, PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Tag } from "lucide-react";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ProductEditorProps {
    product?: Product; // If null, creating new
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    shopId: string; // Required for image uploads
}

// Extended product with custom category support
interface ExtendedProduct extends Omit<Product, 'category'> {
    category: ProductCategory | string;
    customCategory?: string; // The display name for custom categories
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
    variants: [],
};

export function ProductEditor({ product, isOpen, onClose, onSave, shopId }: ProductEditorProps) {
    const [formData, setFormData] = useState<ExtendedProduct>(EMPTY_PRODUCT);
    const [hasVariants, setHasVariants] = useState(false);
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Load custom categories for this shop
    useEffect(() => {
        async function loadCustomCategories() {
            if (!shopId) return;
            try {
                const docRef = doc(db, "shops", shopId, "settings", "categories");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCustomCategories(data.customCategories || []);
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
                // Check if product has a custom category
                const isCustom = !Object.keys(PRODUCT_CATEGORY_LABELS).includes(product.category);
                if (isCustom) {
                    setShowNewCategoryInput(false); // Already has custom, just show it in dropdown
                }
            } else {
                setFormData({ ...EMPTY_PRODUCT, id: `new-${Date.now()}` });
                setHasVariants(false);
                setShowNewCategoryInput(false);
                setNewCategoryName("");
            }
        }
    }, [isOpen, product]);

    // Save new custom category to Firestore
    const saveCustomCategory = async (categoryName: string) => {
        if (!shopId || !categoryName.trim()) return;

        const normalizedName = categoryName.trim();

        // Don't add duplicates
        if (customCategories.includes(normalizedName)) return;

        const newCategories = [...customCategories, normalizedName];

        try {
            const docRef = doc(db, "shops", shopId, "settings", "categories");
            await setDoc(docRef, { customCategories: newCategories }, { merge: true });
            setCustomCategories(newCategories);
        } catch (error) {
            console.error("Error saving custom category:", error);
        }
    };

    const handleCategoryChange = (value: string) => {
        if (value === "__new__") {
            setShowNewCategoryInput(true);
            setFormData({ ...formData, category: "otros" });
        } else {
            setShowNewCategoryInput(false);
            setFormData({ ...formData, category: value, customCategory: undefined });
        }
    };

    const handleAddCustomCategory = () => {
        if (newCategoryName.trim()) {
            const categoryKey = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
            saveCustomCategory(newCategoryName.trim());
            setFormData({
                ...formData,
                category: categoryKey,
                customCategory: newCategoryName.trim()
            });
            setShowNewCategoryInput(false);
            setNewCategoryName("");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Clean up variants if disabled
        const cleanData = {
            ...formData,
            variants: hasVariants ? formData.variants : [],
        };
        onSave(cleanData as Product);
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
        const customCat = customCategories.find(c =>
            c.toLowerCase().replace(/\s+/g, '-') === category
        );
        return customCat || category;
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
                                                className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                                                key={cat}
                                                                value={cat.toLowerCase().replace(/\s+/g, '-')}
                                                            >
                                                                {cat}
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
                                                <div className="flex gap-2 mt-2">
                                                    <div className="relative flex-1">
                                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                        <input
                                                            type="text"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            placeholder="Ej. Arreglos Florales"
                                                            className="w-full bg-zinc-800 border border-indigo-500/50 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddCustomCategory}
                                                        disabled={!newCategoryName.trim()}
                                                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Agregar
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
                                    <h3 className="text-lg font-semibold text-white">Precios e Inventario</h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="hasVariants"
                                            checked={hasVariants}
                                            onChange={(e) => setHasVariants(e.target.checked)}
                                            className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="hasVariants" className="text-sm text-zinc-300 cursor-pointer select-none">
                                            Este producto tiene variantes (Tallas, Calidades)
                                        </label>
                                    </div>
                                </div>

                                {!hasVariants ? (
                                    /* Simple Product Strategy */
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
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
                                        <div>
                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Stock Actual</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-red-400 mb-1">Alerta Mín.</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.lowStockThreshold}
                                                onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                                                className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white"
                                            />
                                        </div>
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
                                                <div className="w-20">
                                                    <label className="block text-xs text-zinc-500 mb-1">Stock</label>
                                                    <input
                                                        type="number"
                                                        value={variant.stock || 0}
                                                        onChange={(e) => updateVariant(index, "stock", Number(e.target.value))}
                                                        className="w-full bg-zinc-900 border-zinc-700 rounded px-3 py-1.5 text-white text-sm text-center"
                                                    />
                                                </div>
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

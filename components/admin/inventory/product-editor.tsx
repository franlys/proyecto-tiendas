"use client";

import { useState, useEffect } from "react";
import { Product, ProductVariant, ProductCategory, PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";

interface ProductEditorProps {
    product?: Product; // If null, creating new
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Product) => void;
    shopId: string; // Required for image uploads
}

const EMPTY_PRODUCT: Product = {
    id: "",
    name: "",
    description: "",
    price: 0,
    stock: 0,
    lowStockThreshold: 5,
    category: "accesorios",
    image: "https://via.placeholder.com/400",
    variants: [],
};

export function ProductEditor({ product, isOpen, onClose, onSave, shopId }: ProductEditorProps) {
    const [formData, setFormData] = useState<Product>(EMPTY_PRODUCT);
    const [hasVariants, setHasVariants] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                setFormData(product);
                setHasVariants(!!(product.variants && product.variants.length > 0));
            } else {
                setFormData({ ...EMPTY_PRODUCT, id: `new-${Date.now()}` });
                setHasVariants(false);
            }
        }
    }, [isOpen, product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Clean up variants if disabled
        const cleanData = {
            ...formData,
            variants: hasVariants ? formData.variants : [],
        };
        onSave(cleanData);
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
                                            placeholder="Ej. Funda iPhone 15 Pro"
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
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Categoría</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                                                className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
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

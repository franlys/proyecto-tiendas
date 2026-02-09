"use client";

import { useState } from "react";
import { Product, ProductVariant, PRODUCT_CATEGORY_LABELS, ProductCategory } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

// Extended product type with custom category colors
interface ExtendedProduct extends Product {
    customCategory?: string;
    categoryColors?: {
        backgroundColor: string;
        textColor: string;
    };
}

interface ProductListProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
    onUpdateStock: (productId: string, newStock: number, variantId?: string) => void;
}

// Helper to get category display info (handles custom categories with colors)
interface CategoryDisplayInfo {
    label: string;
    backgroundColor?: string;
    textColor?: string;
    isCustom: boolean;
}

function getCategoryDisplayInfo(product: ExtendedProduct): CategoryDisplayInfo {
    // Check if it's a predefined category
    const predefinedLabel = PRODUCT_CATEGORY_LABELS[product.category as ProductCategory];
    if (predefinedLabel) {
        return { label: predefinedLabel, isCustom: false };
    }

    // It's a custom category
    let label: string = product.category;

    // Check for customCategory field
    if (product.customCategory) {
        label = product.customCategory;
    } else {
        // Fallback: capitalize the category key
        label = product.category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    return {
        label,
        backgroundColor: product.categoryColors?.backgroundColor,
        textColor: product.categoryColors?.textColor,
        isCustom: true,
    };
}

export function ProductList({ products, onEdit, onDelete, onUpdateStock }: ProductListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            {products.map((product) => (
                <motion.div
                    key={product.id}
                    layout
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                    {/* Main Card Content */}
                    <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Image */}
                        <div className="h-20 w-20 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {(() => {
                                    const catInfo = getCategoryDisplayInfo(product as ExtendedProduct);
                                    return (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-medium border"
                                            style={catInfo.isCustom && catInfo.backgroundColor ? {
                                                backgroundColor: catInfo.backgroundColor,
                                                color: catInfo.textColor || '#ffffff',
                                                borderColor: 'transparent',
                                            } : {
                                                backgroundColor: 'rgb(39 39 42)',
                                                color: 'rgb(161 161 170)',
                                                borderColor: 'rgb(63 63 70)',
                                            }}
                                        >
                                            {catInfo.label}
                                        </span>
                                    );
                                })()}
                                {product.lowStockThreshold >= (product.stock || 0) && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                        Low Stock
                                    </span>
                                )}
                                {product.variants && product.variants.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        {product.variants.length} Variantes
                                    </span>
                                )}
                            </div>
                            <h3 className="text-zinc-100 font-medium truncate">{product.name}</h3>
                            <p className="text-sm text-zinc-500 truncate">{product.description}</p>
                        </div>

                        {/* Quick Actions (Price & Stock) */}
                        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="text-right">
                                <p className="text-sm text-zinc-400">Precio</p>
                                <p className="font-semibold text-zinc-200">
                                    ${product.price ? product.price.toLocaleString() : "—"}
                                    {product.variants && <span className="text-xs text-zinc-500 ml-1">+</span>}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-zinc-400">Stock</p>
                                {/* Inline Editing for Simple Products (no variants or empty variants) */}
                                {!product.variants || product.variants.length === 0 ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onUpdateStock(product.id, Math.max(0, (product.stock || 0) - 1))}
                                            className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                        >
                                            -
                                        </button>
                                        <span className="font-mono w-8 text-center text-zinc-200">{product.stock || 0}</span>
                                        <button
                                            onClick={() => onUpdateStock(product.id, (product.stock || 0) + 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <p className="font-mono text-zinc-200 text-center">
                                        {product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Edit / Expand Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                            {product.variants && product.variants.length > 0 && (
                                <button
                                    onClick={() => toggleExpand(product.id)}
                                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                >
                                    {expandedId === product.id ? "▲" : "▼"}
                                </button>
                            )}
                            <button
                                onClick={() => onEdit(product)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-colors"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => onDelete(product.id)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Eliminar producto"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Variants Expansion */}
                    {product.variants && product.variants.length > 0 && (
                        <AnimatePresence>
                            {expandedId === product.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-zinc-950/50 border-t border-zinc-800"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left min-w-[500px]">
                                            <thead className="text-xs text-zinc-500 bg-zinc-900/50 uppercase">
                                                <tr>
                                                    <th className="px-4 py-2">Variante</th>
                                                    <th className="px-4 py-2 text-right">Precio Púb.</th>
                                                    <th className="px-4 py-2 text-right">Mayoreo</th>
                                                    <th className="px-4 py-2 text-center">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {product.variants.map((variant) => (
                                                    <tr key={variant.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30">
                                                        <td className="px-4 py-2 font-medium text-zinc-300">{variant.name}</td>
                                                        <td className="px-4 py-2 text-right text-zinc-400">${variant.price}</td>
                                                        <td className="px-4 py-2 text-right text-amber-500/80">${variant.wholesalePrice || "-"}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => onUpdateStock(product.id, Math.max(0, (variant.stock || 0) - 1), variant.id)}
                                                                    className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-xs"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="font-mono w-6 text-center text-zinc-300">{variant.stock || 0}</span>
                                                                <button
                                                                    onClick={() => onUpdateStock(product.id, (variant.stock || 0) + 1, variant.id)}
                                                                    className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-xs"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </motion.div>
            ))}
        </div>
    );
}

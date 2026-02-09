"use client";

import { useState, useEffect } from "react";
import { useAuth, ShopsProvider, useShops } from "@/components/shared";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
    CustomCategory,
    CATEGORY_COLOR_PRESETS,
    DEFAULT_CATEGORY_COLORS,
    generateCategoryId
} from "@/lib/types/custom-category.types";
import { ArrowLeft, Plus, Trash2, Palette, Check, Tag, Loader2, Store, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function CategoryManagerContent({ shopId }: { shopId: string }) {
    const [categories, setCategories] = useState<CustomCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New category form state
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newBgColor, setNewBgColor] = useState(DEFAULT_CATEGORY_COLORS.backgroundColor);
    const [newTextColor, setNewTextColor] = useState(DEFAULT_CATEGORY_COLORS.textColor);

    // Edit form state
    const [editBgColor, setEditBgColor] = useState("");
    const [editTextColor, setEditTextColor] = useState("");

    useEffect(() => {
        loadCategories();
    }, [shopId]);

    async function loadCategories() {
        if (!shopId) return;
        setIsLoading(true);
        try {
            const docRef = doc(db, "shops", shopId, "settings", "categories");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const cats = data.customCategories || [];
                // Handle backwards compatibility
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
                setCategories(normalizedCats);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function saveCategories(newCategories: CustomCategory[]) {
        try {
            const docRef = doc(db, "shops", shopId, "settings", "categories");
            await setDoc(docRef, { customCategories: newCategories }, { merge: true });
            setCategories(newCategories);
        } catch (error) {
            console.error("Error saving categories:", error);
        }
    }

    const handleAddCategory = async () => {
        if (!newName.trim()) return;

        const categoryId = generateCategoryId(newName.trim());
        if (categories.some(c => c.id === categoryId)) {
            alert("Ya existe una categoría con ese nombre");
            return;
        }

        const newCategory: CustomCategory = {
            id: categoryId,
            name: newName.trim(),
            backgroundColor: newBgColor,
            textColor: newTextColor,
        };

        await saveCategories([...categories, newCategory]);
        setNewName("");
        setNewBgColor(DEFAULT_CATEGORY_COLORS.backgroundColor);
        setNewTextColor(DEFAULT_CATEGORY_COLORS.textColor);
        setShowNewForm(false);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm("¿Eliminar esta categoría? Los productos que la usan mostrarán el nombre sin formato.")) {
            return;
        }
        await saveCategories(categories.filter(c => c.id !== categoryId));
    };

    const handleStartEdit = (category: CustomCategory) => {
        setEditingId(category.id);
        setEditBgColor(category.backgroundColor);
        setEditTextColor(category.textColor);
    };

    const handleSaveEdit = async (categoryId: string) => {
        const updatedCategories = categories.map(c => {
            if (c.id === categoryId) {
                return {
                    ...c,
                    backgroundColor: editBgColor,
                    textColor: editTextColor,
                };
            }
            return c;
        });
        await saveCategories(updatedCategories);
        setEditingId(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/inventory"
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Mis Categorías</h1>
                    <p className="text-zinc-400 text-sm">Personaliza los colores de tus categorías</p>
                </div>
            </div>

            {/* Categories List */}
            <div className="space-y-3 mb-8">
                {categories.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                        <Tag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 mb-2">No tienes categorías personalizadas</p>
                        <p className="text-zinc-500 text-sm">
                            Crea categorías al agregar productos o usa el botón de abajo
                        </p>
                    </div>
                ) : (
                    categories.map((category) => (
                        <motion.div
                            key={category.id}
                            layout
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Color preview badge */}
                                    <span
                                        className="px-3 py-1.5 rounded-full text-sm font-medium"
                                        style={{
                                            backgroundColor: category.backgroundColor,
                                            color: category.textColor,
                                        }}
                                    >
                                        {category.name}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        ID: {category.id}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {editingId !== category.id ? (
                                        <>
                                            <button
                                                onClick={() => handleStartEdit(category)}
                                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                                title="Editar colores"
                                            >
                                                <Palette className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleSaveEdit(category.id)}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Guardar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Edit color picker */}
                            <AnimatePresence>
                                {editingId === category.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4 border-t border-zinc-800"
                                    >
                                        <p className="text-xs text-zinc-500 mb-2">Elige un color:</p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {CATEGORY_COLOR_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setEditBgColor(preset.bg);
                                                        setEditTextColor(preset.text);
                                                    }}
                                                    className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
                                                    style={{ backgroundColor: preset.bg }}
                                                    title={preset.name}
                                                >
                                                    {editBgColor === preset.bg && (
                                                        <Check
                                                            className="absolute inset-0 m-auto w-4 h-4"
                                                            style={{ color: preset.text }}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <label className="text-xs text-zinc-500">Color personalizado:</label>
                                            <input
                                                type="color"
                                                value={editBgColor}
                                                onChange={(e) => setEditBgColor(e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                            />
                                            <select
                                                value={editTextColor}
                                                onChange={(e) => setEditTextColor(e.target.value)}
                                                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                                            >
                                                <option value="#ffffff">Texto Blanco</option>
                                                <option value="#000000">Texto Negro</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add New Category Button/Form */}
            {!showNewForm ? (
                <button
                    onClick={() => setShowNewForm(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/50 rounded-xl text-zinc-400 hover:text-white transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Crear Nueva Categoría
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border border-indigo-500/30 rounded-xl p-4 space-y-4"
                >
                    <h3 className="text-white font-medium">Nueva Categoría</h3>

                    {/* Name input */}
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nombre de la categoría"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Color presets */}
                    <div>
                        <p className="text-xs text-zinc-500 mb-2">Elige un color:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {CATEGORY_COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => {
                                        setNewBgColor(preset.bg);
                                        setNewTextColor(preset.text);
                                    }}
                                    className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
                                    style={{ backgroundColor: preset.bg }}
                                    title={preset.name}
                                >
                                    {newBgColor === preset.bg && (
                                        <Check
                                            className="absolute inset-0 m-auto w-4 h-4"
                                            style={{ color: preset.text }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="text-xs text-zinc-500">Color personalizado:</label>
                            <input
                                type="color"
                                value={newBgColor}
                                onChange={(e) => setNewBgColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                            />
                            <select
                                value={newTextColor}
                                onChange={(e) => setNewTextColor(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                            >
                                <option value="#ffffff">Texto Blanco</option>
                                <option value="#000000">Texto Negro</option>
                            </select>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Vista previa:</span>
                        <span
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: newBgColor,
                                color: newTextColor,
                            }}
                        >
                            {newName || "Mi Categoría"}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowNewForm(false)}
                            className="flex-1 px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAddCategory}
                            disabled={!newName.trim()}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Crear
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Shop Selector for Super Admin
function ShopSelector({ onSelect }: { onSelect: (shopId: string) => void }) {
    const { shops, isLoading } = useShops();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (shops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Store className="w-16 h-16 text-zinc-500" />
                <h2 className="text-xl font-bold text-white">No hay tiendas</h2>
                <p className="text-zinc-400 text-center max-w-md">
                    No hay tiendas disponibles para gestionar categorías.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
                <Store className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Selecciona una Tienda</h2>
                <p className="text-zinc-400 max-w-md">
                    Elige la tienda cuyas categorías deseas gestionar.
                </p>
            </div>

            <div className="grid gap-3 w-full max-w-lg">
                {shops.map((shop) => (
                    <button
                        key={shop.id}
                        onClick={() => onSelect(shop.slug)}
                        className="flex items-center gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl transition-all text-left group"
                    >
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">{shop.name.charAt(0)}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{shop.name}</h3>
                            <p className="text-sm text-zinc-500 truncate">/{shop.slug}</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 -rotate-90 transition-all" />
                    </button>
                ))}
            </div>

            <Link
                href="/admin/inventory"
                className="text-sm text-zinc-500 hover:text-white flex items-center gap-2 mt-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al Inventario
            </Link>
        </div>
    );
}

function CategoryPageInner() {
    const { user, isSuperAdmin } = useAuth();
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

    const shopId = isSuperAdmin
        ? selectedShopId
        : (user?.shopId || null);

    if (!shopId) {
        if (isSuperAdmin) {
            return (
                <div className="min-h-screen bg-background p-6">
                    <ShopSelector onSelect={setSelectedShopId} />
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Tag className="w-16 h-16 text-zinc-500" />
                <h2 className="text-xl font-bold text-white">Error de Configuración</h2>
                <p className="text-zinc-400 text-center max-w-md">
                    Tu cuenta no tiene una tienda asociada. Contacta al administrador.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {isSuperAdmin && selectedShopId && (
                <div className="border-b border-zinc-800 px-6 py-3">
                    <button
                        onClick={() => setSelectedShopId(null)}
                        className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Cambiar tienda
                    </button>
                </div>
            )}
            <CategoryManagerContent shopId={shopId} />
        </div>
    );
}

export default function CategoriesPage() {
    return (
        <ShopsProvider>
            <CategoryPageInner />
        </ShopsProvider>
    );
}

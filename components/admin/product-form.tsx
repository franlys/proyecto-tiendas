"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Package,
  DollarSign,
  Image as ImageIcon,
  Tag,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useInventory, MediaUploader } from "@/components/shared";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

// Sample product images for quick selection
const SAMPLE_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400",
    label: "Shampoo",
  },
  {
    url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
    label: "Crema",
  },
  {
    url: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400",
    label: "Aceite",
  },
  {
    url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400",
    label: "Skincare",
  },
  {
    url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
    label: "Esmalte",
  },
  {
    url: "https://images.unsplash.com/photo-1597854710119-ebeaf0837e7c?w=400",
    label: "Barbería",
  },
];

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct } = useInventory();
  const isEditing = !!product;
  const [showSamples, setShowSamples] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    promoPrice: 0,
    stock: 0,
    lowStockThreshold: 5,
    category: "cabello" as ProductCategory,
    image: "",
    featured: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        promoPrice: product.promoPrice || 0,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        category: product.category,
        image: product.image,
        featured: product.featured || false,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...formData,
      promoPrice: formData.promoPrice > 0 ? formData.promoPrice : undefined,
    };

    if (isEditing && product) {
      updateProduct(product.id, productData);
    } else {
      addProduct(productData);
    }

    onClose();
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (url: string) => {
    updateField("image", url);
    setShowSamples(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <p className="text-sm text-slate-400">
              {isEditing
                ? "Modifica los datos del producto"
                : "Añade un producto al inventario"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <ImageIcon className="w-4 h-4 inline mr-1" />
              Foto del Producto
            </label>

            <MediaUploader
              type="image"
              preset="product"
              currentUrl={formData.image}
              onUploadComplete={(url) => updateField("image", url)}
            />

            {/* Sample Images Toggle */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowSamples(!showSamples)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showSamples ? "Ocultar" : "Ver"} imágenes de ejemplo
              </button>

              {showSamples && (
                <div className="mt-2 grid grid-cols-6 gap-2 animate-in slide-in-from-top-2 duration-200">
                  {SAMPLE_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleImageSelect(img.url)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-primary transition-all group"
                      title={img.label}
                    >
                      <Image
                        src={img.url}
                        alt={img.label}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {img.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ej: Shampoo Hidratante Premium"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Descripción breve del producto..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField("category", cat)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      formData.category === cat
                        ? "bg-primary text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                  >
                    {PRODUCT_CATEGORY_LABELS[cat]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  updateField("price", parseFloat(e.target.value) || 0)
                }
                min={0}
                step={0.01}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Precio Promo
                <span className="text-slate-500 ml-1">(opcional)</span>
              </label>
              <input
                type="number"
                value={formData.promoPrice || ""}
                onChange={(e) =>
                  updateField("promoPrice", parseFloat(e.target.value) || 0)
                }
                min={0}
                step={0.01}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                Stock Actual
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  updateField("stock", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Alerta Stock Bajo
              </label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  updateField("lowStockThreshold", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateField("featured", !formData.featured)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                formData.featured ? "bg-gold" : "bg-white/20"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  formData.featured ? "left-7" : "left-1"
                )}
              />
            </button>
            <span className="text-sm text-slate-300">Producto Destacado</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

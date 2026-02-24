"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Edit2,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Check,
  DollarSign,
  Boxes,
} from "lucide-react";
import { useInventory } from "@/components/shared";
import { PRODUCT_CATEGORY_LABELS, type Product } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  onEdit: (product: Product) => void;
  shopId: string;
  hasInventory: boolean;
}

// Quick Edit Input Component
function QuickEditInput({
  value,
  onSave,
  type = "number",
  prefix,
  suffix,
  min = 0,
}: {
  value: number;
  onSave: (value: number) => void;
  type?: "number" | "currency";
  prefix?: string;
  suffix?: string;
  min?: number;
}) {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const numValue = Math.max(min, parseFloat(localValue) || 0);
    if (numValue !== value) {
      setIsSaving(true);
      onSave(numValue);

      // Show saved feedback
      setTimeout(() => {
        setIsSaving(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      }, 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value.toString());
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-300",
        "bg-white/5 hover:bg-white/10 focus-within:bg-white/10",
        "border-2 border-transparent",
        justSaved && "border-green-500 bg-green-500/10",
        isSaving && "opacity-70"
      )}
    >
      {prefix && <span className="text-slate-400 text-sm">{prefix}</span>}
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        className={cn(
          "w-16 bg-transparent text-white text-sm font-semibold text-center",
          "focus:outline-none",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        )}
      />
      {suffix && <span className="text-slate-500 text-xs">{suffix}</span>}
      {justSaved && (
        <Check className="w-3.5 h-3.5 text-green-400 absolute -right-1 -top-1 animate-in zoom-in duration-200" />
      )}
    </div>
  );
}

// Mobile Product Card Component
function ProductCard({
  product,
  onEdit,
  onDelete,
  onUpdateStock,
  onUpdatePrice,
  shopId,
  hasInventory,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (stock: number) => void;
  onUpdatePrice: (price: number) => void;
  shopId: string;
  hasInventory: boolean;
}) {
  const stockStatus = hasInventory ? getStockStatus(product) : "ok";

  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-4 transition-all",
        stockStatus === "out" && "border-red-500/30 bg-red-500/5",
        stockStatus === "low" && "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      {/* Header: Image + Name + Status */}
      <div className="flex gap-3 mb-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
          {stockStatus !== "ok" && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                stockStatus === "out" ? "bg-red-500/60" : "bg-yellow-500/40"
              )}
            >
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{product.name}</h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
            {product.description}
          </p>
          <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-xs text-slate-300">
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>
        </div>
      </div>

      {/* Quick Edit Fields */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Price */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            <DollarSign className="w-3 h-3 inline mr-1" />
            Precio
          </label>
          <QuickEditInput
            value={product.price}
            onSave={onUpdatePrice}
            prefix="$"
            type="currency"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            <Boxes className="w-3 h-3 inline mr-1" />
            Stock
          </label>
          <QuickEditInput
            value={product.stock}
            onSave={onUpdateStock}
            suffix="uds"
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div>
          {stockStatus === "out" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Agotado
            </span>
          )}
          {stockStatus === "low" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Bajo Stock
            </span>
          )}
          {stockStatus === "ok" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <Check className="w-3 h-3" />
              En Stock
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <a
            href={`/${shopId}?tab=productos`}
            target="_blank"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Ver en tienda"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getStockStatus(product: Product): "out" | "low" | "ok" {
  if (product.stock === 0) return "out";
  if (product.stock <= product.lowStockThreshold) return "low";
  return "ok";
}

export function InventoryTable({ onEdit, shopId, hasInventory }: InventoryTableProps) {
  const { products, updateStock, updateProduct, deleteProduct } = useInventory();

  const handleDelete = (product: Product) => {
    if (confirm(`¿Eliminar "${product.name}" del inventario?`)) {
      deleteProduct(product.id);
    }
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    updateProduct(productId, { price });
  };

  const handleUpdateStock = (productId: string, stock: number) => {
    updateStock(productId, stock);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400">No hay productos en el inventario</p>
        <p className="text-sm text-slate-500">
          Agrega tu primer producto para comenzar
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            shopId={shopId}
            hasInventory={hasInventory}
            onEdit={() => onEdit(product)}
            onDelete={() => handleDelete(product)}
            onUpdateStock={(stock) => handleUpdateStock(product.id, stock)}
            onUpdatePrice={(price) => handleUpdatePrice(product.id, price)}
          />
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                Producto
              </th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                Categoría
              </th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio
              </th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                <Boxes className="w-4 h-4 inline mr-1" />
                Stock
              </th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                Estado
              </th>
              <th className="px-4 py-3 text-sm font-medium text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockStatus = hasInventory ? getStockStatus(product) : "ok";

              return (
                <tr
                  key={product.id}
                  className={cn(
                    "border-b border-white/5 transition-colors",
                    stockStatus === "out" && "bg-red-500/5",
                    stockStatus === "low" && "bg-yellow-500/5"
                  )}
                >
                  {/* Product Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-300">
                      {PRODUCT_CATEGORY_LABELS[product.category]}
                    </span>
                  </td>

                  {/* Price - Quick Edit */}
                  <td className="px-4 py-3">
                    <QuickEditInput
                      value={product.price}
                      onSave={(price) => handleUpdatePrice(product.id, price)}
                      prefix="$"
                      type="currency"
                    />
                    {product.promoPrice && (
                      <div className="mt-1">
                        <span className="text-xs text-gold">
                          Promo: ${product.promoPrice}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Stock - Quick Edit */}
                  <td className="px-4 py-3">
                    <QuickEditInput
                      value={product.stock}
                      onSave={(stock) => handleUpdateStock(product.id, stock)}
                      suffix="uds"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {stockStatus === "out" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Agotado
                      </span>
                    )}
                    {stockStatus === "low" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Bajo Stock
                      </span>
                    )}
                    {stockStatus === "ok" && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        <Check className="w-3 h-3" />
                        En Stock
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/${shopId}?tab=productos`}
                        target="_blank"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Ver en tienda"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

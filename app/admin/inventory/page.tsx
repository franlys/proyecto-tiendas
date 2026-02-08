"use client";

import { useState } from "react";
import { ProductList } from "@/components/admin/inventory/product-list";
import { ProductEditor } from "@/components/admin/inventory/product-editor";
import { Product } from "@/lib/constants";
import { Plus, Search, Filter, Loader2, Package } from "lucide-react";
import { useAuth, InventoryProvider, useInventory } from "@/components/shared";

function InventoryContent({ shopId }: { shopId: string }) {
  const { products, saveProduct, deleteProduct, updateStock, getLowStockProducts, isLoading } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Computed: Filtered Products
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = getLowStockProducts().length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

  // Actions
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(undefined);
    setIsEditorOpen(true);
  };

  const handleSave = (savedProduct: Product) => {
    saveProduct(savedProduct);
    setIsEditorOpen(false);
    setEditingProduct(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      deleteProduct(id);
    }
  };

  const handleUpdateStock = (productId: string, newStock: number, variantId?: string) => {
    updateStock(productId, newStock, variantId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventario</h1>
          <p className="text-zinc-400 mt-1">
            Gestión de productos y existencias <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded ml-2">ID: {shopId}</span>
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Stats Cards (Mini) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Total Productos</p>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Valor Inventario</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Bajo Stock</p>
          <p className="text-2xl font-bold text-red-400">
            {lowStockCount}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Categorías</p>
          <p className="text-2xl font-bold text-blue-400">
            {new Set(products.map(p => p.category)).size}
          </p>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="flex gap-3 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
          />
        </div>
        <button className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white">
          <Filter size={18} />
        </button>
      </div>

      {/* Main List */}
      {filteredProducts.length > 0 ? (
        <ProductList
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStock={handleUpdateStock}
        />
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Package className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 mb-2">
            {searchTerm ? "No se encontraron productos." : "No hay productos todavía."}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreate}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Agregar primer producto
            </button>
          )}
        </div>
      )}

      {/* Editor Modal/Slide-over */}
      <ProductEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSave}
        product={editingProduct}
      />
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const shopId = user?.shopId || "estetica-lola";

  return (
    <InventoryProvider shopId={shopId}>
      <InventoryContent shopId={shopId} />
    </InventoryProvider>
  );
}

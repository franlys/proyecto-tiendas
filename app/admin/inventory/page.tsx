"use client";

import { useState, useEffect } from "react";
import { ProductList } from "@/components/admin/inventory/product-list";
import { ProductEditor } from "@/components/admin/inventory/product-editor";
import { Product } from "@/lib/constants";
import { Plus, Search, Filter, Loader2, Package, Store, ChevronDown, ArrowLeft } from "lucide-react";
import { useAuth, InventoryProvider, useInventory, useShops, ShopsProvider } from "@/components/shared";
import Link from "next/link";

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
            Gestión de productos y existencias <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded ml-2">Tienda: {shopId}</span>
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
        shopId={shopId}
      />
    </div>
  );
}

// Shop Selector for Super Admin
function ShopSelector({ onSelect }: { onSelect: (shopId: string) => void }) {
  const { shops, isLoading } = useShops();
  const [isOpen, setIsOpen] = useState(false);

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
          Crea una tienda primero desde el panel de agencia para poder gestionar su inventario.
        </p>
        <Link
          href="/agency"
          className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-all"
        >
          Ir al Panel de Agencia
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <Store className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Selecciona una Tienda</h2>
        <p className="text-zinc-400 max-w-md">
          Como Super Admin, debes seleccionar qué tienda deseas gestionar.
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
        href="/agency"
        className="text-sm text-zinc-500 hover:text-white flex items-center gap-2 mt-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Panel de Agencia
      </Link>
    </div>
  );
}

function InventoryPageInner() {
  const { user, isSuperAdmin } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // For shop owners, use their shopId directly
  // For super admin, require selection
  const shopId = isSuperAdmin
    ? selectedShopId
    : (user?.shopId || null);

  // If no shop selected (super admin) or no shopId (shop owner without shop)
  if (!shopId) {
    if (isSuperAdmin) {
      return (
        <div className="min-h-screen bg-background p-6">
          <ShopSelector onSelect={setSelectedShopId} />
        </div>
      );
    }

    // Shop owner without shopId - error state
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Package className="w-16 h-16 text-zinc-500" />
        <h2 className="text-xl font-bold text-white">Error de Configuración</h2>
        <p className="text-zinc-400 text-center max-w-md">
          Tu cuenta no tiene una tienda asociada. Contacta al administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Show back button for super admin */}
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
      <InventoryProvider shopId={shopId}>
        <InventoryContent shopId={shopId} />
      </InventoryProvider>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ShopsProvider>
      <InventoryPageInner />
    </ShopsProvider>
  );
}

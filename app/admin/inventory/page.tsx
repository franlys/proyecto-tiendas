"use client";

import { useState, useEffect } from "react";
import { ProductList } from "@/components/admin/inventory/product-list";
import { ProductEditor } from "@/components/admin/inventory/product-editor";
import { Product } from "@/lib/constants";
import { Plus, Search, Filter, Loader2, Package, Store, ChevronDown, ArrowLeft, Tag, Scissors, Clock, DollarSign, Eye, EyeOff, Pencil, Trash2, ShoppingBag, ImageIcon } from "lucide-react";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import Link from "next/link";
import { useAuth, InventoryProvider, useInventory, useShops, ShopsProvider } from "@/components/shared";
import type { BookingService, CreateServiceInput } from "@/lib/types/booking.types";
import { cn } from "@/lib/utils";

// Business types that are primarily service-based (not product-based)
const SERVICE_CENTRIC_TYPES = [
  "beauty", "salon_belleza", "barberia", "spa", "nail_salon", "estetica_facial",
  "clinica_dental", "consultorio_medico", "laboratorio",
  "gimnasio", "estudio_yoga",
  "consultoria", "despacho_contable",
  "tutoria", "escuela_idiomas", "academia"
];

// Business types that have BOTH products and services
const HYBRID_TYPES = [
  "veterinaria", "optica", "farmacia", "floreria", "joyeria",
  "pasteleria", "meal_prep", "decoracion", "electrodomesticos",
  "celulares", "computadoras", "electronica",
  "taller_mecanico", "autolavado",
  "salon_eventos", "fotografia", "muebleria", "ferreteria"
];

// Business types that are "menu-only" - no stock tracking (made-to-order)
const MENU_ONLY_TYPES = [
  "meal_prep", "catering", "cloud_kitchen", "chef_privado", "loncheras",
  "entrenador_personal", "gimnasio", "crossfit", "yoga", "pilates"
];

// Duration options for services
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 25, label: "25 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 75, label: "1h 15min" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
];

// Empty service template
const emptyService: CreateServiceInput = {
  name: "",
  description: "",
  duration: 30,
  price: 0,
  category: "",
  isActive: true,
  image: "",
};

type ViewMode = "products" | "services";

// ====================================
// SERVICES CONTENT (for service-based businesses)
// ====================================
function ServicesContent({ shopId }: { shopId: string }) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateServiceInput>(emptyService);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load services
  useEffect(() => {
    async function loadServices() {
      if (!shopId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/bookings/services?shopId=${shopId}`);
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (err) {
        console.error("Error loading services:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, [shopId]);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = services.filter(s => s.isActive).length;
  const totalValue = services.reduce((acc, s) => acc + s.price, 0);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  const handleStartCreate = () => {
    setFormData(emptyService);
    setIsCreating(true);
    setEditingService(null);
  };

  const handleStartEdit = (service: BookingService) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive,
      image: service.image || "",
    });
    setEditingService(service);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setFormData(emptyService);
    setEditingService(null);
    setIsCreating(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name || formData.duration <= 0) {
      setError("El nombre y la duración son requeridos");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const response = await fetch("/api/bookings/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, ...formData }),
        });
        if (!response.ok) throw new Error("Error creating service");
        const data = await response.json();
        setServices([...services, data.service]);
      } else if (editingService) {
        const response = await fetch(`/api/bookings/services/${editingService.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, ...formData }),
        });
        if (!response.ok) throw new Error("Error updating service");
        const data = await response.json();
        setServices(services.map(s => s.id === editingService.id ? data.service : s));
      }
      handleCancel();
    } catch (err) {
      setError("Error al guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

    try {
      const response = await fetch(`/api/bookings/services/${serviceId}?shopId=${shopId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceId));
      }
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  const handleToggleActive = async (service: BookingService) => {
    try {
      const response = await fetch(`/api/bookings/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isActive: !service.isActive }),
      });
      if (response.ok) {
        setServices(services.map(s =>
          s.id === service.id ? { ...s, isActive: !s.isActive } : s
        ));
      }
    } catch (err) {
      console.error("Error toggling service:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isEditing = isCreating || editingService !== null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Servicios</h1>
          <p className="text-zinc-400 mt-1">
            Gestión de servicios y precios <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded ml-2">Tienda: {shopId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/bookings/settings"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Clock size={18} />
            <span className="hidden sm:inline">Horarios</span>
          </Link>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Total Servicios</p>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Promedio Precio</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${services.length > 0 ? Math.round(totalValue / services.length).toLocaleString() : 0}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Categorías</p>
          <p className="text-2xl font-bold text-blue-400">
            {new Set(services.map(s => s.category || "Sin categoría")).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
          />
        </div>
      </div>

      {/* Editor Modal */}
      {isEditing && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {isCreating ? "Nuevo Servicio" : "Editar Servicio"}
          </h3>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                placeholder="Ej: Corte de cabello"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                placeholder="Ej: Cortes"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Duración *</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Precio</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white h-20 resize-none"
              placeholder="Descripción del servicio..."
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              <ImageIcon className="inline w-4 h-4 mr-1" />
              Imagen del servicio
            </label>
            <FirebaseImageUpload
              value={formData.image || ""}
              onChange={(url) => setFormData({ ...formData, image: url })}
              folder="services"
              shopId={shopId}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-zinc-600"
            />
            <label htmlFor="isActive" className="text-sm text-zinc-300">Servicio activo (visible para clientes)</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      {filteredServices.length > 0 ? (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={cn(
                "bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-zinc-700",
                !service.isActive && "opacity-60"
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{service.name}</h3>
                  {!service.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">Inactivo</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(service.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${service.price.toLocaleString()}
                  </span>
                  {service.category && (
                    <span className="text-zinc-500">{service.category}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(service)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors"
                  title={service.isActive ? "Desactivar" : "Activar"}
                >
                  {service.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleStartEdit(service)}
                  className="p-2 text-zinc-400 hover:text-indigo-400 transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 mb-2">
            {searchTerm ? "No se encontraron servicios." : "No hay servicios todavía."}
          </p>
          {!searchTerm && (
            <button
              onClick={handleStartCreate}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Agregar primer servicio
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ====================================
// PRODUCTS CONTENT (for product-based businesses)
// ====================================
function ProductsContent({ shopId, businessType = "" }: { shopId: string; businessType?: string }) {
  const { products, saveProduct, deleteProduct, updateStock, getLowStockProducts, isLoading } = useInventory();
  const isMenuOnly = MENU_ONLY_TYPES.includes(businessType);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = getLowStockProducts().length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Productos</h1>
          <p className="text-zinc-400 mt-1">
            Gestión de productos y existencias <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded ml-2">Tienda: {shopId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Tag size={18} />
            <span className="hidden sm:inline">Categorías</span>
          </Link>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-2 ${isMenuOnly ? 'md:grid-cols-2' : 'md:grid-cols-4'} gap-4`}>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">{isMenuOnly ? 'Total Menú' : 'Total Productos'}</p>
          <p className="text-2xl font-bold text-white">{products.length}</p>
        </div>
        {!isMenuOnly && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Valor Inventario</p>
            <p className="text-2xl font-bold text-emerald-400">${totalValue.toLocaleString()}</p>
          </div>
        )}
        {!isMenuOnly && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Bajo Stock</p>
            <p className="text-2xl font-bold text-red-400">{lowStockCount}</p>
          </div>
        )}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-zinc-500 text-xs uppercase font-medium mb-1">Categorías</p>
          <p className="text-2xl font-bold text-blue-400">{new Set(products.map(p => p.category)).size}</p>
        </div>
      </div>

      {/* Search & Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
          />
        </div>
        <button className="px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
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

      {/* Editor Modal */}
      <ProductEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSave}
        product={editingProduct}
        shopId={shopId}
        hideStock={isMenuOnly}
      />
    </div>
  );
}

// ====================================
// MAIN INVENTORY CONTENT (decides what to show)
// ====================================
function SmartInventoryContent({ shopId, businessType }: { shopId: string; businessType: string }) {
  const isServiceCentric = SERVICE_CENTRIC_TYPES.includes(businessType);
  const isHybrid = HYBRID_TYPES.includes(businessType);

  // Determine default view based on business type
  const defaultView: ViewMode = isServiceCentric ? "services" : "products";
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // For hybrid businesses, show tabs
  if (isHybrid) {
    return (
      <div className="min-h-screen bg-background">
        {/* View Toggle for Hybrid Businesses */}
        <div className="border-b border-zinc-800 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="text-zinc-500 text-sm">Vista:</span>
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode("products")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  viewMode === "products"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                Productos
              </button>
              <button
                onClick={() => setViewMode("services")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  viewMode === "services"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Scissors className="w-4 h-4" />
                Servicios
              </button>
            </div>
          </div>
        </div>

        {viewMode === "services" ? (
          <ServicesContent shopId={shopId} />
        ) : (
          <InventoryProvider shopId={shopId}>
            <ProductsContent shopId={shopId} businessType={businessType} />
          </InventoryProvider>
        )}
      </div>
    );
  }

  // For service-centric businesses, show services
  if (isServiceCentric) {
    return <ServicesContent shopId={shopId} />;
  }

  // For product-centric businesses (default), show products
  return (
    <InventoryProvider shopId={shopId}>
      <ProductsContent shopId={shopId} businessType={businessType} />
    </InventoryProvider>
  );
}

// ====================================
// SHOP SELECTOR (for Super Admin)
// ====================================
function ShopSelector({ onSelect }: { onSelect: (shopId: string, businessType: string) => void }) {
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
            onClick={() => onSelect(shop.slug, shop.businessType || "retail")}
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

// ====================================
// MAIN PAGE COMPONENT
// ====================================
function InventoryPageInner() {
  const { user, isSuperAdmin } = useAuth();
  const { getShop } = useShops();
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("retail");

  // Get shop info for non-super-admin users
  const userShop = user?.shopId ? getShop(user.shopId) : null;

  // For shop owners, use their shopId directly
  // For super admin, require selection
  const shopId = isSuperAdmin
    ? selectedShopId
    : (user?.shopId || null);

  const businessType = isSuperAdmin
    ? selectedBusinessType
    : (userShop?.businessType || "retail");

  // If no shop selected (super admin) or no shopId (shop owner without shop)
  if (!shopId) {
    if (isSuperAdmin) {
      return (
        <div className="min-h-screen bg-background p-6">
          <ShopSelector
            onSelect={(id, type) => {
              setSelectedShopId(id);
              setSelectedBusinessType(type);
            }}
          />
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
            onClick={() => {
              setSelectedShopId(null);
              setSelectedBusinessType("retail");
            }}
            className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Cambiar tienda
          </button>
        </div>
      )}
      <SmartInventoryContent shopId={shopId} businessType={businessType} />
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

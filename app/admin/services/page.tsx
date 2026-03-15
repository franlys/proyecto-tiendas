"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  AlertTriangle,
  GripVertical,
  Tag,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, ShopsProvider, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { BookingService } from "@/lib/types/booking.types";

// Categorías predefinidas para servicios de tech/repair
const REPAIR_CATEGORIES = [
  "Pantalla",
  "Batería",
  "Cámara",
  "Cargador",
  "Software",
  "Agua",
  "Audio",
  "Botones",
  "Otro",
];

function ServiceForm({
  shopId,
  service,
  onSave,
  onCancel,
}: {
  shopId: string;
  service?: BookingService | null;
  onSave: (saved: BookingService) => void;
  onCancel: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    duration: service?.duration?.toString() || "30",
    category: service?.category || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    setIsSaving(true);
    try {
      const payload = {
        shopId,
        name: form.name,
        description: form.description || undefined,
        price: form.price ? parseFloat(form.price) : 0,
        duration: parseInt(form.duration) || 30,
        category: form.category || undefined,
        isActive: service?.isActive ?? true,
        order: service?.order ?? 0,
      };

      const url = service
        ? `/api/bookings/services/${service.id}`
        : "/api/bookings/services";
      const method = service ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar");
      const data = await res.json();
      onSave(data.service);
    } catch {
      alert("Error al guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Nombre del servicio *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="Ej: Cambio de pantalla, Limpieza de software..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Descripción (opcional)
        </label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe brevemente el servicio..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Precio estimado <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              min="0"
              step="0.01"
              placeholder="Varía / cotización"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-sm"
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">Déjalo vacío si el precio varía</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Tiempo estimado (min)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              min="5"
              step="5"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Categoría
        </label>
        <div className="flex flex-wrap gap-2">
          {REPAIR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm({ ...form, category: form.category === cat ? "" : cat })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                form.category === cat
                  ? "border-orange-500 bg-orange-500/20 text-orange-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !form.name}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
          ) : (
            <>{service ? "Guardar cambios" : "Agregar servicio"}</>
          )}
        </Button>
      </div>
    </form>
  );
}

function ServicesContent({ shopId }: { shopId: string }) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;
    setIsLoading(true);
    fetch(`/api/bookings/services?shopId=${shopId}`)
      .then((r) => r.ok ? r.json() : { services: [] })
      .then((d) => setServices(d.services || []))
      .catch(() => setServices([]))
      .finally(() => setIsLoading(false));
  }, [shopId]);

  const handleSaved = (saved: BookingService) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditingService(null);
  };

  const handleToggle = async (service: BookingService) => {
    const updated = { ...service, isActive: !service.isActive };
    setServices((prev) => prev.map((s) => s.id === service.id ? updated : s));
    await fetch(`/api/bookings/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, isActive: !service.isActive }),
    }).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    setDeletingId(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/bookings/services/${id}?shopId=${shopId}`, { method: "DELETE" }).catch(() => {});
    setDeletingId(null);
  };

  const handleEdit = (service: BookingService) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  // Group by category
  const grouped = services.reduce<Record<string, BookingService[]>>((acc, s) => {
    const cat = s.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Servicios del Taller</h1>
                  <p className="text-slate-400 text-sm">Configura los servicios que ofreces</p>
                </div>
              </div>
            </div>
            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Servicio
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Form panel */}
        {showForm && (
          <div className="glass-panel rounded-2xl p-6 border border-orange-500/20 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingService ? "Editar servicio" : "Agregar nuevo servicio"}
              </h2>
              <button onClick={handleCloseForm} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ServiceForm
              shopId={shopId}
              service={editingService}
              onSave={handleSaved}
              onCancel={handleCloseForm}
            />
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Cargando servicios...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-white/10">
            <Wrench className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Sin servicios configurados</p>
            <p className="text-slate-400 text-sm mb-6">
              Agrega los servicios de reparación que ofreces con su precio y tiempo estimado
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer servicio
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel rounded-xl p-4 border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">{services.length}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-green-500/20 text-center">
                <p className="text-2xl font-bold text-green-400">{services.filter(s => s.isActive).length}</p>
                <p className="text-xs text-slate-400">Activos</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">
                  {services.some(s => s.price > 0)
                    ? `$${Math.min(...services.filter(s => s.price > 0).map(s => s.price))}+`
                    : "Cotización"}
                </p>
                <p className="text-xs text-slate-400">Desde</p>
              </div>
            </div>

            {/* Grouped service list */}
            {Object.entries(grouped).map(([category, catServices]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">{category}</h3>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="space-y-2">
                  {catServices.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                        service.isActive
                          ? "glass-panel border-white/10"
                          : "bg-white/2 border-white/5 opacity-60"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{service.name}</p>
                          {!service.isActive && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-white/10 text-slate-500">Inactivo</span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{service.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {service.price > 0
                          ? <p className="text-white font-bold">${service.price.toLocaleString("es-MX")}</p>
                          : <p className="text-slate-500 text-xs">Cotización</p>
                        }
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(service)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            service.isActive
                              ? "text-green-400 hover:bg-green-500/10"
                              : "text-slate-500 hover:bg-white/10"
                          )}
                          title={service.isActive ? "Desactivar" : "Activar"}
                        >
                          {service.isActive
                            ? <ToggleRight className="w-5 h-5" />
                            : <ToggleLeft className="w-5 h-5" />
                          }
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Eliminar"
                        >
                          {deletingId === service.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ServicesWithAuth() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { getShop, isLoading: shopsLoading } = useShops();

  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  if (authLoading || shopsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!user || !shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Requerido</h2>
          <Button onClick={() => router.push("/login")}>Iniciar Sesión</Button>
        </div>
      </div>
    );
  }

  const effectiveShopId = shop?.slug || shopId;

  return <ServicesContent shopId={effectiveShopId} />;
}

export default function ServicesPage() {
  return (
    <ShopsProvider>
      <ServicesWithAuth />
    </ShopsProvider>
  );
}

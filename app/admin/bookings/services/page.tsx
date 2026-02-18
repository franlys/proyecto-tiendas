"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scissors,
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  GripVertical,
  Save,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { BookingService, CreateServiceInput } from "@/lib/types/booking.types";

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
  { value: 105, label: "1h 45min" },
  { value: 120, label: "2 horas" },
  { value: 150, label: "2.5 horas" },
  { value: 180, label: "3 horas" },
  { value: 210, label: "3.5 horas" },
  { value: 240, label: "4 horas" },
];

// Empty service template
const emptyService: CreateServiceInput = {
  name: "",
  description: "",
  duration: 30,
  price: 0,
  category: "",
  isActive: true,
};

export default function ServicesPage() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const shopId = shop?.slug || user?.shopId || "";

  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editingService, setEditingService] = useState<BookingService | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateServiceInput>(emptyService);

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
        setError("Error al cargar los servicios");
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, [shopId]);

  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Start creating a new service
  const handleStartCreate = () => {
    setFormData(emptyService);
    setIsCreating(true);
    setEditingService(null);
  };

  // Start editing a service
  const handleStartEdit = (service: BookingService) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      isActive: service.isActive,
    });
    setEditingService(service);
    setIsCreating(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData(emptyService);
    setEditingService(null);
    setIsCreating(false);
  };

  // Save service (create or update)
  const handleSave = async () => {
    if (!formData.name || formData.duration <= 0) {
      setError("El nombre y la duración son requeridos");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isCreating) {
        // Create new service
        const response = await fetch("/api/bookings/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, ...formData }),
        });

        if (!response.ok) throw new Error("Error creating service");

        const data = await response.json();
        setServices([...services, data.service]);
      } else if (editingService) {
        // Update existing service
        const response = await fetch(`/api/bookings/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, ...formData }),
        });

        if (!response.ok) throw new Error("Error updating service");

        const data = await response.json();
        setServices(services.map(s => s.id === editingService.id ? data.service : s));
      }

      handleCancel();
    } catch (err) {
      console.error("Error saving service:", err);
      setError("Error al guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete service
  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

    try {
      const response = await fetch(`/api/bookings/services/${serviceId}?shopId=${shopId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error deleting service");

      setServices(services.filter(s => s.id !== serviceId));
    } catch (err) {
      console.error("Error deleting service:", err);
      setError("Error al eliminar el servicio");
    }
  };

  // Toggle service active status
  const handleToggleActive = async (service: BookingService) => {
    try {
      const response = await fetch(`/api/bookings/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isActive: !service.isActive }),
      });

      if (!response.ok) throw new Error("Error updating service");

      const data = await response.json();
      setServices(services.map(s => s.id === service.id ? data.service : s));
    } catch (err) {
      console.error("Error toggling service:", err);
      setError("Error al actualizar el servicio");
    }
  };

  if (!shopId || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/bookings/settings"
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    Servicios
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Configura los servicios que ofreces y su duración
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleStartCreate} disabled={isCreating || !!editingService}>
              <Plus className="w-4 h-4" />
              Nuevo Servicio
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Services List */}
          <div className="lg:col-span-2 space-y-4">
            {services.length === 0 && !isCreating ? (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <Scissors className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No hay servicios</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Agrega los servicios que ofreces con su duración y precio
                </p>
                <Button onClick={handleStartCreate}>
                  <Plus className="w-4 h-4" />
                  Crear primer servicio
                </Button>
              </div>
            ) : (
              <>
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "glass-panel rounded-xl p-4 transition-all",
                      editingService?.id === service.id && "ring-2 ring-primary",
                      !service.isActive && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium truncate">
                            {service.name}
                          </h3>
                          {!service.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs">
                              Inactivo
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-slate-400 text-sm truncate">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-500" />
                          {formatDuration(service.duration)}
                        </div>
                        <div className="flex items-center gap-1 text-green-400 font-medium">
                          <DollarSign className="w-4 h-4" />
                          {service.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            service.isActive
                              ? "hover:bg-white/10 text-slate-400"
                              : "hover:bg-green-500/20 text-green-400"
                          )}
                          title={service.isActive ? "Desactivar" : "Activar"}
                        >
                          {service.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleStartEdit(service)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Edit Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            {(isCreating || editingService) && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">
                  {isCreating ? "Nuevo Servicio" : "Editar Servicio"}
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Nombre del servicio *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Manicura Simple"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ej: Incluye limado y esmaltado"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Duración *
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-800">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Precio *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Categoría (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.category || ""}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ej: Uñas, Maquillaje, Cabello"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !formData.name}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Panel */}
            {!isCreating && !editingService && services.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">
                  Servicios con duración
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Al crear servicios con su duración, el sistema calculará automáticamente
                  los horarios disponibles cuando un cliente seleccione múltiples servicios.
                </p>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-slate-300">
                    <strong className="text-primary">Ejemplo:</strong> Si un cliente selecciona
                    Manicura (20min) + Pedicura (25min) + Gelish (60min), el sistema reservará
                    automáticamente 1h 45min para esa cita.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

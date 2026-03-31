"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Star,
  X,
  Loader2,
  CheckCircle,
  Store,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { AddressInput } from "@/components/shared/address-input";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/types/branch.types";

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ─── Branch Form Modal ────────────────────────────────────────────────────────

interface BranchFormData {
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  lat: string;
  lng: string;
  isMain: boolean;
}

const emptyForm: BranchFormData = { name: "", address: "", phone: "", whatsapp: "", lat: "", lng: "", isMain: false };

function BranchFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BranchFormData) => void;
  initial?: Branch;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<BranchFormData>(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? {
            name: initial.name,
            address: initial.address,
            phone: initial.phone || "",
            whatsapp: initial.whatsapp || "",
            lat: initial.coordinates?.lat.toString() || "",
            lng: initial.coordinates?.lng.toString() || "",
            isMain: initial.isMain,
          }
        : emptyForm
      );
    }
  }, [isOpen, initial]);

  const [detectingCoords, setDetectingCoords] = useState(false);

  const detectCoords = () => {
    if (!navigator.geolocation) return;
    setDetectingCoords(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() }));
        setDetectingCoords(false);
      },
      () => setDetectingCoords(false)
    );
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{initial ? "Editar Sucursal" : "Nueva Sucursal"}</h2>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Nombre de la Sucursal *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Sucursal Centro, GS Norte" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Dirección *</label>
            <AddressInput
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Teléfono</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 800 123 4567" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">WhatsApp</label>
              <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+52 800 123 4567" className={inputClass} />
            </div>
          </div>

          {/* Coordenadas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white/70">Coordenadas GPS</label>
              <button type="button" onClick={detectCoords} disabled={detectingCoords} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                {detectingCoords ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {detectingCoords ? "Detectando..." : "Usar mi ubicación"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitud (ej: 19.4326)" className={inputClass} />
              <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitud (ej: -99.1332)" className={inputClass} />
            </div>
            <p className="text-xs text-white/40 mt-1.5">Las coordenadas permiten detectar la sucursal más cercana al cliente</p>
          </div>

          {/* Sucursal principal */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} className="w-4 h-4 accent-primary" />
            <div>
              <p className="text-white text-sm font-medium">Sucursal Principal (Matriz)</p>
              <p className="text-white/40 text-xs">Esta sucursal aparecerá primero y recibirá los pedidos sin sucursal asignada</p>
            </div>
          </label>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initial ? "Guardar Cambios" : "Crear Sucursal"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const shopId = user?.shopId || "";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Branch | undefined>(undefined);

  useEffect(() => {
    if (!shopId) return;
    setIsLoading(true);
    fetch(`/api/branches?shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => setBranches(d.branches || []))
      .catch(() => setError("Error al cargar las sucursales"))
      .finally(() => setIsLoading(false));
  }, [shopId]);

  const handleSave = async (form: BranchFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        shopId,
        name: form.name,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        isMain: form.isMain,
        coordinates: form.lat && form.lng
          ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) }
          : undefined,
      };

      if (editing) {
        const res = await fetch(`/api/branches/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const { branch } = await res.json();
        setBranches((prev) => prev.map((b) => b.id === editing.id ? branch : b));
      } else {
        const res = await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        const { branch } = await res.json();
        setBranches((prev) => [...prev, branch]);
      }

      setShowForm(false);
      setEditing(undefined);
    } catch {
      setError("Error al guardar la sucursal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm("¿Eliminar esta sucursal? Esta acción no se puede deshacer.")) return;
    try {
      await fetch(`/api/branches/${branchId}?shopId=${shopId}`, { method: "DELETE" });
      setBranches((prev) => prev.filter((b) => b.id !== branchId));
    } catch {
      setError("Error al eliminar la sucursal");
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isActive: !branch.isActive }),
      });
      if (!res.ok) throw new Error();
      const { branch: updated } = await res.json();
      setBranches((prev) => prev.map((b) => b.id === branch.id ? updated : b));
    } catch {
      setError("Error al actualizar la sucursal");
    }
  };

  const sortedBranches = [...branches].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Sucursales</h1>
                  <p className="text-white/50 text-sm">{shop?.name || "Gestión de ubicaciones"}</p>
                </div>
              </div>
            </div>
            <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sucursal
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-white/70">
            <span className="text-primary font-medium">¿Cómo funciona?</span> — Todas las sucursales comparten el mismo catálogo de productos y servicios. El stock se maneja por separado en cada sucursal. Al hacer un pedido, el sistema detecta la sucursal más cercana al cliente o él puede elegirla manualmente.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
          </div>
        ) : sortedBranches.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-white/10 py-20 text-center">
            <Store className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">Sin sucursales registradas</h3>
            <p className="text-white/50 text-sm mb-6">Crea tu primera sucursal para activar el sistema multi-ubicación</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primera sucursal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBranches.map((branch) => (
              <div
                key={branch.id}
                className={cn(
                  "glass-panel rounded-2xl border p-6 transition-all",
                  branch.isMain ? "border-primary/30 bg-primary/5" : "border-white/10",
                  !branch.isActive && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      branch.isMain ? "bg-primary/20" : "bg-white/5"
                    )}>
                      <Store className={cn("w-6 h-6", branch.isMain ? "text-primary" : "text-white/50")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold">{branch.name}</h3>
                        {branch.isMain && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                            <Star className="w-3 h-3" /> Principal
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          branch.isActive
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-slate-500/20 text-white/50 border border-slate-500/30"
                        )}>
                          {branch.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </div>
                        {branch.phone && (
                          <div className="flex items-center gap-2 text-white/50 text-sm">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{branch.phone}</span>
                          </div>
                        )}
                        {branch.coordinates && (
                          <div className="flex items-center gap-2 text-white/40 text-xs">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>GPS: {branch.coordinates.lat.toFixed(5)}, {branch.coordinates.lng.toFixed(5)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(branch)}
                      title={branch.isActive ? "Desactivar" : "Activar"}
                      className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {branch.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => { setEditing(branch); setShowForm(true); }}
                      className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Link to manage this branch's stock */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <p className="text-white/40 text-xs">
                    {branch.coordinates
                      ? "Ubicación GPS configurada — detección automática activa"
                      : "Sin coordenadas GPS — los clientes deben elegir manualmente"}
                  </p>
                  <Link href={`/admin/branches/${branch.id}/stock`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Ver Inventario
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BranchFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined); }}
        onSave={handleSave}
        initial={editing}
        isSaving={isSaving}
      />
    </div>
  );
}

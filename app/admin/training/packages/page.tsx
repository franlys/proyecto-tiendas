"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Check,
  Save,
  X,
  MapPin,
  Monitor,
  Sparkles,
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { TrainingPackage, SessionDuration } from "@/lib/types/training-package.types";
import {
  DURATION_LABELS,
  BILLING_CYCLE_LABELS,
  FREQUENCY_LABELS,
  DEFAULT_TRAINING_PACKAGES,
} from "@/lib/types/training-package.types";

// ─────────────────────────────────────────────
// Package form default
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  description: "",
  price: 0,
  billingCycle: "monthly" as TrainingPackage["billingCycle"],
  sessionsPerWeek: 3 as TrainingPackage["sessionsPerWeek"],
  sessionDuration: 60 as TrainingPackage["sessionDuration"],
  locationType: "in_person" as TrainingPackage["locationType"],
  includes: [] as string[],
  isActive: true,
  sortOrder: 0,
};

type FormData = typeof EMPTY_FORM;

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function TrainingPackagesPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [packages, setPackages] = useState<TrainingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [newInclude, setNewInclude] = useState("");

  // Load packages
  useEffect(() => {
    if (!user?.shopId) return;
    fetch(`/api/training/packages?shopId=${user.shopId}`)
      .then(r => r.json())
      .then(({ packages: pkgs }) => setPackages(pkgs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.shopId]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: packages.length });
    setShowForm(true);
  };

  const openEdit = (pkg: TrainingPackage) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price,
      billingCycle: pkg.billingCycle,
      sessionsPerWeek: pkg.sessionsPerWeek,
      sessionDuration: pkg.sessionDuration,
      locationType: pkg.locationType,
      includes: pkg.includes || [],
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder ?? 0,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSave = async () => {
    if (!user?.shopId || !form.name.trim()) return;
    setSaving(true);
    try {
      const url = editingId
        ? `/api/training/packages/${editingId}`
        : "/api/training/packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: user.shopId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (editingId) {
        setPackages(prev => prev.map(p => p.id === editingId ? json.package : p));
      } else {
        setPackages(prev => [...prev, json.package]);
      }
      closeForm();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: TrainingPackage) => {
    if (!user?.shopId) return;
    const updated = { ...pkg, isActive: !pkg.isActive };
    setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p));
    await fetch(`/api/training/packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId: user.shopId, isActive: !pkg.isActive }),
    });
  };

  const deletePkg = async (id: string) => {
    if (!user?.shopId || !confirm("¿Eliminar este plan?")) return;
    await fetch(`/api/training/packages/${id}?shopId=${user.shopId}`, { method: "DELETE" });
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const addInclude = () => {
    if (!newInclude.trim()) return;
    setForm(prev => ({ ...prev, includes: [...prev.includes, newInclude.trim()] }));
    setNewInclude("");
  };

  const removeInclude = (i: number) => {
    setForm(prev => ({ ...prev, includes: prev.includes.filter((_, idx) => idx !== i) }));
  };

  const loadDefaults = async () => {
    if (!user?.shopId || !confirm("¿Cargar los 3 planes de ejemplo? Se agregarán a los existentes.")) return;
    setSaving(true);
    try {
      for (const pkg of DEFAULT_TRAINING_PACKAGES) {
        const res = await fetch("/api/training/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId: user.shopId, ...pkg }),
        });
        const json = await res.json();
        if (res.ok) setPackages(prev => [...prev, json.package]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
              <Link href="/admin/training">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Planes de Entrenamiento</h1>
                  <p className="text-slate-400 text-sm">Configura los planes que ofreces</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {packages.length === 0 && (
                <Button variant="outline" size="sm" onClick={loadDefaults} disabled={saving}>
                  Cargar ejemplos
                </Button>
              )}
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Nuevo Plan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {packages.length === 0 && !showForm ? (
          <div className="text-center py-16 text-slate-400">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No hay planes configurados.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={loadDefaults} variant="outline" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Cargar planes de ejemplo
              </Button>
              <Button onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" /> Crear plan
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  "glass-panel rounded-2xl p-5 border transition-all",
                  pkg.isActive ? "border-white/10" : "border-white/5 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
                      {!pkg.isActive && (
                        <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">Inactivo</span>
                      )}
                    </div>
                    {pkg.description && <p className="text-slate-400 text-sm mt-1">{pkg.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" /> {FREQUENCY_LABELS[pkg.sessionsPerWeek]}
                      </span>
                      <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {DURATION_LABELS[pkg.sessionDuration]}
                      </span>
                      <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                        {pkg.locationType === "online" ? <Monitor className="w-3 h-3" /> :
                         pkg.locationType === "both" ? <Sparkles className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {pkg.locationType === "in_person" ? "Presencial" : pkg.locationType === "online" ? "Virtual" : "Presencial / Virtual"}
                      </span>
                    </div>
                    {pkg.includes?.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {pkg.includes.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Check className="w-3 h-3 text-green-400" /> {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-primary font-bold text-xl">${pkg.price.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">{BILLING_CYCLE_LABELS[pkg.billingCycle]}</p>
                    <div className="flex items-center gap-1 mt-3 justify-end">
                      <button
                        onClick={() => toggleActive(pkg)}
                        className={cn("p-1.5 rounded-lg transition-colors", pkg.isActive ? "text-green-400 hover:bg-green-500/20" : "text-slate-500 hover:bg-white/10")}
                        title={pkg.isActive ? "Desactivar" : "Activar"}
                      >
                        {pkg.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePkg(pkg.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-slate-800 rounded-2xl border border-white/20 shadow-2xl">
            <div className="sticky top-0 z-10 bg-slate-800 border-b border-white/20 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Editar Plan" : "Nuevo Plan de Entrenamiento"}
              </h2>
              <button onClick={closeForm} className="p-2 rounded-lg hover:bg-white/10 text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nombre del plan *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Plan Transforma 3x"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Descripción (opcional)</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Breve descripción del plan"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
              </div>

              {/* Price + Billing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Precio *</label>
                  <input type="number" min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Ciclo de cobro</label>
                  <select value={form.billingCycle} onChange={e => setForm(p => ({ ...p, billingCycle: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50">
                    <option value="monthly">Mensual</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
              </div>

              {/* Sessions/week + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Sesiones por semana</label>
                  <select value={form.sessionsPerWeek} onChange={e => setForm(p => ({ ...p, sessionsPerWeek: Number(e.target.value) as any }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50">
                    {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n > 1 ? "s" : ""}/semana</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Duración por sesión</label>
                  <select value={form.sessionDuration} onChange={e => setForm(p => ({ ...p, sessionDuration: Number(e.target.value) as any }))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50">
                    {[30,45,60,90,120].map(n => <option key={n} value={n}>{DURATION_LABELS[n as SessionDuration]}</option>)}
                  </select>
                </div>
              </div>

              {/* Modality */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Modalidad</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "in_person", label: "Presencial", icon: <MapPin className="w-4 h-4" /> },
                    { value: "online", label: "Virtual", icon: <Monitor className="w-4 h-4" /> },
                    { value: "both", label: "Ambas", icon: <Sparkles className="w-4 h-4" /> },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(p => ({ ...p, locationType: opt.value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all",
                        form.locationType === opt.value
                          ? "bg-primary/20 border-primary text-white"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Includes */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Qué incluye</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newInclude} onChange={e => setNewInclude(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addInclude())}
                    placeholder="Ej: Rutina personalizada"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
                  <button type="button" onClick={addInclude} className="px-3 py-2 bg-primary/20 text-primary rounded-xl text-sm hover:bg-primary/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.includes.length > 0 && (
                  <ul className="space-y-1">
                    {form.includes.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm text-slate-300 bg-white/5 px-3 py-2 rounded-lg">
                        <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400" />{item}</span>
                        <button onClick={() => removeInclude(i)} className="text-slate-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} className="flex-1">Cancelar</Button>
                <Button type="button" onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingId ? "Guardar cambios" : "Crear Plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

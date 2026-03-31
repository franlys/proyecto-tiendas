"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Copy,
  Check,
  Users,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { Wholesaler } from "@/lib/types/wholesale.types";

function generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 numeric digits, always 1000-9999
}

interface WholesalerFormData {
  name: string;
  email: string;
  phone: string;
  code: string;
  notes: string;
}

const emptyForm: WholesalerFormData = { name: "", email: "", phone: "", code: "", notes: "" };

function WholesalerModal({
  isOpen,
  onClose,
  onSave,
  initial,
  isSaving,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WholesalerFormData) => void;
  initial?: Wholesaler | null;
  isSaving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<WholesalerFormData>(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? { name: initial.name, email: initial.email || "", phone: initial.phone || "", code: initial.code, notes: initial.notes || "" }
          : { ...emptyForm, code: generateCode() }
      );
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-bold text-white mb-5">
          {initial ? "Editar Mayorista" : "Nuevo Mayorista"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre del distribuidor o empresa"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+52 000 000 0000"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Código de acceso (4 dígitos) *</label>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setForm((p) => ({ ...p, code: val }));
                }}
                placeholder="1234"
                maxLength={4}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm tracking-[0.5em] font-mono text-center text-lg"
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, code: generateCode() }))}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                title="Generar código aleatorio"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1">El distribuidor puede ingresar este código o su número de teléfono registrado.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Información adicional..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={() => onSave(form)}
              disabled={isSaving || !form.name.trim() || !form.code.trim()}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : initial ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WholesaleAdminContent({ shopId }: { shopId: string }) {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Wholesaler | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/wholesale?shopId=${shopId}`);
    if (res.ok) {
      const { wholesalers: list } = await res.json();
      setWholesalers(list);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [shopId]);

  const handleSave = async (form: WholesalerFormData) => {
    setModalError(null);
    setIsSaving(true);
    try {
      const url = editing ? `/api/wholesale/${editing.id}` : "/api/wholesale";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Error al guardar");
        return;
      }
      setModalOpen(false);
      setEditing(null);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (w: Wholesaler) => {
    await fetch(`/api/wholesale/${w.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, isActive: !w.isActive }),
    });
    setWholesalers((prev) =>
      prev.map((x) => (x.id === w.id ? { ...x, isActive: !x.isActive } : x))
    );
  };

  const handleDelete = async (w: Wholesaler) => {
    if (!confirm(`¿Eliminar a ${w.name}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/wholesale/${w.id}?shopId=${shopId}`, { method: "DELETE" });
    setWholesalers((prev) => prev.filter((x) => x.id !== w.id));
  };

  const copyCode = (w: Wholesaler) => {
    navigator.clipboard.writeText(w.code);
    setCopiedId(w.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 py-6 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div>
                <h1 className="font-bold text-white text-lg">Mayoristas</h1>
                <p className="text-white/50 text-sm">Gestiona tus distribuidores y sus códigos de acceso</p>
              </div>
            </div>
            <Button onClick={() => { setEditing(null); setModalError(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Mayorista
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
          Cada mayorista recibe un <span className="text-white font-medium">código de 4 dígitos</span>. Pueden acceder ingresando ese código <span className="text-white font-medium">o su número de teléfono</span> registrado en el botón "Mayorista" que aparece en tu tienda.
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white/40 animate-spin" /></div>
        ) : wholesalers.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">No tienes mayoristas registrados</p>
            <Button onClick={() => { setEditing(null); setModalError(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Agregar primer mayorista
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {wholesalers.map((w) => (
              <div
                key={w.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  w.isActive ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-60"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium">{w.name}</p>
                    {!w.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-white/50">Inactivo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {w.phone && <span className="text-xs text-white/40">{w.phone}</span>}
                    {w.email && <span className="text-xs text-white/40">{w.email}</span>}
                  </div>
                </div>

                {/* Code badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg tracking-widest">
                    {w.code}
                  </span>
                  <button
                    onClick={() => copyCode(w)}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Copiar código"
                  >
                    {copiedId === w.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(w)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title={w.isActive ? "Desactivar" : "Activar"}
                  >
                    {w.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setEditing(w); setModalError(null); setModalOpen(true); }}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <WholesalerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
        isSaving={isSaving}
        error={modalError}
      />
    </div>
  );
}

export default function WholesalePage() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/50">Cargando...</p>
      </div>
    );
  }

  return <WholesaleAdminContent shopId={shop?.id || shopId} />;
}

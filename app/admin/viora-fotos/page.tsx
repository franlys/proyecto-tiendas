"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, useShops } from "@/components/shared";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { useRouter } from "next/navigation";
import { Loader2, ImageIcon, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

// ─── DEFAULTS (mismas que en viora-home.tsx) ─────────────────────────────────
const DEFAULTS = {
  heroImage:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2400&auto=format&fit=crop",
  gridImage1:
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop",
  gridImage2:
    "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=1200&auto=format&fit=crop",
  gridImage3:
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
  editorialImage:
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1800&auto=format&fit=crop",
};

interface VioraMedia {
  heroImage?: string;
  gridImage1?: string;
  gridImage2?: string;
  gridImage3?: string;
  editorialImage?: string;
}

// ─── SLOT COMPONENT ───────────────────────────────────────────────────────────

function ImageSlot({
  label,
  description,
  field,
  value,
  defaultValue,
  shopId,
  onChange,
  aspectRatio = "banner",
}: {
  label: string;
  description: string;
  field: string;
  value: string;
  defaultValue: string;
  shopId: string;
  onChange: (v: string) => void;
  aspectRatio?: "square" | "banner" | "auto";
}) {
  const [showPreview, setShowPreview] = useState(false);
  const isCustom = value !== defaultValue && value !== "";

  return (
    <div className="rounded-2xl bg-white/4 border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold text-sm">{label}</h3>
            {isCustom && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                Personalizada
              </span>
            )}
            {!isCustom && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/30 font-medium">
                Por defecto
              </span>
            )}
          </div>
          <p className="text-xs text-white/40">{description}</p>
        </div>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors shrink-0"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Ocultar" : "Vista previa"}
        </button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="relative w-full bg-black/30" style={{ aspectRatio: "16/7" }}>
          <img
            src={value || defaultValue}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
        </div>
      )}

      {/* Upload */}
      <div className="p-5">
        <FirebaseImageUpload
          value={value || undefined}
          onChange={onChange}
          folder={`shops/${shopId}/viora`}
          shopId={shopId}
          label="Subir foto"
          aspectRatio={aspectRatio}
        />

        {/* Reset to default */}
        {isCustom && (
          <button
            onClick={() => onChange("")}
            className="mt-3 text-[10px] text-white/25 hover:text-white/50 transition-colors underline underline-offset-2"
          >
            Restaurar foto por defecto
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function VioraFotosPage() {
  const { user, isSuperAdmin } = useAuth();
  const { getShop } = useShops();
  const router = useRouter();

  const [media, setMedia] = useState<VioraMedia>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  // Gate: only viora-premium shops (or super admin) can access this
  useEffect(() => {
    if (!loading && shop && shop.templateType !== "viora-premium" && !isSuperAdmin) {
      router.replace("/admin");
    }
  }, [shop, loading, isSuperAdmin, router]);

  // Load from Firestore
  useEffect(() => {
    if (!shopId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "shops", shopId, "settings", "viora"));
        if (snap.exists()) setMedia(snap.data() as VioraMedia);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [shopId]);

  const update = (field: keyof VioraMedia) => (value: string) => {
    setMedia(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, "shops", shopId, "settings", "viora"), media, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
      </div>
    );
  }

  const slots: {
    key: keyof VioraMedia;
    label: string;
    description: string;
    aspectRatio?: "square" | "banner" | "auto";
  }[] = [
    {
      key: "heroImage",
      label: "Foto Hero (Portada)",
      description: "Imagen principal a pantalla completa. Usar fotos verticales o de formato grande, bien iluminadas.",
      aspectRatio: "banner",
    },
    {
      key: "gridImage1",
      label: "Grilla — Izquierda (Mujer)",
      description: "Panel izquierdo de la grilla editorial. Ideal fotos verticales, modelo completa.",
      aspectRatio: "banner",
    },
    {
      key: "gridImage2",
      label: "Grilla — Superior Derecha (Nueva Llegada)",
      description: "Panel superior derecho. Fotos de detalle, producto o modelo medio cuerpo.",
      aspectRatio: "auto",
    },
    {
      key: "gridImage3",
      label: "Grilla — Inferior Derecha (Trajes de Baño)",
      description: "Panel inferior derecho. Fotos de colección o modelo en locación.",
      aspectRatio: "auto",
    },
    {
      key: "editorialImage",
      label: "Foto Editorial Grande",
      description: "Imagen a todo ancho en la sección 'La piel del sol'. Fotos panorámicas o de ambiente.",
      aspectRatio: "banner",
    },
  ];

  const defaultMap: Record<keyof VioraMedia, string> = {
    heroImage: DEFAULTS.heroImage,
    gridImage1: DEFAULTS.gridImage1,
    gridImage2: DEFAULTS.gridImage2,
    gridImage3: DEFAULTS.gridImage3,
    editorialImage: DEFAULTS.editorialImage,
  };

  const customCount = Object.entries(media).filter(([k, v]) => v && v !== defaultMap[k as keyof VioraMedia]).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 pb-32">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white/60" />
            </div>
            <h1 className="text-xl font-bold">Fotos del Sitio Web</h1>
          </div>
          <p className="text-sm text-white/40 leading-relaxed">
            Cambia las fotos de tu tienda. Las imágenes se actualizan al instante al guardar.
          </p>
          {customCount > 0 && (
            <p className="text-xs text-emerald-400 mt-2">
              {customCount} {customCount === 1 ? "foto personalizada" : "fotos personalizadas"}
            </p>
          )}
        </div>

        {/* Slots */}
        <div className="space-y-4">
          {slots.map(slot => (
            <ImageSlot
              key={slot.key}
              label={slot.label}
              description={slot.description}
              field={slot.key}
              value={media[slot.key] || ""}
              defaultValue={defaultMap[slot.key]}
              shopId={shopId}
              onChange={update(slot.key)}
              aspectRatio={slot.aspectRatio}
            />
          ))}
        </div>

        {/* Save bar — fixed */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/8 px-5 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              {saved && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Guardado correctamente
                </p>
              )}
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 transition-all active:scale-[0.97]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Guardando..." : "Guardar Fotos"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

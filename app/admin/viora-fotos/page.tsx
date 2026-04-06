"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, useShops } from "@/components/shared";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, ImageIcon, CheckCircle, Save,
  ArrowLeft, Eye, EyeOff,
} from "lucide-react";

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  heroImage:      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2400&auto=format&fit=crop",
  gridImage1:     "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop",
  gridImage2:     "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=1200&auto=format&fit=crop",
  gridImage3:     "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
  editorialImage: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1800&auto=format&fit=crop",
};

interface VioraMedia {
  heroImage?: string;
  gridImage1?: string;
  gridImage2?: string;
  gridImage3?: string;
  editorialImage?: string;
}

// ─── IMAGE SLOT ──────────────────────────────────────────────────────────────
function ImageSlot({
  label, hint, value, defaultValue, shopId, onChange,
}: {
  label: string; hint: string;
  value: string; defaultValue: string;
  shopId: string; onChange: (v: string) => void;
}) {
  const [preview, setPreview] = useState(false);
  const isCustom = !!(value && value !== defaultValue);

  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/8 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-black text-white">{label}</p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${isCustom ? "bg-emerald-500/15 text-emerald-400" : "bg-white/8 text-white/25"}`}>
              {isCustom ? "Personalizada" : "Por defecto"}
            </span>
          </div>
          <p className="text-[11px] text-white/35 leading-relaxed">{hint}</p>
        </div>
        <button
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors shrink-0 mt-0.5"
        >
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/7" }}>
          <img src={value || defaultValue} alt={label} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Upload */}
      <FirebaseImageUpload
        value={value || undefined}
        onChange={onChange}
        folder={`shops/${shopId}/viora`}
        shopId={shopId}
        label="Subir foto"
        aspectRatio="banner"
      />

      {isCustom && (
        <button
          onClick={() => onChange("")}
          className="text-[10px] text-white/20 hover:text-white/45 transition-colors underline underline-offset-2"
        >
          Restaurar imagen por defecto
        </button>
      )}
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

  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  useEffect(() => {
    if (!loading && shop && shop.templateType !== "viora-premium" && !isSuperAdmin) {
      router.replace("/admin");
    }
  }, [shop, loading, isSuperAdmin, router]);

  useEffect(() => {
    if (!shopId) return;
    getDoc(doc(db, "shops", shopId, "settings", "viora"))
      .then(snap => { if (snap.exists()) setMedia(snap.data() as VioraMedia); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shopId]);

  const update = (field: keyof VioraMedia) => (value: string) => {
    setMedia(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopId, "settings", "viora"), media, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const slots: { key: keyof VioraMedia; label: string; hint: string }[] = [
    { key: "heroImage",      label: "Foto Hero — Portada",            hint: "Imagen principal a pantalla completa. Foto vertical o panorámica bien iluminada." },
    { key: "gridImage1",     label: "Grilla Izquierda (Mujer)",       hint: "Panel izquierdo de la grilla editorial. Ideal: modelo completa, vertical." },
    { key: "gridImage2",     label: "Grilla Superior Derecha",        hint: "Panel superior derecho. Foto de detalle o modelo medio cuerpo." },
    { key: "gridImage3",     label: "Grilla Inferior Derecha",        hint: "Panel inferior derecho. Foto de colección o modelo en locación." },
    { key: "editorialImage", label: "Foto Editorial a Todo Ancho",    hint: "Imagen panorámica en la sección central. Ambiente, playa o editorial." },
  ];

  const defaultMap: Record<keyof VioraMedia, string> = {
    heroImage: DEFAULTS.heroImage, gridImage1: DEFAULTS.gridImage1,
    gridImage2: DEFAULTS.gridImage2, gridImage3: DEFAULTS.gridImage3,
    editorialImage: DEFAULTS.editorialImage,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto">

      {/* Header — same pattern as /admin/homepage */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <ImageIcon className="w-5 h-5 text-pink-400" />
        <h1 className="text-xl font-black tracking-tight">Fotos del Sitio Web</h1>
      </div>
      <p className="text-sm text-white/35 mb-8 ml-11">
        Cambia las fotos de tu tienda. Las imágenes se actualizan al instante al guardar.
      </p>

      {/* Slots */}
      <div className="space-y-4">
        {slots.map(slot => (
          <ImageSlot
            key={slot.key}
            label={slot.label}
            hint={slot.hint}
            value={media[slot.key] || ""}
            defaultValue={defaultMap[slot.key]}
            shopId={shopId}
            onChange={update(slot.key)}
          />
        ))}

        {/* Save — same pattern as /admin/homepage */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-white text-black rounded-2xl font-black text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4 text-emerald-600" /> ¡Guardado!</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar fotos</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared";
import {
  LayoutDashboard, CreditCard, MessageSquarePlus, MessageCircle,
  Unlock, Save, Loader2, CheckCircle, ToggleLeft, ToggleRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

// ─── TYPES ─────────────────────────────────────────────────────────────────

interface FeatureConfig {
  enabled: boolean;
  title: string;
  description: string;
}

interface HomepageConfig {
  features: {
    financing: FeatureConfig;
    quote: FeatureConfig;
    chat: FeatureConfig;
    wholesale: FeatureConfig;
  };
}

const DEFAULT_CONFIG: HomepageConfig = {
  features: {
    financing: {
      enabled: true,
      title: "Financiamiento",
      description: "Aprueba tu crédito con BANFONDESA en minutos. Lleva tu equipo hoy y paga cómodamente.",
    },
    quote: {
      enabled: true,
      title: "Cotizaciones",
      description: "¿Buscas algo específico? Solicita una cotización y te respondemos con el mejor precio.",
    },
    chat: {
      enabled: true,
      title: "Chat en Vivo",
      description: "Habla directamente con nuestro equipo. Estamos listos para resolver tus dudas.",
    },
    wholesale: {
      enabled: true,
      title: "Precios Mayoristas",
      description: "Precios especiales para distribuidores y compras al por mayor. Activa tu acceso hoy.",
    },
  },
};

const FEATURE_META: Record<string, { icon: React.ReactNode; accent: string; accentBg: string }> = {
  financing: {
    icon: <CreditCard className="w-5 h-5" />,
    accent: "text-blue-400",
    accentBg: "bg-blue-500/15",
  },
  quote: {
    icon: <MessageSquarePlus className="w-5 h-5" />,
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/15",
  },
  chat: {
    icon: <MessageCircle className="w-5 h-5" />,
    accent: "text-sky-400",
    accentBg: "bg-sky-500/15",
  },
  wholesale: {
    icon: <Unlock className="w-5 h-5" />,
    accent: "text-amber-400",
    accentBg: "bg-amber-500/15",
  },
};

// ─── FEATURE EDITOR ────────────────────────────────────────────────────────

function FeatureEditor({
  featureKey,
  config,
  onChange,
}: {
  featureKey: string;
  config: FeatureConfig;
  onChange: (key: string, value: Partial<FeatureConfig>) => void;
}) {
  const meta = FEATURE_META[featureKey];

  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-4 transition-colors",
      config.enabled ? "bg-white/[0.025] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", meta.accentBg)}>
            <span className={meta.accent}>{meta.icon}</span>
          </div>
          <div>
            <p className="text-sm font-black text-white">{config.title}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{featureKey}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => onChange(featureKey, { enabled: !config.enabled })}
          className="flex items-center gap-2 text-xs font-bold transition-colors"
        >
          {config.enabled ? (
            <ToggleRight className="w-7 h-7 text-emerald-400" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-white/20" />
          )}
          <span className={config.enabled ? "text-emerald-400" : "text-white/25"}>
            {config.enabled ? "Visible" : "Oculto"}
          </span>
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Título</label>
          <input
            type="text"
            value={config.title}
            onChange={e => onChange(featureKey, { title: e.target.value })}
            disabled={!config.enabled}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 disabled:opacity-40 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Descripción</label>
          <textarea
            value={config.description}
            onChange={e => onChange(featureKey, { description: e.target.value })}
            disabled={!config.enabled}
            rows={2}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 disabled:opacity-40 transition-colors resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function AdminHomepagePage() {
  const { user } = useAuth();
  const shopId = user?.shopId;
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "shops", shopId, "settings", "homepage"));
        if (snap.exists()) {
          const data = snap.data() as HomepageConfig;
          setConfig({
            features: {
              financing: { ...DEFAULT_CONFIG.features.financing, ...data.features?.financing },
              quote: { ...DEFAULT_CONFIG.features.quote, ...data.features?.quote },
              chat: { ...DEFAULT_CONFIG.features.chat, ...data.features?.chat },
              wholesale: { ...DEFAULT_CONFIG.features.wholesale, ...data.features?.wholesale },
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const handleChange = (featureKey: string, value: Partial<FeatureConfig>) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: { ...prev.features[featureKey as keyof typeof prev.features], ...value },
      },
    }));
  };

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopId, "settings", "homepage"), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <LayoutDashboard className="w-5 h-5 text-violet-400" />
        <h1 className="text-xl font-black tracking-tight">Página de Inicio</h1>
      </div>
      <p className="text-sm text-white/35 mb-8 ml-11">
        Personaliza las tarjetas de funciones que ven tus clientes en la página principal.
      </p>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : (
        <div className="space-y-4">
          {(["financing", "quote", "chat", "wholesale"] as const).map(key => (
            <FeatureEditor
              key={key}
              featureKey={key}
              config={config.features[key]}
              onChange={handleChange}
            />
          ))}

          {/* Save button */}
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
                <><Save className="w-4 h-4" /> Guardar cambios</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Settings,
  Sparkles,
  Palette,
  Store,
  Eye,
  Save,
  Check,
  Pipette,
  Video,
  Image as ImageIcon,
  Layers,
  Sun,
  Upload,
  Link2,
  Play,
  Loader2,
  Volume2,
  Music,
  Instagram,
  Facebook,
  Globe,
  Type,
  FileText,
  Smartphone,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  BackgroundPreview,
  type BackgroundEffect,
} from "@/components/shop/background-effects";
import {
  COLOR_PRESETS,
  DEMO_VIDEOS,
  DEMO_IMAGES,
  useShops,
  useAuth,
  type BackgroundType,
} from "@/components/shared";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { cn } from "@/lib/utils";

interface ShopConfig {
  shopName: string;
  primaryColor: string;
  accentColor: string;
  backgroundEffect: BackgroundEffect;
  backgroundType: BackgroundType;
  backgroundUrl: string;
  overlayOpacity: number;
  // Audio settings
  audioEnabled: boolean;
  audioUrl: string;
  audioVolume: number;
  audioLoop: boolean;
  // Brand info
  logo: string;
  banner: string;
  slogan: string;
  description: string;
  // Social
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  templateType: string;
  // Tech 3D Breakout assets
  heroProductImage: string;
  requestQuoteEnabled: boolean;
}

const BACKGROUND_OPTIONS: { id: BackgroundEffect; name: string; description: string }[] = [
  { id: "clean", name: "Limpio", description: "Fondo minimalista y profesional" },
  { id: "galaxy", name: "Galaxia", description: "Estrellas animadas flotantes" },
  { id: "aurora", name: "Aurora", description: "Luces de colores en movimiento" },
  { id: "particles", name: "Partículas", description: "Partículas flotantes ascendentes" },
  { id: "waves", name: "Ondas", description: "Ondas suaves y elegantes" },
  { id: "grid", name: "Grid Tech", description: "Cuadrícula futurista con scan" },
  { id: "bokeh", name: "Bokeh", description: "Luces desenfocadas premium" },
  { id: "gradient-flow", name: "Gradiente", description: "Gradientes animados fluidos" },
];

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading, isSuperAdmin } = useAuth();
  const { getShop, updateShop, isLoading: shopsLoading } = useShops();

  const [config, setConfig] = useState<ShopConfig>({
    shopName: "Mi Tienda",
    primaryColor: "#F43F5E",
    accentColor: "#D4AF37",
    backgroundEffect: "clean",
    backgroundType: "preset",
    backgroundUrl: "",
    overlayOpacity: 40,
    audioEnabled: false,
    audioUrl: "",
    audioVolume: 30,
    audioLoop: true,
    logo: "",
    banner: "",
    slogan: "",
    description: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    website: "",
    templateType: "standard",
    heroProductImage: "",
    requestQuoteEnabled: false,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"brand" | "design" | "social">("brand");
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Load from Firestore
  useEffect(() => {
    if (user?.shopId && !shopsLoading) {
      const shop = getShop(user.shopId);
      if (shop) {
        const bgUrl = shop.background?.type === "video"
          ? (shop.background.video || "")
          : (shop.background?.image || "");
        setConfig({
          shopName: shop.name || "Mi Tienda",
          primaryColor: shop.theme?.primaryColor || "#F43F5E",
          accentColor: shop.theme?.accentColor || "#D4AF37",
          backgroundEffect: shop.background?.effect || "clean",
          backgroundType: (shop.background?.type || "preset") as BackgroundType,
          backgroundUrl: bgUrl,
          overlayOpacity: shop.background?.overlayOpacity || 40,
          audioEnabled: shop.backgroundAudio?.enabled || false,
          audioUrl: shop.backgroundAudio?.url || "",
          audioVolume: (shop.backgroundAudio?.volume && shop.backgroundAudio.volume < 1)
            ? shop.backgroundAudio.volume * 100
            : (shop.backgroundAudio?.volume ?? 30),
          audioLoop: shop.backgroundAudio?.loop ?? true,
          logo: shop.logo || "",
          banner: shop.banner || "",
          slogan: shop.slogan || "",
          description: shop.description || "",
          instagram: shop.social?.instagram || "",
          facebook: shop.social?.facebook || "",
          tiktok: shop.social?.tiktok || "",
          website: shop.social?.website || "",
          templateType: shop.templateType || "standard",
          heroProductImage: shop.heroProductImage || "",
          requestQuoteEnabled: shop.requestQuoteEnabled || false,
        });
      }
    }
  }, [user?.shopId, shopsLoading, getShop]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!user?.shopId) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: config.shopName,
        logo: config.logo,
        banner: config.banner,
        slogan: config.slogan,
        description: config.description,
        theme: {
          primaryColor: config.primaryColor,
          accentColor: config.accentColor,
        },
        background: {
          type: config.backgroundType,
          effect: config.backgroundEffect,
          overlayOpacity: config.overlayOpacity,
        },
        backgroundAudio: {
          enabled: config.audioEnabled,
          url: config.audioUrl,
          volume: config.audioVolume,
          loop: config.audioLoop,
        },
        social: {
          instagram: config.instagram,
          facebook: config.facebook,
          tiktok: config.tiktok,
          website: config.website,
        },
        templateType: config.templateType,
        heroProductImage: config.heroProductImage,
        requestQuoteEnabled: config.requestQuoteEnabled,
      };

      // Add URL based on type
      if (config.backgroundType === "image") {
        (updateData.background as Record<string, unknown>).image = config.backgroundUrl;
      } else if (config.backgroundType === "video") {
        (updateData.background as Record<string, unknown>).video = config.backgroundUrl;
      }

      await updateShop(user.shopId, updateData);

      console.log("Config saved to Firestore:", updateData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<ShopConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setIsSaved(false);
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateConfig({
      primaryColor: preset.primary,
      accentColor: preset.accent,
    });
  };

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    updateConfig({
      backgroundType: type,
      backgroundUrl: type === "preset" ? "" : config.backgroundUrl,
    });
  };

  const handleSelectDemoVideo = (url: string) => {
    updateConfig({ backgroundUrl: url, backgroundType: "video" });
  };

  const handleSelectDemoImage = (url: string) => {
    updateConfig({ backgroundUrl: url, backgroundType: "image" });
  };

  if (shopsLoading && !config.shopName) {
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Configuración de Tienda
                </h1>
                <p className="text-slate-400 text-sm">
                  Personaliza tu marca, diseño y redes sociales
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaved || isSaving}>
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: "brand", label: "Marca", icon: Store },
              { id: "design", label: "Diseño Visual", icon: Palette },
              { id: "social", label: "Redes Sociales", icon: Globe },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* BRAND TAB */}
            {activeTab === "brand" && (
              <>
                {/* Tech 3D Breakout — Banner when template is active */}
                {config.templateType === "tech-3d-v1" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("design")}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/8 hover:bg-cyan-500/12 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cyan-300 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        Tech 3D Breakout activo
                        <span className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black">3D</span>
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Ve a <strong className="text-cyan-400">Diseño Visual</strong> para subir la foto del producto hero (la imagen que "rompe la pantalla")
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </button>
                )}

                {/* Shop Name */}
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gold" />
                    Información de la Tienda
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Nombre de la Tienda
                      </label>
                      <input
                        type="text"
                        value={config.shopName}
                        onChange={(e) => updateConfig({ shopName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Mi Tienda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Slogan / Frase Corta
                      </label>
                      <input
                        type="text"
                        value={config.slogan}
                        onChange={(e) => updateConfig({ slogan: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Tu belleza, nuestra pasión"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={config.description}
                        onChange={(e) => updateConfig({ description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                        placeholder="Describe tu negocio en unas pocas líneas..."
                      />
                    </div>
                  </div>
                </div>

                {/* Logo & Banner */}
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gold" />
                    Imágenes de la Tienda
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <FirebaseImageUpload
                      value={config.logo}
                      onChange={(url) => updateConfig({ logo: url })}
                      folder="shops/logos"
                      shopId={user?.shopId || "temp"}
                      label="Logo de la Tienda"
                      aspectRatio="square"
                      maxSizeMB={10}
                    />
                    <FirebaseImageUpload
                      value={config.banner}
                      onChange={(url) => updateConfig({ banner: url })}
                      folder="shops/banners"
                      shopId={user?.shopId || "temp"}
                      label="Imagen de Portada / Banner"
                      aspectRatio="banner"
                      maxSizeMB={10}
                    />
                  </div>
                </div>
              </>
            )}

            {/* DESIGN TAB */}
            {activeTab === "design" && (
              <>
                {/* Color Theme */}
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gold" />
                    Colores del Tema
                  </h2>

                  {/* Color Pickers */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Color Principal
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                            className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors"
                            style={{ backgroundColor: config.primaryColor }}
                          />
                          <Pipette className="absolute bottom-1 right-1 w-3 h-3 text-white/60 pointer-events-none" />
                        </div>
                        <input
                          type="text"
                          value={config.primaryColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "") {
                              updateConfig({ primaryColor: e.target.value || "#" });
                            }
                          }}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors uppercase"
                          placeholder="#F43F5E"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Color de Acento
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            value={config.accentColor}
                            onChange={(e) => updateConfig({ accentColor: e.target.value })}
                            className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors"
                            style={{ backgroundColor: config.accentColor }}
                          />
                          <Pipette className="absolute bottom-1 right-1 w-3 h-3 text-white/60 pointer-events-none" />
                        </div>
                        <input
                          type="text"
                          value={config.accentColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) || e.target.value === "") {
                              updateConfig({ accentColor: e.target.value || "#" });
                            }
                          }}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-colors uppercase"
                          placeholder="#D4AF37"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Themes */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-3">
                      Temas Predefinidos
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {COLOR_PRESETS.map((preset) => {
                        const isSelected =
                          config.primaryColor === preset.primary &&
                          config.accentColor === preset.accent;

                        return (
                          <button
                            key={preset.id}
                            onClick={() => applyPreset(preset)}
                            className={cn(
                              "relative p-3 rounded-xl border-2 transition-all group",
                              isSelected
                                ? "border-white bg-white/10"
                                : "border-white/10 hover:border-white/30 bg-white/5"
                            )}
                            title={preset.label}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <div
                                className="w-6 h-6 rounded-full shadow-lg"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div
                                className="w-4 h-4 rounded-full shadow-lg -ml-2"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <span className="text-xs text-slate-400">{preset.label}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-background" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Template — solo lectura para dueños, editable para super admin */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                  <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gold" />
                    Diseño de la Tienda (Plantilla)
                  </h2>
                  {isSuperAdmin ? (
                    <>
                      <p className="text-sm text-slate-400 mb-6 font-medium">
                        Elige el estilo visual. Usa <strong className="text-white">/admin/templates</strong> para gestión avanzada.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: "standard", name: "Estándar", desc: "Diseño limpio y funcional para todo tipo de negocios." },
                          { id: "premium-drop-v1", name: "Premium Drop", desc: "Enfoque en productos destacados y elegancia." },
                          { id: "street-drop-v1", name: "Street Style", desc: "Estética urbana, ideal para moda y accesorios." },
                          { id: "cosmic-drop-v1", name: "Cosmic", desc: "Inspirado en el espacio, efectos galácticos." },
                          { id: "tech-drop-v1", name: "Tech Premium", desc: "Innovación, seguridad y tecnología con animejs v4." },
                          { id: "tech-3d-v1", name: "Tech 3D Breakout", desc: "El tema más avanzado.", isPremium: true },
                          { id: "tech-premium-v2", name: "Tech Premium v2", desc: "Minimalismo total tipo Apple/Nothing.", isNew: true, isPremium: true },
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => updateConfig({ templateType: tpl.id as any })}
                            className={cn(
                              "relative p-5 rounded-2xl border-2 transition-all text-left group",
                              config.templateType === tpl.id
                                ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                                : "border-white/10 hover:border-white/30 bg-white/5"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-white font-bold tracking-tight">{tpl.name}</p>
                              <div className="flex items-center gap-1.5">
                                {(tpl as any).isPremium && (
                                  <span className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">3D</span>
                                )}
                                {tpl.isNew && (
                                  <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Nuevo</span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{tpl.desc}</p>
                            {config.templateType === tpl.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Plantilla actual: <span className="text-primary">{config.templateType || "Estándar"}</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          El diseño de tu tienda es gestionado por el equipo. Contacta a soporte para solicitar cambios.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tech 3D / Tech Premium v2 — Imagen Hero */}
                {(config.templateType === "tech-3d-v1" || config.templateType === "tech-premium-v2") && (
                  <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-cyan-500/5">
                    <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cyan-400" />
                      Imagen del Producto Hero
                      <span className="ml-auto bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                        Tech 3D
                      </span>
                    </h2>
                    <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                      Esta imagen es la que <span className="text-cyan-300 font-semibold">"rompe la pantalla"</span> en la animación Screen Breakout del hero. Sube una foto de tu producto estrella — un celular, tablet, laptop, etc. Idealmente con fondo oscuro o transparente (PNG).
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6 items-start">
                      <FirebaseImageUpload
                        value={config.heroProductImage}
                        onChange={(url) => updateConfig({ heroProductImage: url })}
                        folder="shops/hero-products"
                        shopId={user?.shopId || "temp"}
                        label="Foto del producto principal"
                        aspectRatio="square"
                        maxSizeMB={8}
                      />

                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-black/40 border border-white/8 space-y-3">
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Recomendaciones</p>
                          <ul className="space-y-2 text-xs text-slate-500 leading-relaxed">
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">✦</span>
                              <span>Formato <strong className="text-slate-300">PNG con fondo transparente</strong> para el mejor efecto 3D</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">✦</span>
                              <span>Resolución mínima <strong className="text-slate-300">500×500px</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">✦</span>
                              <span>Producto centrado, toma frontal o en ángulo ligero</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-cyan-400 mt-0.5">✦</span>
                              <span>Ideal para: celulares, laptops, tablets, cámaras, auriculares</span>
                            </li>
                          </ul>
                        </div>

                        {config.heroProductImage && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                              <img src={config.heroProductImage} alt="Hero" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Imagen cargada</p>
                              <p className="text-slate-500 text-[10px] mt-0.5">Aparecerá en la animación Screen Breakout</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Tech Request Toggle */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        config.requestQuoteEnabled ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-500"
                      )}>
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold tracking-tight">¿No ves lo que buscas?</h3>
                        <p className="text-xs text-slate-500">Habilita una sección para pedidos personalizados de tecnología.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ requestQuoteEnabled: !config.requestQuoteEnabled })}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors font-sans",
                        config.requestQuoteEnabled ? "bg-cyan-500" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                        config.requestQuoteEnabled ? "translate-x-7" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Background Settings */}
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Fondo de la Tienda
                  </h2>

                  {/* Background Type Tabs */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => handleBackgroundTypeChange("preset")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                        config.backgroundType === "preset"
                          ? "bg-primary text-white"
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      <Layers className="w-4 h-4" />
                      Efectos
                    </button>
                    <button
                      onClick={() => handleBackgroundTypeChange("image")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                        config.backgroundType === "image"
                          ? "bg-primary text-white"
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Imagen
                    </button>
                    <button
                      onClick={() => handleBackgroundTypeChange("video")}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                        config.backgroundType === "video"
                          ? "bg-primary text-white"
                          : "bg-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </button>
                  </div>

                  {/* Preset Effects */}
                  {config.backgroundType === "preset" && (
                    <div className="grid gap-4">
                      {BACKGROUND_OPTIONS.map((option) => {
                        const isSelected = config.backgroundEffect === option.id;

                        return (
                          <button
                            key={option.id}
                            onClick={() => updateConfig({ backgroundEffect: option.id })}
                            className={cn(
                              "relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                              isSelected
                                ? "border-white bg-white/10"
                                : "border-white/10 hover:border-white/30 bg-white/5"
                            )}
                          >
                            <div className="w-24 flex-shrink-0">
                              <BackgroundPreview effect={option.id} className="h-16" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{option.name}</p>
                              <p className="text-sm text-slate-400">{option.description}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-background" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Image Background */}
                  {config.backgroundType === "image" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-3">
                          Imágenes de ejemplo
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {DEMO_IMAGES.map((img) => {
                            const isSelected = config.backgroundUrl === img.url;
                            return (
                              <button
                                key={img.id}
                                onClick={() => handleSelectDemoImage(img.url)}
                                className={cn(
                                  "relative aspect-video rounded-lg overflow-hidden transition-all",
                                  isSelected
                                    ? "ring-2 ring-primary scale-95"
                                    : "hover:scale-95 opacity-80 hover:opacity-100"
                                )}
                              >
                                <Image
                                  src={img.thumbnail}
                                  alt={img.label}
                                  fill
                                  className="object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-white" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                  <span className="text-xs text-white">{img.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          <Upload className="w-4 h-4 inline mr-1" />
                          Sube tu propia imagen
                        </label>
                        <FirebaseImageUpload
                          value={config.backgroundUrl.startsWith("blob:") ? "" : config.backgroundUrl}
                          onChange={(url) => updateConfig({ backgroundUrl: url })}
                          folder="shops/backgrounds"
                          shopId={user?.shopId || "temp"}
                          aspectRatio="video"
                          maxSizeMB={10}
                          accept="image"
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-surface text-xs text-slate-500">o pega una URL</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="url"
                            value={config.backgroundUrl}
                            onChange={(e) => updateConfig({ backgroundUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Background */}
                  {config.backgroundType === "video" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-3">
                          Videos de ejemplo
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {DEMO_VIDEOS.map((vid) => {
                            const isSelected = config.backgroundUrl === vid.url;
                            return (
                              <button
                                key={vid.id}
                                onClick={() => handleSelectDemoVideo(vid.url)}
                                className={cn(
                                  "relative aspect-video rounded-lg overflow-hidden transition-all group",
                                  isSelected
                                    ? "ring-2 ring-primary scale-95"
                                    : "hover:scale-95 opacity-80 hover:opacity-100"
                                )}
                              >
                                <Image
                                  src={vid.thumbnail}
                                  alt={vid.label}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                    <Check className="w-6 h-6 text-white" />
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                  <span className="text-xs text-white">{vid.label}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          <Upload className="w-4 h-4 inline mr-1" />
                          Sube tu propio video
                        </label>
                        <FirebaseImageUpload
                          value={config.backgroundUrl.startsWith("blob:") ? "" : config.backgroundUrl}
                          onChange={(url) => updateConfig({ backgroundUrl: url })}
                          folder="shops/backgrounds"
                          shopId={user?.shopId || "temp"}
                          aspectRatio="video"
                          maxSizeMB={50}
                          accept="video"
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-surface text-xs text-slate-500">o pega una URL</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="url"
                            value={config.backgroundUrl}
                            onChange={(e) => updateConfig({ backgroundUrl: e.target.value })}
                            placeholder="https://...video.mp4"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overlay Opacity Slider */}
                  {(config.backgroundType === "image" || config.backgroundType === "video") && config.backgroundUrl && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm text-slate-400 flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Oscurecer Fondo (Legibilidad)
                        </label>
                        <span className="text-white font-mono text-sm">
                          {config.overlayOpacity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={config.overlayOpacity}
                        onChange={(e) => updateConfig({ overlayOpacity: parseInt(e.target.value) })}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Sin overlay</span>
                        <span>Muy oscuro</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Audio Settings */}
                <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Music className="w-4 h-4 text-gold" />
                    Audio de Fondo
                  </h2>

                  <p className="text-sm text-slate-400 mb-4">
                    Agrega música ambiental a tu tienda. El usuario puede silenciarlo con un botón flotante.
                  </p>

                  <div
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => updateConfig({ audioEnabled: !config.audioEnabled })}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", config.audioEnabled ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-400")}>
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Habilitar Audio de Fondo</p>
                        <p className="text-xs text-slate-500">Reproducir música automáticamente</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        config.audioEnabled ? "bg-primary" : "bg-white/20"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                          config.audioEnabled ? "translate-x-7" : "translate-x-1"
                        )}
                      />
                    </div>
                  </div>

                  {config.audioEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          URL del Audio (MP3, WAV, OGG)
                        </label>
                        <div className="relative">
                          <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="url"
                            value={config.audioUrl}
                            onChange={(e) => updateConfig({ audioUrl: e.target.value })}
                            placeholder="https://ejemplo.com/musica.mp3"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Usa enlaces directos a archivos de audio (no YouTube). Recomendamos archivos MP3 ligeros.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-slate-400 flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            Volumen
                          </label>
                          <span className="text-white font-mono text-sm">{config.audioVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={config.audioVolume}
                          onChange={(e) => updateConfig({ audioVolume: parseInt(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Bajo</span>
                          <span>Alto</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-300">Repetir en bucle</span>
                        <button
                          onClick={() => updateConfig({ audioLoop: !config.audioLoop })}
                          className={cn(
                            "relative w-10 h-5 rounded-full transition-colors",
                            config.audioLoop ? "bg-primary" : "bg-white/20"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                              config.audioLoop ? "translate-x-5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SOCIAL TAB */}
            {activeTab === "social" && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gold" />
                  Redes Sociales
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  Conecta tus redes sociales para que tus clientes puedan seguirte.
                </p>

                <div className="space-y-4">
                  {/* Instagram */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Instagram
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                      <input
                        type="text"
                        value={config.instagram}
                        onChange={(e) => updateConfig({ instagram: e.target.value })}
                        placeholder="@tutienda"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Facebook
                    </label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                      <input
                        type="text"
                        value={config.facebook}
                        onChange={(e) => updateConfig({ facebook: e.target.value })}
                        placeholder="facebook.com/tutienda"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      TikTok
                    </label>
                    <div className="relative">
                      <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={config.tiktok}
                        onChange={(e) => updateConfig({ tiktok: e.target.value })}
                        placeholder="@tutienda"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Sitio Web
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                      <input
                        type="url"
                        value={config.website}
                        onChange={(e) => updateConfig({ website: e.target.value })}
                        placeholder="https://tutienda.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
                Vista Previa
              </h2>

              {/* Phone Frame Preview */}
              <div className="relative mx-auto w-[200px]">
                <div className="relative bg-slate-800 rounded-[2rem] p-2 shadow-2xl">
                  <div className="relative bg-background rounded-[1.5rem] overflow-hidden aspect-[9/16]">
                    {/* Background Preview */}
                    {config.backgroundType === "preset" && (
                      <BackgroundPreview
                        effect={config.backgroundEffect}
                        className="absolute inset-0 h-full"
                      />
                    )}

                    {config.backgroundType === "image" && config.backgroundUrl && (
                      <div className="absolute inset-0">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${config.backgroundUrl})` }}
                        />
                        <div
                          className="absolute inset-0 bg-black"
                          style={{ opacity: config.overlayOpacity / 100 }}
                        />
                      </div>
                    )}

                    {config.backgroundType === "video" && config.backgroundUrl && (
                      <div className="absolute inset-0">
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        >
                          <source src={config.backgroundUrl} type="video/mp4" />
                        </video>
                        <div
                          className="absolute inset-0 bg-black"
                          style={{ opacity: config.overlayOpacity / 100 }}
                        />
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="relative z-10 p-4 h-full flex flex-col">
                      <div className="glass-panel rounded-lg px-3 py-2 mb-4">
                        <div className="flex items-center gap-2">
                          {config.logo ? (
                            <img
                              src={config.logo}
                              alt="Logo"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: config.primaryColor }}
                            >
                              {config.shopName.charAt(0)}
                            </div>
                          )}
                          <span className="text-white text-xs font-medium truncate">
                            {config.shopName}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <div
                          className="w-8 h-8 rounded-full mb-2"
                          style={{
                            backgroundColor: config.primaryColor,
                            opacity: 0.2,
                          }}
                        />
                        <div className="h-3 w-20 rounded bg-white/20 mb-2" />
                        {config.slogan && (
                          <div className="h-2 w-24 rounded bg-white/10" />
                        )}
                      </div>

                      <div
                        className="rounded-lg py-2 px-4 text-center text-xs text-white font-medium mb-4"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        Reservar
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-lg bg-white/5 border border-white/10 relative overflow-hidden"
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1"
                              style={{ backgroundColor: config.accentColor }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Color Summary */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="text-center">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 shadow-lg"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <span className="text-xs text-slate-500">Principal</span>
                </div>
                <div className="text-center">
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 shadow-lg"
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <span className="text-xs text-slate-500">Acento</span>
                </div>
              </div>

              {/* Background Type Badge */}
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-xs text-slate-300">
                  {config.backgroundType === "preset" && <Layers className="w-3 h-3" />}
                  {config.backgroundType === "image" && <ImageIcon className="w-3 h-3" />}
                  {config.backgroundType === "video" && <Video className="w-3 h-3" />}
                  {config.backgroundType === "preset" && `Efecto: ${BACKGROUND_OPTIONS.find(o => o.id === config.backgroundEffect)?.name}`}
                  {config.backgroundType === "image" && "Imagen personalizada"}
                  {config.backgroundType === "video" && "Video de fondo"}
                </span>
              </div>

              <p className="text-center text-slate-500 text-xs mt-4">
                Vista previa en tiempo real
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 glass-panel rounded-2xl p-4">
              <p className="text-slate-400 text-sm mb-3">Acciones rápidas</p>
              <div className="space-y-2">
                <a
                  href={`/${user?.shopId || "demo"}`}
                  target="_blank"
                  className="block w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm text-center transition-colors"
                >
                  Ver Mi Tienda
                </a>
                <a
                  href="/admin/bookings/settings"
                  className="block w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm text-center transition-colors"
                >
                  Configurar Calendario
                </a>
                <a
                  href="/admin/settings/meal-prep"
                  className="block w-full px-4 py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm text-center transition-colors mb-2 "
                >
                  Configurar Reglas de Meal Prep
                </a>
                <a
                  href="/admin/settings/payments"
                  className="block w-full px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm text-center transition-colors"
                >
                  Configurar Métodos de Pago
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

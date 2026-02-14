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
  MediaUploader,
  useShops,
  useAuth,
  type BackgroundType,
} from "@/components/shared";
import { AccessDenied } from "@/components/admin/access-denied";
import { cn } from "@/lib/utils";

interface ShopConfig {
  shopName: string;
  primaryColor: string;
  accentColor: string;
  backgroundEffect: BackgroundEffect;
  backgroundType: BackgroundType;
  backgroundUrl: string;
  overlayOpacity: number;
}

const STORAGE_KEY = "shop-visual-config";

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
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { getShop, updateShop, isLoading: shopsLoading } = useShops(); // Use shops hook

  const [config, setConfig] = useState<ShopConfig>({
    shopName: "Mi Tienda",
    primaryColor: "#F43F5E",
    accentColor: "#D4AF37",
    backgroundEffect: "clean",
    backgroundType: "preset",
    backgroundUrl: "",
    overlayOpacity: 40,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add saving state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Load from Firestore
  useEffect(() => {
    if (user?.shopId && !shopsLoading) {
      const shop = getShop(user.shopId);
      if (shop) {
        setConfig({
          shopName: shop.name || "Mi Tienda",
          primaryColor: shop.theme?.primaryColor || "#F43F5E",
          accentColor: shop.theme?.accentColor || "#D4AF37",
          backgroundEffect: shop.background?.effect || "clean",
          backgroundType: shop.background?.type || "preset",
          backgroundUrl: shop.background?.type === "video" ? shop.background.video : shop.background?.image || "",
          overlayOpacity: shop.background?.overlayOpacity || 40,
        });
      }
    }
  }, [user?.shopId, shopsLoading, getShop]);

  // Phase 21: Security Guard - Only Super Admin can access visual settings
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AccessDenied
        title="Solo para Administradores"
        message="La configuración visual de tu tienda es gestionada por tu asesor de marca. Contacta con nosotros para solicitar cambios de diseño."
      />
    );
  }

  const handleSave = async () => {
    if (!user?.shopId) return;

    setIsSaving(true);
    try {
      // Structure data for Firestore
      const updateData: any = {
        name: config.shopName,
        theme: {
          primaryColor: config.primaryColor,
          accentColor: config.accentColor,
        },
        background: {
          type: config.backgroundType,
          effect: config.backgroundEffect,
          overlayOpacity: config.overlayOpacity,
        }
      };

      // Add URL based on type
      if (config.backgroundType === "image") {
        updateData.background.image = config.backgroundUrl;
      } else if (config.backgroundType === "video") {
        updateData.background.video = config.backgroundUrl;
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
    setShowUrlInput(false);
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
                  Configuración Visual
                </h1>
                <p className="text-slate-400 text-sm">
                  Personaliza la apariencia de tu tienda
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shop Name */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-gold" />
                Información de la Tienda
              </h2>
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
            </div>

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

            {/* Background Settings - NEW */}
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
                  {/* Demo Images */}
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

                  {/* Upload Custom Image */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Sube tu propia imagen
                    </label>
                    <MediaUploader
                      type="image"
                      preset="background"
                      currentUrl={config.backgroundUrl}
                      onUploadComplete={(url) => updateConfig({ backgroundUrl: url })}
                    />
                  </div>

                  {/* Or Custom URL */}
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
                  {/* Demo Videos */}
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

                  {/* Upload Custom Video */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Sube tu propio video
                    </label>
                    <MediaUploader
                      type="video"
                      preset="background"
                      currentUrl={config.backgroundUrl}
                      onUploadComplete={(url) => updateConfig({ backgroundUrl: url })}
                    />
                  </div>

                  {/* Or Custom URL */}
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
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            {config.shopName.charAt(0)}
                          </div>
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
                        <div className="h-2 w-16 rounded bg-white/10" />
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
                  Ver Mi Tienda →
                </a>
                <a
                  href="/admin/promos"
                  className="block w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm text-center transition-colors"
                >
                  Crear Promo →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

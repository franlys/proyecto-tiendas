"use client";

import { useState } from "react";
import { Check, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Fondos predefinidos por categoría de negocio (tipos principales)
export type BackgroundCategory = "beauty" | "restaurant" | "retail" | "rentcar" | "repair" | "technology" | "general";

/**
 * Maps any BusinessType to a valid BackgroundCategory
 * Used to ensure compatibility between the 40+ business types and the 6 background categories
 */
export function mapToBackgroundCategory(businessType?: string): BackgroundCategory {
  if (!businessType) return "general";

  // Direct matches
  const validCategories: BackgroundCategory[] = ["beauty", "restaurant", "retail", "rentcar", "repair", "technology"];
  if (validCategories.includes(businessType as BackgroundCategory)) {
    return businessType as BackgroundCategory;
  }

  // Map specific business types to background categories
  const mappings: Record<string, BackgroundCategory> = {
    // Beauty & Wellness
    salon: "beauty",
    spa: "beauty",
    barberia: "beauty",
    estetica: "beauty",
    nail_salon: "beauty",
    makeup_artist: "beauty",
    wellness: "beauty",
    gym: "beauty",
    yoga_studio: "beauty",
    massage: "beauty",
    tattoo: "beauty",

    // Food & Beverage
    cafe: "restaurant",
    bakery: "restaurant",
    bar: "restaurant",
    food_truck: "restaurant",
    catering: "restaurant",
    pizzeria: "restaurant",
    sushi: "restaurant",
    taqueria: "restaurant",
    ice_cream: "restaurant",
    juice_bar: "restaurant",

    // Retail & Commerce
    boutique: "retail",
    jewelry: "retail",
    electronics: "retail",
    furniture: "retail",
    grocery: "retail",
    pharmacy: "retail",
    pet_store: "retail",
    florist: "retail",
    bookstore: "retail",
    clothing: "retail",
    shoes: "retail",
    sports: "retail",
    toys: "retail",
    gifts: "retail",

    // Automotive & Transport
    car_dealer: "rentcar",
    car_wash: "rentcar",
    parking: "rentcar",
    motorcycle: "rentcar",
    bike_rental: "rentcar",

    // Repair & Services
    phone_repair: "repair",
    computer_repair: "repair",
    appliance_repair: "repair",
    auto_repair: "repair",
    mechanic: "repair",
    electrician: "repair",
    plumber: "repair",

    // Technology & Digital
    software: "technology",
    web_agency: "technology",
    it_services: "technology",
    coworking: "technology",
    printing: "technology",
  };

  return mappings[businessType] || "general";
}

const PRESET_BACKGROUNDS: Record<BackgroundCategory, { label: string; url: string }[]> = {
  beauty: [
    { label: "Salón Elegante", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80" },
    { label: "Spa Zen", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80" },
    { label: "Maquillaje Pro", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80" },
    { label: "Uñas Glam", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&q=80" },
    { label: "Peluquería Moderna", url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80" },
    { label: "Estética Rosa", url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=80" },
  ],
  restaurant: [
    { label: "Restaurante Elegante", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80" },
    { label: "Cocina Gourmet", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80" },
    { label: "Bar Nocturno", url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80" },
    { label: "Café Acogedor", url: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=80" },
    { label: "Terraza", url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80" },
    { label: "Comida Callejera", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80" },
  ],
  retail: [
    { label: "Tienda Moderna", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80" },
    { label: "Boutique", url: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80" },
    { label: "Tech Store", url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80" },
    { label: "Moda", url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80" },
    { label: "Minimalista", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80" },
    { label: "Lujo", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80" },
  ],
  rentcar: [
    { label: "Flota Premium", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80" },
    { label: "Carretera", url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80" },
    { label: "Garage Moderno", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80" },
    { label: "Ciudad Nocturna", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80" },
    { label: "Aventura SUV", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80" },
    { label: "Deportivo", url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80" },
  ],
  repair: [
    { label: "Taller Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80" },
    { label: "Electrónica", url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&q=80" },
    { label: "Herramientas", url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200&q=80" },
    { label: "Workspace", url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80" },
    { label: "Componentes", url: "https://images.unsplash.com/photo-1555617778-02518510b9fa?w=1200&q=80" },
    { label: "Servicio Pro", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80" },
  ],
  technology: [
    { label: "Tech Abstract", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80" },
    { label: "Data Center", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80" },
    { label: "Código", url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80" },
    { label: "Futurista", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80" },
    { label: "AI", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80" },
    { label: "Network", url: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=1200&q=80" },
  ],
  general: [
    { label: "Abstracto Oscuro", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80" },
    { label: "Gradiente Azul", url: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&q=80" },
    { label: "Neon City", url: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=1200&q=80" },
    { label: "Mármol Negro", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80" },
    { label: "Dorado Elegante", url: "https://images.unsplash.com/photo-1557264337-e8a93017fe92?w=1200&q=80" },
    { label: "Minimalista Gris", url: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=1200&q=80" },
  ],
};

interface BackgroundGalleryProps {
  value?: string;
  onChange: (url: string) => void;
  businessType?: BackgroundCategory;
  label?: string;
}

export function BackgroundGallery({
  value,
  onChange,
  businessType,
  label = "Elige un fondo predefinido",
}: BackgroundGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BackgroundCategory>(
    businessType || "general"
  );

  // Get backgrounds for current category + general
  const categoryBackgrounds = PRESET_BACKGROUNDS[activeCategory] || [];
  const generalBackgrounds = activeCategory !== "general" ? PRESET_BACKGROUNDS.general : [];
  const allBackgrounds = [...categoryBackgrounds, ...generalBackgrounds];

  const categories: { id: BackgroundCategory; label: string }[] = [
    { id: "general", label: "General" },
    { id: "beauty", label: "Belleza" },
    { id: "restaurant", label: "Restaurant" },
    { id: "retail", label: "Retail" },
    { id: "rentcar", label: "Rent-a-Car" },
    { id: "repair", label: "Reparación" },
    { id: "technology", label: "Tech" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {isExpanded ? "Ocultar galería" : "Ver galería"}
        </button>
      </div>

      {/* Preview actual */}
      {value && (
        <div className="relative w-full h-20 rounded-xl overflow-hidden border border-white/10">
          <img src={value} alt="Fondo actual" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 text-xs text-white/80">Fondo actual</div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Galería expandida */}
      {isExpanded && (
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-4">
          {/* Tabs de categorías */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeCategory === cat.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid de fondos */}
          <div className="grid grid-cols-3 gap-2">
            {allBackgrounds.map((bg, idx) => {
              const isSelected = value === bg.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(bg.url)}
                  className={cn(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all group",
                    isSelected
                      ? "border-cyan-400 ring-2 ring-cyan-400/30"
                      : "border-transparent hover:border-white/30"
                  )}
                >
                  <img
                    src={bg.url}
                    alt={bg.label}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {bg.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Input manual */}
          <div className="pt-3 border-t border-white/10">
            <label className="text-xs text-slate-500 mb-1 block">O pega una URL personalizada:</label>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://ejemplo.com/tu-imagen.jpg"
              className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* Vista compacta cuando no está expandida */}
      {!isExpanded && !value && (
        <div className="grid grid-cols-4 gap-2">
          {allBackgrounds.slice(0, 4).map((bg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(bg.url)}
              className="relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-all group"
            >
              <img
                src={bg.url}
                alt={bg.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { toPng } from "html-to-image";
import Image from "next/image";
import {
  Download,
  Sparkles,
  Image as ImageIcon,
  Type,
  Palette,
  RefreshCw,
  Package,
  Store,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MOCK_PRODUCTS,
  MOCK_SHOPS,
  PRODUCT_CATEGORY_LABELS,
  type Product,
} from "@/lib/constants";

// Preset backgrounds
const BACKGROUNDS = [
  {
    id: "gradient-rose",
    name: "Rose Gold",
    style: "bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400",
  },
  {
    id: "gradient-gold",
    name: "Gold Premium",
    style: "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
  },
  {
    id: "gradient-dark",
    name: "Dark Elegant",
    style: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
  },
  {
    id: "gradient-teal",
    name: "Fresh Teal",
    style: "bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500",
  },
  {
    id: "gradient-purple",
    name: "Purple Dream",
    style: "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500",
  },
  {
    id: "gradient-emerald",
    name: "Nature",
    style: "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500",
  },
];

// Preset promo templates
const TEMPLATES = [
  { title: "2x1 HOY", subtitle: "En todos los servicios" },
  { title: "50% OFF", subtitle: "Solo esta semana" },
  { title: "FLASH SALE", subtitle: "Últimas horas" },
  { title: "NUEVO", subtitle: "Servicio exclusivo" },
];

// Product promo templates
const PRODUCT_TEMPLATES = [
  { discount: "20% OFF", badge: "OFERTA" },
  { discount: "30% OFF", badge: "PROMO" },
  { discount: "2x1", badge: "ESPECIAL" },
  { discount: "50% OFF", badge: "LIQUIDACIÓN" },
];

type LayoutType = "classic" | "hero-product";

export default function PromoGeneratorPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Layout selection
  const [layout, setLayout] = useState<LayoutType>("classic");

  // Form state - Classic
  const [title, setTitle] = useState("2x1 HOY");
  const [subtitle, setSubtitle] = useState("En Uñas Acrílicas");
  const [shopName, setShopName] = useState("Mi Tienda");
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);

  // Form state - Hero Product
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDiscount, setProductDiscount] = useState("20% OFF");
  const [productBadge, setProductBadge] = useState("OFERTA");

  // Get products for selected shop
  const shopProducts = useMemo(() => {
    if (!selectedShopId) return [];
    return MOCK_PRODUCTS[selectedShopId] || [];
  }, [selectedShopId]);

  // Get shops list
  const shops = useMemo(() => Object.values(MOCK_SHOPS), []);

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;

    setIsGenerating(true);

    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `promo-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setTitle(template.title);
    setSubtitle(template.subtitle);
  };

  const applyProductTemplate = (template: (typeof PRODUCT_TEMPLATES)[0]) => {
    setProductDiscount(template.discount);
    setProductBadge(template.badge);
  };

  const randomizeBg = () => {
    const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
    setSelectedBg(BACKGROUNDS[randomIndex]);
  };

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    setSelectedProduct(null);
    // Update shop name for the promo
    const shop = MOCK_SHOPS[shopId];
    if (shop) {
      setShopName(shop.name);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    // Auto-set subtitle based on product
    setSubtitle(product.name);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Generador de Promos
              </h1>
              <p className="text-white/50 text-sm">
                Crea imágenes para Instagram Stories
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Layout Selector */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold" />
                Tipo de Promo
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLayout("classic")}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    layout === "classic"
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  )}
                >
                  <Type className="w-5 h-5 mb-2" />
                  <p className="font-medium text-sm">Clásico</p>
                  <p className="text-xs opacity-70">Solo texto y fondo</p>
                </button>
                <button
                  onClick={() => setLayout("hero-product")}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    layout === "hero-product"
                      ? "bg-gold/20 border-gold text-white"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  )}
                >
                  <Package className="w-5 h-5 mb-2" />
                  <p className="font-medium text-sm">Hero Producto</p>
                  <p className="text-xs opacity-70">Foto de tu inventario</p>
                </button>
              </div>
            </div>

            {/* Hero Product: Shop & Product Selector */}
            {layout === "hero-product" && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold" />
                  Seleccionar Producto
                </h2>

                {/* Shop Selector */}
                <div className="mb-4">
                  <label className="block text-sm text-white/50 mb-2">
                    <Store className="w-4 h-4 inline mr-1" />
                    Tienda
                  </label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => handleShopChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="" className="bg-background">
                      Selecciona una tienda
                    </option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id} className="bg-background">
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Grid */}
                {selectedShopId && (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">
                      Producto a promocionar
                    </label>
                    {shopProducts.length === 0 ? (
                      <p className="text-white/40 text-sm py-4 text-center">
                        Esta tienda no tiene productos en inventario
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                        {shopProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            className={cn(
                              "relative aspect-square rounded-lg overflow-hidden transition-all",
                              selectedProduct?.id === product.id
                                ? "ring-2 ring-gold scale-95"
                                : "hover:scale-95 opacity-80 hover:opacity-100"
                            )}
                          >
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            {selectedProduct?.id === product.id && (
                              <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                                  <span className="text-background text-xs">✓</span>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Product Info */}
                    {selectedProduct && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-white font-medium text-sm">
                          {selectedProduct.name}
                        </p>
                        <p className="text-white/50 text-xs">
                          {PRODUCT_CATEGORY_LABELS[selectedProduct.category]} •{" "}
                          ${selectedProduct.price.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Product Promo Templates */}
                {selectedProduct && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="block text-sm text-white/50 mb-2">
                      <Tag className="w-4 h-4 inline mr-1" />
                      Tipo de descuento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_TEMPLATES.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyProductTemplate(template)}
                          className={cn(
                            "p-2 rounded-lg text-left transition-all",
                            productDiscount === template.discount
                              ? "bg-gold/20 border border-gold"
                              : "bg-white/5 border border-white/10 hover:bg-white/10"
                          )}
                        >
                          <p className="text-white font-bold text-sm">
                            {template.discount}
                          </p>
                          <p className="text-white/50 text-xs">
                            {template.badge}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Custom Discount Input */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-white/40 mb-1">
                          Descuento
                        </label>
                        <input
                          type="text"
                          value={productDiscount}
                          onChange={(e) => setProductDiscount(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                          placeholder="20% OFF"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white/40 mb-1">
                          Etiqueta
                        </label>
                        <input
                          type="text"
                          value={productBadge}
                          onChange={(e) => setProductBadge(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                          placeholder="OFERTA"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Classic: Quick Templates */}
            {layout === "classic" && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Plantillas Rápidas
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyTemplate(template)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left"
                    >
                      <p className="text-white font-bold text-sm">
                        {template.title}
                      </p>
                      <p className="text-white/50 text-xs">{template.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Editor */}
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Type className="w-4 h-4 text-gold" />
                Texto
              </h2>
              <div className="space-y-4">
                {layout === "classic" && (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="2x1 HOY"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-white/50 mb-2">
                    {layout === "hero-product" ? "Nombre del Producto" : "Subtítulo"}
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={layout === "hero-product" ? "Shampoo Premium" : "En Uñas Acrílicas"}
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">
                    Nombre de la Tienda
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Mi Tienda"
                  />
                </div>
              </div>
            </div>

            {/* Background Selector */}
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gold" />
                  Fondo
                </h2>
                <button
                  onClick={randomizeBg}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg)}
                    className={cn(
                      "aspect-square rounded-xl transition-all",
                      bg.style,
                      selectedBg.id === bg.id
                        ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-95"
                        : "hover:scale-95"
                    )}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              isLoading={isGenerating}
              size="lg"
              className="w-full"
            >
              <Download className="w-5 h-5" />
              {isGenerating ? "Generando..." : "Descargar Imagen"}
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-gold" />
                Preview (Instagram Story)
              </h2>

              {/* Story Preview Container - 9:16 aspect ratio */}
              <div className="flex justify-center">
                <div
                  ref={previewRef}
                  className={cn(
                    "relative w-[270px] h-[480px] rounded-2xl overflow-hidden",
                    selectedBg.style
                  )}
                >
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:24px_24px]" />
                  </div>

                  {/* Dark Overlay for readability */}
                  <div className="absolute inset-0 bg-black/20" />

                  {/* Classic Layout */}
                  {layout === "classic" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      {/* Decorative element */}
                      <div className="mb-6">
                        <Sparkles className="w-10 h-10 text-white/80" />
                      </div>

                      {/* Title */}
                      <h2
                        className="font-display text-5xl font-bold text-white mb-4 leading-tight drop-shadow-lg"
                        style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.3)" }}
                      >
                        {title || "Tu Título"}
                      </h2>

                      {/* Subtitle */}
                      <p
                        className="text-xl text-white/90 font-medium drop-shadow-md"
                        style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.3)" }}
                      >
                        {subtitle || "Tu subtítulo aquí"}
                      </p>

                      {/* Decorative line */}
                      <div className="w-16 h-1 bg-white/50 rounded-full my-6" />
                    </div>
                  )}

                  {/* Hero Product Layout */}
                  {layout === "hero-product" && (
                    <div className="absolute inset-0 flex flex-col items-center p-6">
                      {/* Badge */}
                      <div className="absolute top-6 right-6 z-10">
                        <div className="px-3 py-1 rounded-full bg-red-500 text-white font-bold text-xs animate-pulse">
                          {productBadge}
                        </div>
                      </div>

                      {/* Product Image Container */}
                      <div className="flex-1 flex items-center justify-center w-full">
                        {selectedProduct ? (
                          <div className="relative">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-110" />

                            {/* Product Image */}
                            <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                              <Image
                                src={selectedProduct.image}
                                alt={selectedProduct.name}
                                fill
                                className="object-cover"
                              />
                            </div>

                            {/* Discount Badge */}
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-background font-bold px-4 py-2 rounded-full text-lg shadow-lg transform rotate-12">
                              {productDiscount}
                            </div>
                          </div>
                        ) : (
                          <div className="w-44 h-44 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center">
                            <Package className="w-12 h-12 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="text-center mb-4">
                        <h2
                          className="font-display text-2xl font-bold text-white mb-2 drop-shadow-lg"
                          style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.3)" }}
                        >
                          {subtitle || "Nombre del Producto"}
                        </h2>

                        {selectedProduct && (
                          <div className="flex items-center justify-center gap-3">
                            {selectedProduct.promoPrice ? (
                              <>
                                <span className="text-white/50 line-through text-lg">
                                  ${selectedProduct.price.toLocaleString()}
                                </span>
                                <span className="text-white font-bold text-2xl">
                                  ${selectedProduct.promoPrice.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="text-white font-bold text-2xl">
                                ${selectedProduct.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="px-6 py-2 rounded-full bg-white text-background font-bold text-sm">
                        ¡Disponible ahora!
                      </div>
                    </div>
                  )}

                  {/* Shop Logo/Name at bottom */}
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                      <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {shopName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-medium text-sm">
                        {shopName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-white/40 text-xs mt-4">
                Tamaño: 1080 × 1920 px (Instagram Story)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

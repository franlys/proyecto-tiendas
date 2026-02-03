"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useShop,
  useCart,
  LoyaltyCard,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  SectionObserver,
} from "@/components/shared";
import { ServiceCard, ProductGrid } from "@/components/shop";
import { Sparkles, MapPin, Phone, Clock, Calendar, ShoppingBag } from "lucide-react";
import {
  MOCK_SERVICES,
  MOCK_PRODUCTS,
  CATEGORY_LABELS,
  type ServiceCategory,
} from "@/lib/constants";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type TabType = "servicios" | "productos";

export default function ShopHomePage() {
  const shop = useShop();
  const { setTableId, tableId } = useCart();
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.shopId as string;

  // 1. Get Data First
  const services = MOCK_SERVICES[shopId] || [];
  const products = MOCK_PRODUCTS[shopId] || [];

  // 2. Business Logic for Visibility
  const isServiceBusiness = shop?.businessType === "beauty" || shop?.businessType === "repair";
  const hasServices = services.length > 0;

  // Rule: Retail/Restaurants only show products unless services exist. Beauty shows services.
  const showServices = isServiceBusiness || hasServices;
  const showProducts = products.length > 0 || shop?.businessType === "retail" || shop?.businessType === "rentcar" || shop?.businessType === "restaurant";

  // 3. Tab State
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const queryTab = searchParams.get("tab") as TabType;
    if (queryTab && ((queryTab === "servicios" && showServices) || (queryTab === "productos" && showProducts))) {
      return queryTab;
    }
    return showServices ? "servicios" : "productos";
  });

  // 4. Table Logic
  const queryTable = searchParams.get("table");
  useEffect(() => {
    if (queryTable) setTableId(queryTable);
  }, [queryTable, setTableId]);
  const currentTable = tableId || queryTable;

  // 5. Memoize Categories
  const servicesByCategory = useMemo(() => {
    const grouped: Partial<Record<ServiceCategory, typeof services>> = {};
    services.forEach((service) => {
      if (!grouped[service.category]) grouped[service.category] = [];
      grouped[service.category]!.push(service);
    });
    return grouped;
  }, [services]);
  const categories = Object.keys(servicesByCategory) as ServiceCategory[];

  return (
    <div className="relative">
      {/* Table Banner */}
      {currentTable && (
        <div className="fixed top-[70px] left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md border border-gold/30 text-gold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce-slow">
            <MapPin className="w-4 h-4 text-gold fill-gold/20" />
            <span className="font-bold">Mesa {currentTable}</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <SectionObserver id="hero" className="relative py-16 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn delay={0.1}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-gold text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                Bienvenido a {shop?.name}
              </span>
            </FadeIn>

            <ScrollReveal delay={0.2}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                {activeTab === "servicios" ? (
                  <>Elige tus <span className="text-gradient-primary">servicios</span></>
                ) : (
                  <>Descubre nuestros <span className="text-gradient-gold">productos</span></>
                )}
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                {activeTab === "servicios"
                  ? "Selecciona los tratamientos que deseas y agenda por WhatsApp."
                  : "Productos profesionales. Agrégalos a tu pedido."}
              </p>
            </ScrollReveal>

            {/* Shop Info */}
            {shop?.contact && (
              <ScrollReveal delay={0.4}>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                  {shop.contact.address && <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{shop.contact.address}</span>}
                  {shop.contact.phone && <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{shop.contact.phone}</span>}
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </SectionObserver>

      {/* Tabs Section - ONLY SHOW IF BOTH AVAILABLE */}
      {showServices && showProducts && (
        <section className="border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex justify-center -mt-px">
              <div className="inline-flex glass-panel rounded-b-2xl overflow-hidden">
                <button
                  onClick={() => setActiveTab("servicios")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all",
                    activeTab === "servicios"
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Servicios
                </button>
                <button
                  onClick={() => setActiveTab("productos")}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all",
                    activeTab === "productos"
                      ? "bg-gold text-background"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Productos
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loyalty Card Section - Part of Services feel */}
      <SectionObserver id="services" threshold={0.3} className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                Tu Tarjeta de <span className="text-gradient-gold">Fidelidad</span>
              </h2>
              <p className="text-slate-400">
                Acumula sellos y obtén recompensas exclusivas
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <LoyaltyCard />
          </ScrollReveal>
        </div>
      </SectionObserver>

      {/* Services Catalog */}
      {activeTab === "servicios" && (
        <section id="servicios" className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            {categories.map((category, categoryIndex) => (
              <div key={category} className="mb-16">
                {/* Category Header */}
                <ScrollReveal delay={categoryIndex * 0.1}>
                  <div className="mb-8">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                      {CATEGORY_LABELS[category]}
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-primary to-orange-400 rounded-full" />
                  </div>
                </ScrollReveal>

                {/* Services Grid with Stagger Animation */}
                <StaggerContainer
                  staggerDelay={0.08}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                >
                  {servicesByCategory[category]?.map((service) => (
                    <StaggerItem key={service.id}>
                      <ServiceCard service={service} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            ))}

            {/* Empty State */}
            {services.length === 0 && (
              <ScrollReveal>
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Próximamente
                  </h3>
                  <p className="text-slate-400">
                    Estamos preparando nuestro catálogo de servicios.
                  </p>
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>
      )}

      {/* Products Catalog */}
      {activeTab === "productos" && (
        <SectionObserver id="products" threshold={0.3} className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            <ProductGrid products={products} />
          </div>
        </SectionObserver>
      )}

      {/* Call to Action / Footer Section */}
      <SectionObserver id="footer" threshold={0.5} className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
            <div className="glass-panel rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                {activeTab === "servicios"
                  ? "¿Listo para tu cita?"
                  : "¿Listo para tu pedido?"}
              </h2>
              <p className="text-slate-400 mb-6">
                {activeTab === "servicios"
                  ? "Selecciona los servicios que deseas y haz clic en el botón de WhatsApp para agendar."
                  : "Puedes combinar servicios y productos en un solo pedido. ¡Recógelos en tu próxima visita!"}
              </p>
              <div className="flex items-center justify-center gap-2 text-gold">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">
                  {activeTab === "servicios"
                    ? "Selecciona arriba para comenzar"
                    : "Añade productos al carrito"}
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </SectionObserver>
    </div>
  );
}

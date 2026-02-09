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
import { Sparkles, MapPin, Phone, Clock, Calendar, ShoppingBag, Loader2 } from "lucide-react";
import {
  MOCK_SERVICES,
  MOCK_PRODUCTS,
  CATEGORY_LABELS,
  type ServiceCategory,
  type Service,
  type Product,
} from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type TabType = "servicios" | "productos";

export default function ShopHomePage() {
  const shop = useShop();
  const { setTableId, tableId } = useCart();
  const searchParams = useSearchParams();

  // State for Real Data
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load Data (Real or Mock)
  useEffect(() => {
    async function loadShopData() {
      if (!shop?.id || !shop?.slug) return;

      setLoadingData(true);

      // 1. Check if it's a Demo Shop (keep using Mocks for demos)
      const isDemo = shop.id.startsWith("demo-") || shop.id.startsWith("legacy-");

      if (isDemo) {
        setServices(MOCK_SERVICES[shop.slug] || []);
        setProducts(MOCK_PRODUCTS[shop.slug] || []);
        setLoadingData(false);
        return;
      }

      // 2. Fetch Real Data from Firestore
      // IMPORTANT: Products/Services are stored using SLUG as the path (shops/{slug}/products)
      // because that's how the inventory system saves them
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, getDocs } = await import("firebase/firestore");

        // Use slug for subcollection path (consistent with how inventory saves products)
        const shopPath = shop.slug;

        // Fetch Services
        const servicesRef = collection(db, "shops", shopPath, "services");
        const servicesSnap = await getDocs(servicesRef);
        const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(servicesData);

        // Fetch Products
        const productsRef = collection(db, "shops", shopPath, "products");
        const productsSnap = await getDocs(productsRef);
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        console.log("✅ [DEBUG] Real Data Fetched:", {
          shopPath,
          servicesCount: servicesData.length,
          productsCount: productsData.length,
          products: productsData,
        });

      } catch (error) {
        console.error("❌ [DEBUG] Error loading shop data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadShopData();
  }, [shop?.id, shop?.slug]);

  // 2. Business Logic for Visibility
  // Ensure "services" and "products" used below refer to the STATE variables, not local consts.
  // We removed the local const assignments that used MOCK_ directly.

  const isServiceBusiness = shop?.businessType === "beauty" || shop?.businessType === "repair";
  const hasServices = services.length > 0;

  // Rule: Retail/Restaurants only show products unless services exist. Beauty shows services.
  const showServices = isServiceBusiness || hasServices;
  const showProducts = products.length > 0 || shop?.businessType === "retail" || shop?.businessType === "rentcar" || shop?.businessType === "restaurant";

  // 3. Tab State
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const queryTab = searchParams.get("tab") as TabType;
    // We can't rely on 'showServices' here immediately because data is loading.
    // Default to business type logic for initial state
    const initialShowServices = shop?.businessType === "beauty" || shop?.businessType === "repair";

    if (queryTab) return queryTab;
    return initialShowServices ? "servicios" : "productos";
  });

  // Update active tab once data is loaded if needed (optional, purely UX)

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

  // Logic for Loyalty Card - Only show if explicitly enabled in features
  // Retail shops should NOT show loyalty card by default
  const isRetailBusiness = shop?.businessType === "retail" || shop?.businessType === "technology" || shop?.businessType === "restaurant";
  const showLoyalty = shop?.features?.includes("loyalty") && !isRetailBusiness;

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

      {/* Hero Section - Background handled by BackgroundEffects component globally */}
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
                {(() => {
                  if (shop?.businessType === "rentcar") return <>Renta el <span className="text-gradient-primary">Auto Perfecto</span></>;
                  if (shop?.businessType === "restaurant") return <>Menú <span className="text-gradient-gold">Digital</span></>;
                  if (shop?.businessType === "technology" || shop?.businessType === "retail") return <>Catálogo <span className="text-gradient-primary">Online</span></>;
                  return activeTab === "servicios" ? <>Elige tus <span className="text-gradient-primary">servicios</span></> : <>Descubre nuestros <span className="text-gradient-gold">productos</span></>;
                })()}
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                {(() => {
                  if (shop?.businessType === "rentcar") return "Explora nuestra flota y reserva tu vehículo vía WhatsApp.";
                  if (shop?.businessType === "restaurant") return "Disfruta de nuestros platillos. Ordena fácil y rápido.";
                  if (shop?.businessType === "technology" || shop?.businessType === "retail") return "Encuentra los mejores productos y recíbelos hoy.";
                  return activeTab === "servicios" ? "Selecciona los tratamientos que deseas y agenda por WhatsApp." : "Productos profesionales para el cuidado personal.";
                })()}
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

      {/* Loyalty Card Section - ONLY SHOW IF ENABLED */}
      {showLoyalty && (
        <SectionObserver id="loyalty" threshold={0.3} className="py-12 border-t border-white/10">
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
      )}

      {/* Services Catalog */}
      {activeTab === "servicios" && (
        <section id="servicios" className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            {loadingData ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </section>
      )}

      {/* Products Catalog */}
      {activeTab === "productos" && (
        <SectionObserver id="products" threshold={0.3} className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            {loadingData ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            ) : (
              <ProductGrid products={products} />
            )}
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

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
import { Sparkles, MapPin, Phone, Clock, Calendar, ShoppingBag, Loader2, Instagram, Facebook, Globe, MessageCircle, ChefHat } from "lucide-react";
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
import Link from "next/link";
import { getCombinedFeatures } from "@/lib/hooks/use-business-features";
import {
  TrainingPackage,
  FREQUENCY_LABELS,
  BILLING_CYCLE_LABELS
} from "@/lib/types/training-package.types";

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
      console.log("🏪 [CATALOG] Shop object:", {
        id: shop?.id,
        slug: shop?.slug,
        name: shop?.name,
        businessType: shop?.businessType,
      });

      if (!shop?.id || !shop?.slug) {
        console.warn("⚠️ [CATALOG] Shop ID or Slug is missing!", { id: shop?.id, slug: shop?.slug });
        return;
      }

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

        // Fetch Services from BOTH collections and merge
        // Services can be in 'services' (legacy) or 'bookingServices' (new)
        // ALways use the real document ID for the database path
        const shopPath = shop.id;
        const servicesLegacyRef = collection(db, "shops", shopPath, "services");
        const servicesNewRef = collection(db, "shops", shopPath, "bookingServices");

        const [legacySnap, newSnap] = await Promise.all([
          getDocs(servicesLegacyRef),
          getDocs(servicesNewRef),
        ]);

        // Merge services, avoiding duplicates by ID
        const seenIds = new Set<string>();
        const servicesData: Service[] = [];

        const addService = (doc: any) => {
          if (seenIds.has(doc.id)) return;
          seenIds.add(doc.id);
          const data = doc.data();
          // Only include active services
          if (data.isActive !== false) {
            servicesData.push({ id: doc.id, ...data } as Service);
          }
        };

        legacySnap.docs.forEach(addService);
        newSnap.docs.forEach(addService);

        // Fetch Training Packages
        try {
          // Training packages use the REAL ID for the collection path
          const trainingRef = collection(db, "shops", shopPath, "training-packages");
          const trainingSnap = await getDocs(trainingRef);

          trainingSnap.docs.forEach(docSnap => {
            const data = docSnap.data() as TrainingPackage;
            if (data.isActive !== false) {
              // Map TrainingPackage to Service
              servicesData.push({
                id: docSnap.id,
                name: data.name,
                description: `${data.description || ""}${data.description ? ". " : ""}${FREQUENCY_LABELS[data.sessionsPerWeek]} / ${BILLING_CYCLE_LABELS[data.billingCycle]}`,
                price: data.price,
                duration: data.sessionDuration,
                category: "entrenamiento",
                image: data.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac0050?w=400&h=400&fit=crop", // GYM default fallback
              } as Service);
            }
          });
        } catch (err) {
          console.error("Error loading training packages:", err);
        }

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
          servicesFromLegacy: legacySnap.size,
          servicesFromNew: newSnap.size,
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
  // Use combined features when shop has multiple business types
  const businessTypes = shop?.businessTypes || (shop?.businessType ? [shop.businessType] : []);
  const combinedFeatures = useMemo(() => getCombinedFeatures(businessTypes), [businessTypes.join(",")]);

  // Feature-based visibility (works for single or multiple types)
  const isServiceBusiness = combinedFeatures.hasServices && combinedFeatures.hasBookings;
  const isProductBusiness = combinedFeatures.hasOrders || combinedFeatures.hasCatalog;
  const hasServices = services.length > 0;
  const hasProducts = products.length > 0;

  // Show sections based on combined features AND available data
  const showServices = (combinedFeatures.hasServices || combinedFeatures.hasBookings) && (hasServices || isServiceBusiness);
  const showProducts = (combinedFeatures.hasCatalog || combinedFeatures.hasOrders) && (hasProducts || isProductBusiness);

  // 3. UI State
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const queryTab = searchParams.get("tab") as TabType;
    const initialShowServices = shop?.businessType === "beauty" || shop?.businessType === "repair";
    if (queryTab) return queryTab;
    return initialShowServices ? "servicios" : "productos";
  });
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

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
  // Retail, Restaurants and Food businesses should NOT show loyalty card by default
  const isFoodOrRetail = combinedFeatures.config.category === "food" ||
    combinedFeatures.config.category === "retail" ||
    combinedFeatures.config.category === "other";

  const showLoyalty = shop?.features?.includes("loyalty") && !isFoodOrRetail;

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

        {/* Banner Image Override */}
        {shop?.banner && (
          <>
            <div className="absolute inset-0 z-0">
              <img
                src={shop.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />
          </>
        )}

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">

            {/* Shop Logo */}
            {shop?.logo && (
              <FadeIn delay={0.05}>
                <div className="mx-auto mb-8 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
                  <img
                    src={shop.logo}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </FadeIn>
            )}

            {!shop?.banner && (
              <FadeIn delay={0.1}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-gold text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  Bienvenido a {shop?.name}
                </span>
              </FadeIn>
            )}

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

            {/* Shop Info & Social Media */}
            {(shop?.contact || shop?.social) && (
              <ScrollReveal delay={0.4}>
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                    {shop?.contact?.address && <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{shop.contact.address}</span>}
                    {shop?.contact?.phone && (
                      <a href={`https://wa.me/${(shop.contact.whatsapp || shop.contact.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-green-400 transition-colors">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        {shop.contact.whatsapp || shop.contact.phone}
                      </a>
                    )}
                  </div>

                  {/* Social Media Icons */}
                  {shop?.social && (
                    <div className="flex items-center justify-center gap-5">
                      {shop.social.instagram && (
                        <a href={`https://instagram.com/${shop.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {shop.social.facebook && (
                        <a href={shop.social.facebook.startsWith('http') ? shop.social.facebook : `https://facebook.com/${shop.social.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {shop.social.tiktok && (
                        <a href={`https://tiktok.com/@${shop.social.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 hover:text-white transition-all font-bold text-xs">
                          <span className="w-5 h-5 flex items-center justify-center">TT</span>
                        </a>
                      )}
                      {shop.social.website && (
                        <a href={shop.social.website.startsWith('http') ? shop.social.website : `https://${shop.social.website}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full glass-panel hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}

            {/* Main Action Button (CTA) */}
            <ScrollReveal delay={0.5}>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {/* Book Appointment - Only if has services that are NOT training (unless gym) */}
                {isServiceBusiness && hasServices && services.some(s => s.category !== "entrenamiento" || shop?.businessType === "gimnasio") && (
                  <Link
                    href={`/${shop?.slug || shop?.id}/book`}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-400 text-white font-semibold rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                  >
                    <Calendar className="w-5 h-5" />
                    {combinedFeatures.labels?.cta || "Reservar Cita"}
                  </Link>
                )}

                {/* Meal Prep Constructor Button - For Meal Prep shops or shops with Meal Prep category */}
                {(shop?.businessType === "meal_prep" || products.some(p => (p as any).category === "meal_prep_package")) && (
                  <button
                    onClick={() => setIsMealModalOpen(true)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold rounded-full shadow-lg shadow-green-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                  >
                    <ChefHat className="w-5 h-5" />
                    {shop?.businessType === "meal_prep" ? "Armar mi Plan" : "Personalizar Plato"}
                  </button>
                )}
              </div>
            </ScrollReveal>
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
                  {combinedFeatures.labels?.services || "Servicios"}
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
                  {combinedFeatures.labels?.products || "Productos"}
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
              <ProductGrid
                products={products}
                businessCoordinates={shop?.coordinates}
                businessAddress={shop?.contact?.address}
                trainingPackages={services.filter(s => s.category === "entrenamiento")}
                isMealModalOpen={isMealModalOpen}
                setIsMealModalOpen={setIsMealModalOpen}
                hidePriceIfZero={
                  businessTypes.some(t => ["meal_prep", "fitness", "entrenamiento", "entrenador_personal", "gimnasio", "gym", "personal_trainer"].includes(t)) ||
                  shop?.businessType === "meal_prep" ||
                  products.some(p => (p as any).plateCount || (p as any).category === "meal_prep_package") ||
                  (combinedFeatures.config.category as any) === "food" ||
                  (combinedFeatures.config.category as any) === "fitness"
                }
              />
            )}
          </div>
        </SectionObserver>
      )}

      {/* Call to Action Section */}
      <SectionObserver id="footer-cta" threshold={0.5} className="py-16 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <ScrollReveal>
            <div className="glass-panel rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                {activeTab === "servicios"
                  ? `¿Listo para tu ${combinedFeatures.labels?.booking.toLowerCase() || "cita"}?`
                  : `¿Listo para tu ${combinedFeatures.labels?.order.toLowerCase() || "pedido"}?`}
              </h2>
              <p className="text-slate-400 mb-6">
                {activeTab === "servicios"
                  ? `Selecciona los ${combinedFeatures.labels?.services.toLowerCase() || "servicios"} que deseas y haz clic en el botón de WhatsApp para agendar.`
                  : `Puedes combinar ${combinedFeatures.labels?.services.toLowerCase() || "servicios"} y ${combinedFeatures.labels?.products.toLowerCase() || "productos"} en un solo pedido.`}
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

      {/* Contact & Location Section */}
      <SectionObserver id="contact" threshold={0.3} className="py-16 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
                Encuéntranos
              </h2>
              <div className="space-y-6">
                {shop?.contact?.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">Dirección</h4>
                      <p className="text-slate-400">{shop.contact.address}</p>
                    </div>
                  </div>
                )}
                {shop?.contact?.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">WhatsApp / Teléfono</h4>
                      <a href={`https://wa.me/${(shop.contact.whatsapp || shop.contact.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                        {shop.contact.whatsapp || shop.contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Horario</h4>
                    <p className="text-slate-400">Consulta nuestro horario de atención o escríbenos directamente.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Síguenos en Redes
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {shop?.social?.instagram && (
                    <a href={`https://instagram.com/${shop.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <span className="text-sm text-slate-300 group-hover:text-white">Instagram</span>
                    </a>
                  )}
                  {shop?.social?.facebook && (
                    <a href={shop.social.facebook.startsWith('http') ? shop.social.facebook : `https://facebook.com/${shop.social.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                      <Facebook className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-slate-300 group-hover:text-white">Facebook</span>
                    </a>
                  )}
                  {shop?.social?.tiktok && (
                    <a href={`https://tiktok.com/@${shop.social.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                      <span className="text-sm font-bold text-white">TT</span>
                      <span className="text-sm text-slate-300 group-hover:text-white">TikTok</span>
                    </a>
                  )}
                  {shop?.social?.website && (
                    <a href={shop.social.website.startsWith('http') ? shop.social.website : `https://${shop.social.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group">
                      <Globe className="w-5 h-5 text-cyan-500" />
                      <span className="text-sm text-slate-300 group-hover:text-white">Website</span>
                    </a>
                  )}
                </div>
                <div className="mt-8">
                  <a
                    href={`https://wa.me/${(shop?.contact?.whatsapp || shop?.contact?.phone || "").replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-600/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar WhatsApp
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </SectionObserver>
    </div>
  );
}

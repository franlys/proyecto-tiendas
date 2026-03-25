import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ThemeProvider, CartProvider, OrdersProvider, InventoryProvider, WholesaleProvider } from "@/components/shared";
import { FloatingCart, ShopLayoutClient, StreetCart, WholesaleButton } from "@/components/shop";
import { CartUnlessTraining } from "@/components/shop/cart-unless-training";
import { BackgroundAudio } from "@/components/shop/background-audio";
import { Loader2 } from "lucide-react";
import { MOCK_SHOPS, DEFAULT_THEME, type ShopConfig } from "@/lib/constants";
import { normalizeBusinessType, getBusinessType } from "@/lib/types/business-types-v2";

// Force dynamic rendering to prevent caching and ensure fresh data on each request
export const dynamic = 'force-dynamic';

interface ShopLayoutProps {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}

// Helper para obtener tienda de múltiples fuentes
async function getShopData(shopId: string): Promise<ShopConfig | null> {
  // 1. Buscar en Firestore (Produccion / Base de Datos Real) - PRIORIDAD ALTA
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");

    // 1.1 Buscar por slug
    const shopsRef = collection(db, "shops");
    const q = query(shopsRef, where("slug", "==", shopId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const shopData = snapshot.docs[0].data();
      // Mapear a ShopConfig
      return {
        id: snapshot.docs[0].id,
        name: shopData.name,
        slug: shopData.slug || shopId, // Fallback to URL parameter if slug field is missing
        description: shopData.description || "",
        theme: shopData.theme || DEFAULT_THEME,
        contact: shopData.contact || {},
        businessType: normalizeBusinessType(
          shopData.businessType ||
          (shopData.category === "beauty" ? "beauty" :
            shopData.category === "repair" ? "repair" :
              shopData.category === "food" ? "restaurante" :
                shopData.category === "fitness" ? "gimnasio" :
                  shopData.category === "health" ? "clinica" :
                    "retail")
        ),
        businessTypes: shopData.businessTypes || [],
        wholesaleEnabled: shopData.wholesaleEnabled || false,
        // Shop features
        features: shopData.features || shopData.enabledFeatures,
        // Configuración visual
        banner: shopData.banner,
        logo: shopData.logo,
        pwaIcon: shopData.pwaIcon,
        slogan: shopData.slogan,
        social: shopData.social,
        background: shopData.background,
        backgroundAudio: shopData.backgroundAudio,
        templateType: shopData.templateType,
        dropTheme: shopData.dropTheme,
        mealPrepConfig: shopData.mealPrepConfig,
      } as ShopConfig;
    }

    // 1.2 Fallback: Intentar buscar por ID (si el usuario navegó a /shop-123 en vez de /slug)
    const docRef = doc(db, "shops", shopId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const shopData = docSnap.data();
      return {
        id: docSnap.id,
        name: shopData.name,
        slug: shopData.slug || shopId, // Fallback to URL parameter if slug field is missing
        description: shopData.description || "",
        theme: shopData.theme || DEFAULT_THEME,
        contact: shopData.contact || {},
        businessType: normalizeBusinessType(
          shopData.businessType ||
          (shopData.category === "beauty" ? "beauty" :
            shopData.category === "repair" ? "repair" :
              shopData.category === "food" ? "restaurante" :
                shopData.category === "fitness" ? "gimnasio" :
                  shopData.category === "health" ? "clinica" :
                    "retail")
        ),
        businessTypes: shopData.businessTypes || [],
        wholesaleEnabled: shopData.wholesaleEnabled || false,
        features: shopData.features || shopData.enabledFeatures,
        banner: shopData.banner,
        logo: shopData.logo,
        pwaIcon: shopData.pwaIcon,
        slogan: shopData.slogan,
        social: shopData.social,
        background: shopData.background,
        backgroundAudio: shopData.backgroundAudio,
        templateType: shopData.templateType,
        dropTheme: shopData.dropTheme,
        mealPrepConfig: shopData.mealPrepConfig,
      } as ShopConfig;
    }
  } catch (error) {
    console.error("Error fetching shop from Firestore:", error);
    // Continue to Mocks if Firestore fails or not found
  }

  // 2. Buscar en MOCK_SHOPS (tiendas demo/legacy) - FALLBACK
  const mockShop = MOCK_SHOPS[shopId];
  if (mockShop) {
    return mockShop;
  }

  // 3. Buscar en cookies (Legacy / Local Dev)
  try {
    const cookieStore = await cookies();
    const managedShopsCookie = cookieStore.get("linko-managed-shops");

    if (managedShopsCookie?.value) {
      const decodedValue = decodeURIComponent(managedShopsCookie.value);
      const managedShops = JSON.parse(decodedValue);
      const shop = managedShops.find((s: { slug: string }) => s.slug === shopId);

      if (shop) {
        return {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          description: shop.description || "",
          theme: shop.theme || DEFAULT_THEME,
          contact: shop.contact || {},
          templateType: shop.templateType,
          dropTheme: shop.dropTheme,
          businessType: shop.businessType || (shop.category === "beauty" ? "beauty" : shop.category === "repair" ? "repair" : "retail"),
          wholesaleEnabled: shop.wholesaleEnabled || false,
        };
      }
    }
  } catch (error) {
    console.error("Error reading managed shops from cookie:", error);
  }

  return null;
}

export async function generateMetadata({ params }: ShopLayoutProps) {
  const { shopId } = await params;
  const shop = await getShopData(shopId);

  if (!shop) {
    return {
      title: "Tienda no encontrada",
    };
  }

  const title = `${shop.name} | Reserva Online`;
  const description = `${shop.description}. Reserva tu cita por WhatsApp de forma rápida y sencilla.`;

  return {
    title,
    description,
    keywords: [
      shop.name,
      "reservas online",
      "citas",
      "estética",
      "belleza",
      "agenda digital",
      "WhatsApp",
    ],
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: shop.name,
      title,
      description,
      url: `/${shopId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    manifest: `/api/manifest/${shopId}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: shop.name,
    },
    icons: {
      icon: shop.pwaIcon || shop.logo || "/icons/icon-192.png",
      apple: shop.pwaIcon || shop.logo || "/icons/icon-192.png",
    },
  };
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
  const { shopId } = await params;

  // Buscar tienda en múltiples fuentes (MOCK_SHOPS y cookies)
  const shop = await getShopData(shopId);

  if (!shop) {
    notFound();
  }

  return (
    <ThemeProvider shop={shop}>
      <WholesaleProvider>
      <OrdersProvider>
        <InventoryProvider shopId={shop.id}>
        <CartProvider shopId={shop.id} templateType={shop.templateType}>
          <ShopLayoutClient shop={shop}>
            {shop.templateType === "premium-drop-v1" || shop.templateType === "street-drop-v1" || shop.templateType === "cosmic-drop-v1" || shop.templateType === "tech-drop-v1" || shop.templateType === "tech-3d-v1" || shop.templateType === "tech-premium-v2" ? (
              // Premium/Special templates handle their own layout completely
              <>
                <main className="min-h-screen relative overflow-hidden bg-[#1a1a1a]">
                  <Suspense fallback={
                    <div className="flex justify-center py-20 bg-black min-h-screen items-center">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                  }>
                    {children}
                  </Suspense>
                </main>
                {/* Template-specific Carts:
                    - cosmic-drop-v1: Uses CosmicCart (rendered inside CosmicDropLayout)
                    - street-drop-v1: Uses StreetCart
                    - premium-drop-v1: Uses FloatingCart
                */}
                {shop.templateType === "street-drop-v1" && <StreetCart />}
                {shop.templateType === "premium-drop-v1" && <FloatingCart />}
                {/* Wholesale button — fixed top-right only for templates without their own header */}
                {shop.wholesaleEnabled && (shop.templateType === "premium-drop-v1" || shop.templateType === "street-drop-v1" || shop.templateType === "cosmic-drop-v1") && (
                  <div className="fixed top-4 right-4 z-50">
                    <WholesaleButton shopId={shop.id} />
                  </div>
                )}
                {/* Background Audio (if configured) */}
                {shop.backgroundAudio?.enabled && shop.backgroundAudio?.url && (
                  <BackgroundAudio
                    audioUrl={shop.backgroundAudio.url}
                    volume={shop.backgroundAudio.volume}
                    loop={shop.backgroundAudio.loop}
                  />
                )}
              </>
            ) : (
              // Standard Template Layout Wrapper
              <div className="min-h-screen pb-24 relative">
                {/* Shop Header */}
                <header className="sticky top-0 z-50 glass-panel">
                  <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Shop Logo */}
                        {shop.logo ? (
                          <img
                            src={shop.logo}
                            alt={shop.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">
                              {shop.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h1 className="font-display text-xl font-semibold text-white truncate">
                            {shop.name}
                          </h1>
                          {shop.slogan && (
                            <p className="text-sm text-slate-400 truncate max-w-[200px] md:max-w-[300px]">{shop.slogan}</p>
                          )}
                        </div>
                      </div>

                      {/* Navigation - Adapt based on business type */}
                      <nav className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                        <a href={`/${shopId}`} className="hidden md:inline text-slate-300 hover:text-white transition-colors">
                          Inicio
                        </a>

                        {(() => {
                          const config = getBusinessType(shop.businessType || "");
                          const features = config?.features;
                          const TRAINING_TYPES = ["gimnasio", "crossfit", "entrenador_personal", "yoga", "pilates", "artes_marciales", "boxeo", "meal_prep"];
                          const allTypes = [...(shop.businessTypes || []), shop.businessType].filter(Boolean) as string[];
                          const isTraining = allTypes.some(t => TRAINING_TYPES.includes(t));

                          return (
                            <>
                              {/* Show Servicios for service-based businesses */}
                              {features?.services && !isTraining && (
                                <a href={`/${shopId}#servicios`} className="hidden md:inline text-slate-300 hover:text-white transition-colors">
                                  Servicios
                                </a>
                              )}
                              {/* Show Productos for retail and food */}
                              {features?.catalog && (
                                <a href={`/${shopId}#products`} className="hidden md:inline text-slate-300 hover:text-white transition-colors">
                                  Productos
                                </a>
                              )}
                              {/* Training businesses → Planes + Agendar */}
                              {isTraining && (
                                <>
                                  <a href={`/${shopId}#planes`} className="hidden md:inline text-slate-300 hover:text-white transition-colors">
                                    Planes
                                  </a>
                                  <a href={`/${shopId}/training`} className="hidden md:inline px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all font-medium">
                                    Agendar
                                  </a>
                                </>
                              )}
                              {/* Only show Reservar for booking-based non-training businesses */}
                              {features?.bookings && !isTraining && (
                                <a href={`/${shopId}/book`} className="hidden md:inline px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all">
                                  Reservar
                                </a>
                              )}
                            </>
                          );
                        })()}

                        {/* Wholesale mode button — always visible if enabled */}
                        {shop.wholesaleEnabled && (
                          <WholesaleButton shopId={shop.id} />
                        )}
                      </nav>
                    </div>
                  </div>
                </header>

                {/* Main Content */}
                <main>
                  <Suspense fallback={
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                  }>
                    {children}
                  </Suspense>
                </main>

                {/* Footer */}
                <footer className="border-t border-white/10 py-12 mt-20 bg-black/20">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
                      {/* Brand */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {shop.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-display font-bold text-white text-lg">{shop.name}</span>
                        </div>
                        <p className="text-sm text-slate-400">{shop.description || shop.slogan || `Tu tienda de confianza.`}</p>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Contacto</h4>
                        <ul className="text-sm text-slate-400 space-y-2">
                          {shop.contact?.address && <li>{shop.contact.address}</li>}
                          {shop.contact?.phone && (
                            <li>
                              <a href={`https://wa.me/${(shop.contact.whatsapp || shop.contact.phone).replace(/\D/g, '')}`} className="hover:text-primary transition-colors">
                                {shop.contact.whatsapp || shop.contact.phone}
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Social links */}
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold">Síguenos</h4>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          {shop.social?.instagram && (
                            <a href={`https://instagram.com/${shop.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" title="Instagram">
                              <span className="text-xs font-bold">IG</span>
                            </a>
                          )}
                          {shop.social?.facebook && (
                            <a href={shop.social.facebook.startsWith('http') ? shop.social.facebook : `https://facebook.com/${shop.social.facebook}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" title="Facebook">
                              <span className="text-xs font-bold">FB</span>
                            </a>
                          )}
                          {shop.social?.tiktok && (
                            <a href={`https://tiktok.com/@${shop.social.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" title="TikTok">
                              <span className="text-xs font-bold">TT</span>
                            </a>
                          )}
                          {shop.social?.website && (
                            <a href={shop.social.website.startsWith('http') ? shop.social.website : `https://${shop.social.website}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors" title="Website">
                              <span className="text-xs font-bold">WWW</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 text-center text-slate-500 text-sm">
                      <p>&copy; {new Date().getFullYear()} {shop.name}. Todos los derechos reservados.</p>
                      <p className="mt-2">
                        Powered by <span className="text-gradient-primary font-semibold">Linko</span>
                      </p>
                    </div>
                  </div>
                </footer>

                {/* Floating Cart - hidden on training page */}
                <CartUnlessTraining />

                {/* Background Audio (if configured) */}
                {shop.backgroundAudio?.enabled && shop.backgroundAudio?.url && (
                  <BackgroundAudio
                    audioUrl={shop.backgroundAudio.url}
                    volume={shop.backgroundAudio.volume}
                    loop={shop.backgroundAudio.loop}
                  />
                )}
              </div>
            )}
          </ShopLayoutClient>
        </CartProvider>
        </InventoryProvider>
      </OrdersProvider>
      </WholesaleProvider>
    </ThemeProvider>
  );
}

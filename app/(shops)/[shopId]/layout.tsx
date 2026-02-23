import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ThemeProvider, CartProvider, OrdersProvider } from "@/components/shared";
import { FloatingCart, ShopLayoutClient } from "@/components/shop";
import { BackgroundAudio } from "@/components/shop/background-audio";
import { Loader2 } from "lucide-react";
import { MOCK_SHOPS, DEFAULT_THEME, type ShopConfig } from "@/lib/constants";
import { normalizeBusinessType, getBusinessType } from "@/lib/types/business-types-v2";

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
        businessType: normalizeBusinessType(shopData.businessType || (shopData.category === "beauty" ? "beauty" : shopData.category === "repair" ? "repair" : "retail")),
        wholesaleEnabled: shopData.wholesaleEnabled || false,
        // Shop features
        features: shopData.features || shopData.enabledFeatures,
        // Configuración visual
        banner: shopData.banner,
        logo: shopData.logo,
        slogan: shopData.slogan,
        social: shopData.social,
        background: shopData.background,
        backgroundAudio: shopData.backgroundAudio,
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
        businessType: shopData.businessType || (shopData.category === "beauty" ? "beauty" : shopData.category === "repair" ? "repair" : "retail"),
        wholesaleEnabled: shopData.wholesaleEnabled || false,
        features: shopData.features || shopData.enabledFeatures,
        banner: shopData.banner,
        logo: shopData.logo,
        slogan: shopData.slogan,
        social: shopData.social,
        background: shopData.background,
        backgroundAudio: shopData.backgroundAudio,
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
      <OrdersProvider>
        <CartProvider shopId={shop.id}>
          <ShopLayoutClient shop={shop}>
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
                    <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
                      <a href={`/${shopId}`} className="text-slate-300 hover:text-white transition-colors">
                        Inicio
                      </a>

                      {(() => {
                        const config = getBusinessType(shop.businessType || "");
                        const features = config?.features;

                        return (
                          <>
                            {/* Show Servicios for service-based businesses */}
                            {features?.services && (
                              <a href={`/${shopId}#servicios`} className="text-slate-300 hover:text-white transition-colors">
                                Servicios
                              </a>
                            )}
                            {/* Show Productos for retail and food */}
                            {features?.catalog && (
                              <a href={`/${shopId}#products`} className="text-slate-300 hover:text-white transition-colors">
                                Productos
                              </a>
                            )}
                            {/* Only show Reservar for booking-based businesses */}
                            {features?.bookings && (
                              <a href={`/${shopId}/book`} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all">
                                Reservar
                              </a>
                            )}
                          </>
                        );
                      })()}
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
              <footer className="border-t border-white/10 py-8 mt-20">
                <div className="container mx-auto px-4 text-center text-slate-400">
                  <p>&copy; {new Date().getFullYear()} {shop.name}. Todos los derechos reservados.</p>
                  <p className="text-sm mt-2">
                    Powered by <span className="text-gradient-primary font-semibold">Linko</span>
                  </p>
                </div>
              </footer>

              {/* Floating Cart */}
              <FloatingCart />

              {/* Background Audio (if configured) */}
              {shop.backgroundAudio?.enabled && shop.backgroundAudio?.url && (
                <BackgroundAudio
                  audioUrl={shop.backgroundAudio.url}
                  volume={shop.backgroundAudio.volume}
                  loop={shop.backgroundAudio.loop}
                />
              )}
            </div>
          </ShopLayoutClient>
        </CartProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ThemeProvider, CartProvider, OrdersProvider } from "@/components/shared";
import { FloatingCart, ShopLayoutClient } from "@/components/shop";
import { MOCK_SHOPS, DEFAULT_THEME, type ShopConfig } from "@/lib/constants";

interface ShopLayoutProps {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}

// Helper para obtener tienda de múltiples fuentes
async function getShopData(shopId: string): Promise<ShopConfig | null> {
  // 1. Buscar en MOCK_SHOPS (tiendas demo/legacy)
  const mockShop = MOCK_SHOPS[shopId];
  if (mockShop) {
    return mockShop;
  }

  // 2. Buscar en cookies (tiendas creadas dinámicamente desde el panel de agencia)
  try {
    const cookieStore = await cookies();
    const managedShopsCookie = cookieStore.get("linko-managed-shops");

    if (managedShopsCookie?.value) {
      const decodedValue = decodeURIComponent(managedShopsCookie.value);
      const managedShops = JSON.parse(decodedValue);
      const shop = managedShops.find((s: { slug: string }) => s.slug === shopId);

      if (shop) {
        // Convertir ManagedShop a ShopConfig
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

  // 3. Buscar en Firestore (Produccion / Base de Datos Real)
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs } = await import("firebase/firestore");

    // 5.4 Buscar por slug
    const shopsRef = collection(db, "shops");
    const q = query(shopsRef, where("slug", "==", shopId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const shopData = snapshot.docs[0].data();

      // Mapear a ShopConfig
      return {
        id: snapshot.docs[0].id,
        name: shopData.name,
        slug: shopData.slug,
        description: shopData.description || "",
        theme: shopData.theme || DEFAULT_THEME,
        contact: shopData.contact || {},
        businessType: shopData.businessType || (shopData.category === "beauty" ? "beauty" : shopData.category === "repair" ? "repair" : "retail"),
        wholesaleEnabled: shopData.wholesaleEnabled || false,
        // Asegurar que features y configuración extra se pasen si es necesario en el futuro
      };
    } else {
      // 5.5 Fallback: Intentar buscar por ID (si el usuario navegó a /shop-123 en vez de /slug)
      const { doc, getDoc } = await import("firebase/firestore");
      const docRef = doc(db, "shops", shopId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const shopData = docSnap.data();
        return {
          id: docSnap.id,
          name: shopData.name,
          slug: shopData.slug,
          description: shopData.description || "",
          theme: shopData.theme || DEFAULT_THEME,
          contact: shopData.contact || {},
          businessType: shopData.businessType || (shopData.category === "beauty" ? "beauty" : shopData.category === "repair" ? "repair" : "retail"),
          wholesaleEnabled: shopData.wholesaleEnabled || false,
        };
      }
    }
  } catch (error) {
    console.error("Error fetching shop from Firestore:", error);
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
          <ShopLayoutClient>
            <div className="min-h-screen pb-24 relative">
              {/* Shop Header */}
              <header className="sticky top-0 z-50 glass-panel">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Logo placeholder */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {shop.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h1 className="font-display text-xl font-semibold text-white">
                          {shop.name}
                        </h1>
                        <p className="text-sm text-slate-400">{shop.description}</p>
                      </div>
                    </div>

                    {/* Navigation placeholder */}
                    <nav className="hidden md:flex items-center gap-6">
                      <a href={`/${shopId}`} className="text-slate-300 hover:text-white transition-colors">
                        Inicio
                      </a>
                      <a href={`/${shopId}#servicios`} className="text-slate-300 hover:text-white transition-colors">
                        Servicios
                      </a>
                      <a href={`/${shopId}/book`} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all">
                        Reservar
                      </a>
                    </nav>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main>{children}</main>

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
            </div>
          </ShopLayoutClient>
        </CartProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}

import { notFound } from "next/navigation";
import { ThemeProvider, CartProvider, OrdersProvider } from "@/components/shared";
import { FloatingCart, ShopLayoutClient } from "@/components/shop";
import { MOCK_SHOPS } from "@/lib/constants";

interface ShopLayoutProps {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}

export async function generateMetadata({ params }: ShopLayoutProps) {
  const { shopId } = await params;
  const shop = MOCK_SHOPS[shopId];

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

  // Simulate fetching shop data (hardcoded for Phase 1)
  const shop = MOCK_SHOPS[shopId];

  if (!shop) {
    notFound();
  }

  return (
    <ThemeProvider shop={shop}>
      <OrdersProvider>
        <CartProvider>
          <ShopLayoutClient>
          <div className="min-h-screen pb-24 relative">
          {/* Shop Header */}
          <header className="sticky top-0 z-50 glass-panel">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo placeholder */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
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
                  <a href={`/${shopId}/book`} className="px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white rounded-lg hover:shadow-lg transition-all">
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
                Powered by <span className="text-gradient-primary font-semibold">Proyecto Tiendas</span>
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

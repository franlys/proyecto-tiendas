import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider, ShopsProvider } from "@/components/shared";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Linko - Conexión Universal para Negocios",
    template: "%s | Linko",
  },
  description:
    "Linko: La plataforma universal para conectar tu negocio con tus clientes. Ideal para salones, talleres, tiendas y consultorios.",
  keywords: [
    "Linko",
    "reservas online",
    "citas",
    "estética",
    "barbería",
    "spa",
    "taller",
    "consultorio",
    "agenda digital",
    "WhatsApp booking",
  ],
  authors: [{ name: "Linko App" }],
  creator: "Linko App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Linko",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Linko",
    title: "Linko - Conexión Universal para Negocios",
    description:
      "Linko: La plataforma universal para conectar tu negocio con tus clientes. Agenda, vende y fideliza.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Linko - Conexión Universal para Negocios",
    description:
      "Linko: La plataforma universal para conectar tu negocio con tus clientes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ShopsProvider>
            {children}
          </ShopsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

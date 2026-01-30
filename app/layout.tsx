import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

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
    default: "Nexo - Conexión Universal para Negocios",
    template: "%s | Nexo",
  },
  description:
    "Nexo: La plataforma universal para conectar tu negocio con tus clientes. Ideal para salones, talleres, tiendas y consultorios.",
  keywords: [
    "Nexo",
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
  authors: [{ name: "Nexo App" }],
  creator: "Nexo App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexo",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Nexo",
    title: "Nexo - Conexión Universal para Negocios",
    description:
      "Nexo: La plataforma universal para conectar tu negocio con tus clientes. Agenda, vende y fideliza.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexo - Conexión Universal para Negocios",
    description:
      "Nexo: La plataforma universal para conectar tu negocio con tus clientes.",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

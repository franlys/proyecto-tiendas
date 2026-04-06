/**
 * POST /api/admin/seed-viora-products
 * Seeds sample fashion products into the viora-premium shop.
 * Safe to call multiple times — checks for existing products first.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const VIORA_PRODUCTS = [
  // ── TRAJES DE BAÑO ────────────────────────────────────────────────────────
  {
    name: "Bikini Halter Coral",
    description: "Bikini de dos piezas con top halter y braga de tiro alto. Tela de secado rápido con protección UV50.",
    price: 2800,
    promoPrice: 1890,
    stock: 30,
    lowStockThreshold: 5,
    category: "Trajes de Baño",
    image: "https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "XS", price: 2800, stock: 8 },
      { id: "v2", name: "S",  price: 2800, stock: 10 },
      { id: "v3", name: "M",  price: 2800, stock: 8 },
      { id: "v4", name: "L",  price: 2800, stock: 4 },
    ],
  },
  {
    name: "Traje de Baño Entero Negro",
    description: "One-piece de corte profundo en la espalda. Diseño minimalista de lujo, tela italiana.",
    price: 3500,
    promoPrice: null,
    stock: 20,
    lowStockThreshold: 4,
    category: "Trajes de Baño",
    image: "https://images.unsplash.com/photo-1570979752576-f34398e46b45?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "XS", price: 3500, stock: 5 },
      { id: "v2", name: "S",  price: 3500, stock: 6 },
      { id: "v3", name: "M",  price: 3500, stock: 6 },
      { id: "v4", name: "L",  price: 3500, stock: 3 },
    ],
  },
  {
    name: "Bikini Triángulo Blanco",
    description: "Set clásico triángulo con detalle de anillos dorados. La pieza esencial del verano.",
    price: 2400,
    promoPrice: 1650,
    stock: 25,
    lowStockThreshold: 5,
    category: "Trajes de Baño",
    image: "https://images.unsplash.com/photo-1603217011695-12f6a5aabe5d?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "XS", price: 2400, stock: 6 },
      { id: "v2", name: "S",  price: 2400, stock: 8 },
      { id: "v3", name: "M",  price: 2400, stock: 7 },
      { id: "v4", name: "L",  price: 2400, stock: 4 },
    ],
  },
  {
    name: "Pareo Playa Sarong",
    description: "Pareo largo multiusos de gasa ligera. Se anuda como falda, vestido o top.",
    price: 1200,
    promoPrice: null,
    stock: 40,
    lowStockThreshold: 8,
    category: "Trajes de Baño",
    image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "Talla Única", price: 1200, stock: 40 },
    ],
  },

  // ── VESTIDOS ──────────────────────────────────────────────────────────────
  {
    name: "Vestido Midi Lino Beige",
    description: "Vestido midi de lino natural con escote en V y manga corta. Perfecto para el verano dominicano.",
    price: 4200,
    promoPrice: 2990,
    stock: 18,
    lowStockThreshold: 4,
    category: "Vestidos",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "XS", price: 4200, stock: 3 },
      { id: "v2", name: "S",  price: 4200, stock: 5 },
      { id: "v3", name: "M",  price: 4200, stock: 6 },
      { id: "v4", name: "L",  price: 4200, stock: 4 },
    ],
  },
  {
    name: "Vestido Floral Maxi",
    description: "Vestido largo floral con escote halter. Tela fluida que se mueve con la brisa.",
    price: 5800,
    promoPrice: null,
    stock: 12,
    lowStockThreshold: 3,
    category: "Vestidos",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "XS", price: 5800, stock: 2 },
      { id: "v2", name: "S",  price: 5800, stock: 4 },
      { id: "v3", name: "M",  price: 5800, stock: 4 },
      { id: "v4", name: "L",  price: 5800, stock: 2 },
    ],
  },
  {
    name: "Mini Vestido Cut-Out Blanco",
    description: "Mini vestido con aberturas estratégicas en cintura y espalda. Tendencia editorial 2025.",
    price: 3900,
    promoPrice: 2700,
    stock: 15,
    lowStockThreshold: 3,
    category: "Vestidos",
    image: "https://images.unsplash.com/photo-1551895461-4a6a0e985ea4?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "XS", price: 3900, stock: 4 },
      { id: "v2", name: "S",  price: 3900, stock: 5 },
      { id: "v3", name: "M",  price: 3900, stock: 4 },
      { id: "v4", name: "L",  price: 3900, stock: 2 },
    ],
  },

  // ── ACCESORIOS ───────────────────────────────────────────────────────────
  {
    name: "Bolso Paja Trenzado",
    description: "Bolso de mano tejido a mano en paja natural. El complemento perfecto para la playa o el city look.",
    price: 1800,
    promoPrice: null,
    stock: 22,
    lowStockThreshold: 5,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "Natural", price: 1800, stock: 12 },
      { id: "v2", name: "Negro",   price: 1800, stock: 10 },
    ],
  },
  {
    name: "Lentes de Sol Oversized",
    description: "Lentes con montura de acetato tortuga y lentes polarizados UV400. Estilo 70s renovado.",
    price: 2200,
    promoPrice: 1490,
    stock: 30,
    lowStockThreshold: 6,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "Tortuga", price: 2200, stock: 15 },
      { id: "v2", name: "Negro",   price: 2200, stock: 10 },
      { id: "v3", name: "Blanco",  price: 2200, stock: 5 },
    ],
  },
  {
    name: "Collar Concha de Mar",
    description: "Collar de conchas naturales con cadena dorada de 18k. Hecho a mano en RD.",
    price: 950,
    promoPrice: null,
    stock: 35,
    lowStockThreshold: 8,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "Talla Única", price: 950, stock: 35 },
    ],
  },
  {
    name: "Sandalia Plana Trenzada",
    description: "Sandalia de cuero vegano trenzado con suela de goma. Comodidad todo el día.",
    price: 2600,
    promoPrice: 1890,
    stock: 20,
    lowStockThreshold: 4,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?q=80&w=800&auto=format&fit=crop",
    featured: true,
    variants: [
      { id: "v1", name: "35", price: 2600, stock: 3 },
      { id: "v2", name: "36", price: 2600, stock: 4 },
      { id: "v3", name: "37", price: 2600, stock: 5 },
      { id: "v4", name: "38", price: 2600, stock: 4 },
      { id: "v5", name: "39", price: 2600, stock: 3 },
      { id: "v6", name: "40", price: 2600, stock: 1 },
    ],
  },

  // ── TOPS / ROPA ──────────────────────────────────────────────────────────
  {
    name: "Top Crochet Arena",
    description: "Top tejido en crochet algodón de alta torsión. Ideal para usar sobre el traje de baño o con shorts.",
    price: 1650,
    promoPrice: null,
    stock: 28,
    lowStockThreshold: 6,
    category: "Ropa",
    image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "XS/S", price: 1650, stock: 14 },
      { id: "v2", name: "M/L",  price: 1650, stock: 14 },
    ],
  },
  {
    name: "Short Lino Natural",
    description: "Short de lino lavado de tiro alto con bolsillos. El básico de verano que nunca pasa de moda.",
    price: 1900,
    promoPrice: 1390,
    stock: 24,
    lowStockThreshold: 5,
    category: "Ropa",
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=800&auto=format&fit=crop",
    featured: false,
    variants: [
      { id: "v1", name: "XS", price: 1900, stock: 5 },
      { id: "v2", name: "S",  price: 1900, stock: 7 },
      { id: "v3", name: "M",  price: 1900, stock: 7 },
      { id: "v4", name: "L",  price: 1900, stock: 5 },
    ],
  },
];

export async function POST() {
  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "DB connection error" }, { status: 500 });
    }

    // Find the viora-premium shop
    const shopsSnap = await db.collection("shops")
      .where("templateType", "==", "viora-premium")
      .limit(1)
      .get();

    if (shopsSnap.empty) {
      return NextResponse.json({ error: "No se encontró un shop con templateType viora-premium" }, { status: 404 });
    }

    const shopDoc = shopsSnap.docs[0];
    const shopId = shopDoc.id;

    // Check existing products to avoid duplicates
    const existingSnap = await db.collection("shops").doc(shopId).collection("products").get();
    const existingNames = new Set(existingSnap.docs.map(d => d.data().name as string));

    const batch = db.batch();
    const added: string[] = [];

    for (const product of VIORA_PRODUCTS) {
      if (existingNames.has(product.name)) continue; // Skip if already exists

      const productId = `prod_viora_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const ref = db.collection("shops").doc(shopId).collection("products").doc(productId);

      batch.set(ref, {
        id: productId,
        name: product.name,
        description: product.description,
        price: product.price,
        ...(product.promoPrice ? { promoPrice: product.promoPrice } : {}),
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        category: product.category,
        image: product.image,
        featured: product.featured,
        variants: product.variants,
        infiniteStock: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      added.push(product.name);

      // Small delay to ensure unique IDs (batch commits at end anyway)
      await new Promise(r => setTimeout(r, 2));
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      shopId,
      shopName: shopDoc.data().name,
      added: added.length,
      skipped: VIORA_PRODUCTS.length - added.length,
      products: added,
    });

  } catch (error) {
    console.error("Seed viora products error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

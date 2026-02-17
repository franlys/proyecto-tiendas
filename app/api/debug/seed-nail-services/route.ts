import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

const NAIL_SALON_SERVICES = [
  // Manicure
  {
    id: "manicure-tradicional",
    name: "Manicure Tradicional",
    description: "Limpieza, limado, cutícula y esmalte regular",
    price: 150,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "manicure-spa",
    name: "Manicure Spa",
    description: "Incluye exfoliación, mascarilla hidratante y masaje de manos",
    price: 250,
    duration: 45,
    category: "unas",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400"
  },
  {
    id: "manicure-semipermanente",
    name: "Manicure Semipermanente",
    description: "Esmalte en gel con lámpara UV/LED, duración 2-3 semanas",
    price: 350,
    duration: 45,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },
  {
    id: "manicure-rusa",
    name: "Manicure Rusa",
    description: "Técnica de cutícula con torno eléctrico, acabado impecable",
    price: 400,
    duration: 60,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },

  // Pedicure
  {
    id: "pedicure-tradicional",
    name: "Pedicure Tradicional",
    description: "Limpieza profunda, exfoliación y esmalte regular",
    price: 200,
    duration: 45,
    category: "unas",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400"
  },
  {
    id: "pedicure-spa",
    name: "Pedicure Spa",
    description: "Tratamiento completo con mascarilla, masaje y aromaterapia",
    price: 350,
    duration: 60,
    category: "unas",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400"
  },
  {
    id: "pedicure-semipermanente",
    name: "Pedicure Semipermanente",
    description: "Pedicure completo con esmalte en gel de larga duración",
    price: 450,
    duration: 60,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },

  // Uñas Postizas
  {
    id: "unas-acrilicas",
    name: "Uñas Acrílicas",
    description: "Extensión con acrílico, largo y forma a elección",
    price: 550,
    duration: 90,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "unas-gel",
    name: "Uñas de Gel",
    description: "Extensión con gel constructor, acabado natural",
    price: 600,
    duration: 90,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },
  {
    id: "unas-polygel",
    name: "Uñas Polygel",
    description: "Técnica híbrida gel-acrílico, ligeras y resistentes",
    price: 650,
    duration: 90,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "relleno-acrilico",
    name: "Relleno Acrílico/Gel",
    description: "Mantenimiento de uñas postizas cada 2-3 semanas",
    price: 400,
    duration: 60,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "retiro-unas",
    name: "Retiro de Uñas",
    description: "Remoción segura de acrílico, gel o semipermanente",
    price: 150,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400"
  },

  // Nail Art
  {
    id: "diseno-frances",
    name: "Diseño Francés",
    description: "Clásico francés blanco o en colores",
    price: 100,
    duration: 20,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "diseno-piedras",
    name: "Diseño con Piedras",
    description: "Aplicación de cristales, perlas o piedras decorativas",
    price: 150,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },
  {
    id: "nail-art-3d",
    name: "Nail Art 3D",
    description: "Diseños en relieve con acrílico o gel",
    price: 200,
    duration: 45,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "diseno-premium",
    name: "Diseño Premium",
    description: "Diseños elaborados a mano alzada por uña",
    price: 80,
    duration: 15,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },

  // Efectos Especiales
  {
    id: "efecto-espejo",
    name: "Efecto Espejo (Chrome)",
    description: "Acabado metálico brillante tipo espejo",
    price: 180,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  },
  {
    id: "efecto-ojo-gato",
    name: "Efecto Ojo de Gato",
    description: "Gel magnético con efecto de línea brillante",
    price: 200,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400"
  },
  {
    id: "efecto-aurora",
    name: "Efecto Aurora/Unicornio",
    description: "Pigmento holográfico con reflejos iridiscentes",
    price: 180,
    duration: 30,
    category: "unas",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400"
  }
];

export async function GET() {
  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const shopId = "miosotis-nails";
    const servicesRef = db.collection("shops").doc(shopId).collection("services");

    // Add each service
    const results = [];
    for (const service of NAIL_SALON_SERVICES) {
      await servicesRef.doc(service.id).set({
        ...service,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      results.push(service.id);
    }

    return NextResponse.json({
      success: true,
      shopId,
      servicesAdded: results.length,
      services: results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

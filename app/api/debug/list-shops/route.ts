import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const shopsRef = db.collection("shops");
    const snapshot = await shopsRef.get();

    const shopsWithData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const slug = doc.data().slug || doc.id;

        // Get products count
        const productsSnapshot = await db.collection("shops").doc(slug).collection("products").get();

        // Get services count
        const servicesSnapshot = await db.collection("shops").doc(slug).collection("services").get();

        return {
          id: doc.id,
          name: doc.data().name,
          slug,
          businessType: doc.data().businessType || doc.data().category,
          isActive: doc.data().isActive,
          contact: doc.data().contact,
          productsCount: productsSnapshot.size,
          servicesCount: servicesSnapshot.size,
        };
      })
    );

    return NextResponse.json({
      count: shopsWithData.length,
      shops: shopsWithData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get("slug");

  if (!shopSlug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    const db = adminDb();
    if (!db) {
      return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // First try to find by slug
    const shopsRef = db.collection("shops");
    const querySnapshot = await shopsRef.where("slug", "==", shopSlug).limit(1).get();

    if (querySnapshot.empty) {
      // Try by ID
      const docSnapshot = await shopsRef.doc(shopSlug).get();
      if (!docSnapshot.exists) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
      }

      const data = docSnapshot.data();
      return NextResponse.json({
        success: true,
        shopId: docSnapshot.id,
        shopSlug: data?.slug,
        shopName: data?.name,
        background: data?.background || null,
        banner: data?.banner || null,
        backgroundAudio: data?.backgroundAudio || null,
        theme: data?.theme || null,
      });
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      success: true,
      shopId: doc.id,
      shopSlug: data.slug,
      shopName: data.name,
      background: data.background || null,
      banner: data.banner || null,
      backgroundAudio: data.backgroundAudio || null,
      theme: data.theme || null,
    });
  } catch (error) {
    console.error("Error fetching shop background:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop data", details: (error as Error).message },
      { status: 500 }
    );
  }
}

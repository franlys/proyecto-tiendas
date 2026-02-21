import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * GET /api/debug/services?shopId=xxx
 * Debug endpoint to check services in both collections
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  const db = adminDb();
  if (!db) {
    return NextResponse.json({ error: "DB not initialized" }, { status: 500 });
  }

  try {
    // Check new collection: bookingServices
    const newPath = `shops/${shopId}/bookingServices`;
    const newSnapshot = await db.collection(newPath).get();
    const newServices = newSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check legacy collection: services
    const legacyPath = `shops/${shopId}/services`;
    const legacySnapshot = await db.collection(legacyPath).get();
    const legacyServices = legacySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also check what shops exist
    const shopsSnapshot = await db.collection("shops").limit(10).get();
    const shopIds = shopsSnapshot.docs.map(doc => doc.id);

    return NextResponse.json({
      shopId,
      newCollection: {
        path: newPath,
        count: newServices.length,
        services: newServices
      },
      legacyCollection: {
        path: legacyPath,
        count: legacyServices.length,
        services: legacyServices
      },
      availableShops: shopIds
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to fetch",
      details: String(error)
    }, { status: 500 });
  }
}

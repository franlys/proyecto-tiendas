import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, fullName, phone, businessName, rnc, message } = body;

    if (!shopId || !fullName || !phone) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const docRef = await db
      .collection("shops")
      .doc(shopId)
      .collection("wholesaleRequests")
      .add({
        shopId,
        fullName,
        phone,
        businessName: businessName || null,
        rnc: rnc || null,
        message: message || null,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });

    // Push notification to admin
    try {
      const { sendPushToShop } = await import("@/lib/services/push-notification.service");
      await sendPushToShop(shopId, {
        title: "Nueva solicitud de mayorista",
        body: `${fullName} quiere ser distribuidor`,
        icon: "/icons/icon-192.png",
      });
    } catch {}

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("[Wholesale Requests] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) return NextResponse.json({ error: "shopId requerido" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const snap = await db
      .collection("shops")
      .doc(shopId)
      .collection("wholesaleRequests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[Wholesale Requests] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

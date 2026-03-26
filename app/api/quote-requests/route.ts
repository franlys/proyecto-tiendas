import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPushToShop } from "@/lib/services/push-notification.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, customerName, contactPreference, email, phone, category, description } = body;

    if (!shopId || !customerName || !category || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const quoteRef = db.collection("shops").doc(shopId).collection("quoteRequests").doc();

    await quoteRef.set({
      id: quoteRef.id,
      shopId,
      customerName,
      contactPreference,
      email: email || null,
      phone: phone || null,
      category,
      description,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Push notification al admin
    await sendPushToShop(shopId, {
      title: "Nueva Solicitud de Cotización",
      body: `${customerName} busca: ${category} — ${description.substring(0, 60)}`,
      tag: `quote-${quoteRef.id}`,
      data: { type: "quote_request", url: "/admin/quote-requests" },
      requireInteraction: true,
    });

    // Notificación en panel admin
    await db.collection("shops").doc(shopId).collection("notifications").add({
      type: "quote_request",
      title: "Nueva Solicitud de Cotización",
      message: `${customerName} busca: ${category}`,
      data: { quoteRequestId: quoteRef.id },
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: quoteRef.id });
  } catch (error) {
    console.error("[Quote Requests] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) return NextResponse.json({ error: "Falta shopId" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const snapshot = await db
      .collection("shops")
      .doc(shopId)
      .collection("quoteRequests")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[Quote Requests] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

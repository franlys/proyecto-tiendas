import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { shopId, status, adminNotes } = body;
    const { id } = params;

    if (!shopId || !id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    await db
      .collection("shops").doc(shopId)
      .collection("financingApplications").doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Financing] PATCH error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

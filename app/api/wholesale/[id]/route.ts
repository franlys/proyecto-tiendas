import { NextRequest, NextResponse } from "next/server";
import { updateWholesalerAdmin, deleteWholesalerAdmin, isCodeTakenAdmin } from "@/lib/services/wholesale-admin.service";

interface RouteParams { params: Promise<{ id: string }> }

// PUT /api/wholesale/[id]
// Body: { shopId, ...updates }
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { shopId, ...updates } = body;

    if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

    if (updates.code) {
      const taken = await isCodeTakenAdmin(shopId, updates.code, id);
      if (taken) {
        return NextResponse.json({ error: "Este código ya está en uso" }, { status: 409 });
      }
    }

    const wholesaler = await updateWholesalerAdmin(shopId, id, updates);
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });
    return NextResponse.json({ wholesaler });
  } catch {
    return NextResponse.json({ error: "Failed to update wholesaler" }, { status: 500 });
  }
}

// DELETE /api/wholesale/[id]?shopId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");

  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  try {
    const deleted = await deleteWholesalerAdmin(shopId, id);
    if (!deleted) return NextResponse.json({ error: "Failed to delete wholesaler" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete wholesaler" }, { status: 500 });
  }
}

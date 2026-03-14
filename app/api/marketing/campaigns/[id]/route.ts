import { NextRequest, NextResponse } from "next/server";
import { updateCampaignAdmin, deleteCampaignAdmin } from "@/lib/services/marketing-admin.service";

interface RouteParams { params: Promise<{ id: string }> }

// PUT /api/marketing/campaigns/[id]
// Body: { shopId, ...updates }
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const { shopId, ...updates } = await request.json();
    if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    await updateCampaignAdmin(shopId, id, updates);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/marketing/campaigns/[id]?shopId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  try {
    await deleteCampaignAdmin(shopId, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}

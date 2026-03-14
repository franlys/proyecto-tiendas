import { NextRequest, NextResponse } from "next/server";
import { getBranchByIdAdmin, updateBranchAdmin, deleteBranchAdmin } from "@/lib/services/branch-admin.service";

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/branches/[id]?shopId=xxx
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");

  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  try {
    const branch = await getBranchByIdAdmin(shopId, id);
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: "Failed to fetch branch" }, { status: 500 });
  }
}

// PUT /api/branches/[id]
// Body: { shopId, ...updates }
async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { shopId, ...updates } = body;

    if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

    const branch = await updateBranchAdmin(shopId, id, updates);
    if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }
}

export const PUT = handleUpdate;
export const PATCH = handleUpdate;

// DELETE /api/branches/[id]?shopId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");

  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  try {
    const deleted = await deleteBranchAdmin(shopId, id);
    if (!deleted) return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}

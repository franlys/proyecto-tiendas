import { NextRequest, NextResponse } from "next/server";
import { getBranchStockAdmin, setBranchStockAdmin } from "@/lib/services/branch-admin.service";

interface RouteParams { params: Promise<{ id: string }> }

// GET /api/branches/[id]/stock?shopId=xxx
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: branchId } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");

  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  try {
    const stock = await getBranchStockAdmin(shopId, branchId);
    return NextResponse.json({ stock });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}

// PUT /api/branches/[id]/stock
// Body: { shopId, productId, quantity }
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id: branchId } = await params;
  try {
    const { shopId, productId, quantity } = await request.json();

    if (!shopId || !productId || quantity === undefined) {
      return NextResponse.json({ error: "shopId, productId and quantity are required" }, { status: 400 });
    }

    const entry = await setBranchStockAdmin(shopId, branchId, productId, quantity);
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

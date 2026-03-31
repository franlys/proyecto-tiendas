import { NextRequest, NextResponse } from "next/server";
import { getBranchesAdmin, getActiveBranchesAdmin, createBranchAdmin } from "@/lib/services/branch-admin.service";
import type { CreateBranchInput } from "@/lib/types/branch.types";

// GET /api/branches?shopId=xxx
// GET /api/branches?shopId=xxx&active=true
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const activeOnly = searchParams.get("active") === "true";

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const branches = activeOnly
      ? await getActiveBranchesAdmin(shopId)
      : await getBranchesAdmin(shopId);
    return NextResponse.json({ branches });
  } catch {
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

// POST /api/branches
// Body: { shopId, name, address, phone?, whatsapp?, coordinates?, isMain? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...input } = body as { shopId: string } & CreateBranchInput;

    if (!shopId || !input.name || !input.address) {
      return NextResponse.json({ error: "shopId, name and address are required" }, { status: 400 });
    }

    const branch = await createBranchAdmin(shopId, input);
    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/branches]", err);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { validateWholesaleCodeAdmin } from "@/lib/services/wholesale-admin.service";

// POST /api/wholesale/validate
// Body: { shopId, code }
export async function POST(request: NextRequest) {
  try {
    const { shopId, code } = await request.json();

    if (!shopId || !code) {
      return NextResponse.json({ error: "shopId and code are required" }, { status: 400 });
    }

    const result = await validateWholesaleCodeAdmin(shopId, code);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }
}

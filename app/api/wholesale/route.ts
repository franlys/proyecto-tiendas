import { NextRequest, NextResponse } from "next/server";
import {
  getWholesalersAdmin,
  createWholesalerAdmin,
  isCodeTakenAdmin,
} from "@/lib/services/wholesale-admin.service";

// GET /api/wholesale?shopId=xxx
export async function GET(request: NextRequest) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  try {
    const wholesalers = await getWholesalersAdmin(shopId);
    return NextResponse.json({ wholesalers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch wholesalers" }, { status: 500 });
  }
}

// POST /api/wholesale
// Body: { shopId, name, email?, phone?, code, notes? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, name, email, phone, code, notes } = body;

    if (!shopId || !name || !code) {
      return NextResponse.json({ error: "shopId, name and code are required" }, { status: 400 });
    }

    const taken = await isCodeTakenAdmin(shopId, code);
    if (taken) {
      return NextResponse.json({ error: "Este código ya está en uso" }, { status: 409 });
    }

    const wholesaler = await createWholesalerAdmin(shopId, { name, email, phone, code, notes });
    return NextResponse.json({ wholesaler }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create wholesaler" }, { status: 500 });
  }
}

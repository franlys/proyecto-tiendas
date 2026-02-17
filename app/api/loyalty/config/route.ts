import { NextRequest, NextResponse } from "next/server";
import {
  getLoyaltyConfigAdmin,
  saveLoyaltyConfigAdmin,
} from "@/lib/services/loyalty-admin.service";

// GET /api/loyalty/config?shopId=xxx
export async function GET(request: NextRequest) {
  try {
    const shopId = request.nextUrl.searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    const config = await getLoyaltyConfigAdmin(shopId);

    return NextResponse.json({
      success: true,
      config: config || {
        enabled: false,
        stampsRequired: 10,
        reward: "Servicio Gratis",
        rewardType: "freeService",
        rewardValue: 100,
        stampsPerOrder: 1,
        minimumOrderAmount: 0,
        expirationDays: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, config } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    const success = await saveLoyaltyConfigAdmin(shopId, config);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getAllCustomersWithLoyaltyAdmin,
  getCustomersReadyToRedeemAdmin,
} from "@/lib/services/loyalty-admin.service";

// GET /api/loyalty/customers?shopId=xxx&filter=all|readyToRedeem
export async function GET(request: NextRequest) {
  try {
    const shopId = request.nextUrl.searchParams.get("shopId");
    const filter = request.nextUrl.searchParams.get("filter") || "all";

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    let customers;
    if (filter === "readyToRedeem") {
      customers = await getCustomersReadyToRedeemAdmin(shopId);
    } else {
      customers = await getAllCustomersWithLoyaltyAdmin(shopId);
    }

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

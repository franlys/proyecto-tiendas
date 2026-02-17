import { NextRequest, NextResponse } from "next/server";
import {
  getCustomerLoyaltyAdmin,
  getLoyaltyConfigAdmin,
  addStampsAdmin,
  redeemRewardAdmin,
} from "@/lib/services/loyalty-admin.service";

// GET /api/loyalty/customer?shopId=xxx&phone=xxx
export async function GET(request: NextRequest) {
  try {
    const shopId = request.nextUrl.searchParams.get("shopId");
    const phone = request.nextUrl.searchParams.get("phone");

    if (!shopId || !phone) {
      return NextResponse.json(
        { error: "shopId and phone are required" },
        { status: 400 }
      );
    }

    const [config, loyalty] = await Promise.all([
      getLoyaltyConfigAdmin(shopId),
      getCustomerLoyaltyAdmin(shopId, phone),
    ]);

    if (!config?.enabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        message: "Programa de lealtad no está activo",
      });
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      config: {
        stampsRequired: config.stampsRequired,
        reward: config.reward,
        rewardType: config.rewardType,
      },
      loyalty: loyalty || {
        currentStamps: 0,
        totalStampsEarned: 0,
        totalRewardsRedeemed: 0,
        nextRewardAt: config.stampsRequired,
      },
      canRedeem: (loyalty?.currentStamps || 0) >= config.stampsRequired,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/loyalty/customer - Add stamps or redeem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, shopId, phone, orderId, orderNumber, orderAmount } = body;

    if (!shopId || !phone) {
      return NextResponse.json(
        { error: "shopId and phone are required" },
        { status: 400 }
      );
    }

    if (action === "addStamps") {
      if (!orderId || !orderNumber || orderAmount === undefined) {
        return NextResponse.json(
          { error: "orderId, orderNumber and orderAmount are required for adding stamps" },
          { status: 400 }
        );
      }

      const result = await addStampsAdmin(
        shopId,
        phone,
        orderId,
        orderNumber,
        orderAmount
      );

      return NextResponse.json({
        success: result.success,
        stampsAdded: result.stampsAdded,
        newTotal: result.newTotal,
        canRedeem: result.canRedeem,
      });
    }

    if (action === "redeem") {
      const result = await redeemRewardAdmin(shopId, phone, orderId);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        redemption: result.redemption,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'addStamps' or 'redeem'" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

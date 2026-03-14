import { NextRequest, NextResponse } from "next/server";
import { getCampaignsAdmin, createCampaignAdmin } from "@/lib/services/marketing-admin.service";

// GET /api/marketing/campaigns?shopId=xxx
export async function GET(request: NextRequest) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  try {
    const campaigns = await getCampaignsAdmin(shopId);
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST /api/marketing/campaigns
// Body: { shopId, ...campaign }
export async function POST(request: NextRequest) {
  try {
    const { shopId, ...campaign } = await request.json();
    if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    const created = await createCampaignAdmin(shopId, campaign);
    return NextResponse.json({ campaign: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

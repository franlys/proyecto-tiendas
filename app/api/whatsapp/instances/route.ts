import { NextRequest, NextResponse } from "next/server";
import {
  createInstance,
  deleteInstance,
  getConnectionState,
  isEvolutionConfigured,
} from "@/lib/evolution";
import axios from "axios";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";

/**
 * GET /api/whatsapp/instances
 * List all WhatsApp instances
 */
export async function GET() {
  if (!isEvolutionConfigured()) {
    return NextResponse.json(
      { error: "Evolution API not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_KEY },
    });

    const instances = response.data.map((item: any) => ({
      instanceName: item.instance?.instanceName || item.name,
      status: item.instance?.status || item.state || "close",
      owner: item.instance?.owner,
      profileName: item.instance?.profileName,
      profilePictureUrl: item.instance?.profilePictureUrl,
    }));

    return NextResponse.json({ instances });
  } catch (error: any) {
    console.error("Error fetching instances:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch instances" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/instances
 * Create a new WhatsApp instance
 */
export async function POST(request: NextRequest) {
  if (!isEvolutionConfigured()) {
    return NextResponse.json(
      { error: "Evolution API not configured" },
      { status: 503 }
    );
  }

  try {
    const { shopSlug } = await request.json();

    if (!shopSlug) {
      return NextResponse.json(
        { error: "shopSlug is required" },
        { status: 400 }
      );
    }

    const instance = await createInstance(shopSlug);

    return NextResponse.json({
      success: true,
      instance,
    });
  } catch (error: any) {
    console.error("Error creating instance:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create instance" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp/instances?instanceName=xxx
 * Delete a WhatsApp instance
 */
export async function DELETE(request: NextRequest) {
  if (!isEvolutionConfigured()) {
    return NextResponse.json(
      { error: "Evolution API not configured" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get("instanceName");

    if (!instanceName) {
      return NextResponse.json(
        { error: "instanceName is required" },
        { status: 400 }
      );
    }

    await deleteInstance(instanceName);

    return NextResponse.json({
      success: true,
      message: `Instance ${instanceName} deleted`,
    });
  } catch (error: any) {
    console.error("Error deleting instance:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to delete instance" },
      { status: 500 }
    );
  }
}

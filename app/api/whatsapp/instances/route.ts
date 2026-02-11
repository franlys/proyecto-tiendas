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

    // Automatically set webhook
    try {
      // HARDCODED URL: Force production URL to avoid undefined/localhost issues
      const appUrl = "https://linko-app-pied.vercel.app";
      const webhookUrl = `${appUrl}/api/whatsapp/webhook`;

      const { setWebhook } = await import("@/lib/evolution");
      await setWebhook(instance.instanceName, webhookUrl);

      console.log(`Webhook set for ${instance.instanceName} to ${webhookUrl}`);
    } catch (webhookError) {
      console.error("Failed to set webhook:", webhookError);
      // We don't fail the request, but we log it
    }

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

    // Try to logout first (best effort)
    try {
      if (instanceName) {
        // Dynamic import to avoid circular dependency issues if any
        const { logoutInstance } = await import("@/lib/evolution");
        await logoutInstance(instanceName);
        console.log(`Logout successful for ${instanceName}`);
      }
    } catch (e: any) {
      console.warn(`Logout failed for ${instanceName} (proceeding to delete):`, e.message);
    }

    // Attempt to delete with robust error handling
    try {
      await deleteInstance(instanceName);
    } catch (deleteError: any) {
      // If error is 404/not found, consider it success (idempotency)
      const msg = deleteError.message || "";
      if (msg.includes("404") || msg.includes("not found") || msg.includes("does not exist")) {
        console.log(`Instance ${instanceName} already deleted (404), returning success`);
        return NextResponse.json({
          success: true,
          message: `Instance ${instanceName} deleted (was missing)`,
        });
      }
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: `Instance ${instanceName} deleted`,
    });
  } catch (error: any) {
    console.error("Error deleting instance:", error.message);

    // Even on error, we might want to tell client it's disconnected so UI updates
    // But for now, returning 500 is safer to alert user
    return NextResponse.json(
      { error: error.message || "Failed to delete instance" },
      { status: 500 }
    );
  }
}

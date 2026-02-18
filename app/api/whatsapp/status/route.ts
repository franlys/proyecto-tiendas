import { NextRequest, NextResponse } from "next/server";
import { isEvolutionConfigured } from "@/lib/evolution";
import axios from "axios";

export const dynamic = "force-dynamic";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";

/**
 * GET /api/whatsapp/status
 * Check WhatsApp connection status
 */
export async function GET(request: NextRequest) {
  const configured = isEvolutionConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      instances: [],
      message: "Evolution API not configured",
    });
  }

  try {
    // Fetch all instances
    console.log("[Status Debug] Fetching instances from Evolution...");
    const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_KEY },
    });

    console.log(`[Status Debug] Raw instances count: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log(`[Status Debug] First instance sample structure:`, JSON.stringify(response.data[0], null, 2));
    }

    let instances = response.data.map((item: any) => ({
      instanceName: item.instance?.instanceName || item.name,
      status: item.instance?.status || item.state || "close",
      owner: item.instance?.owner,
      profileName: item.instance?.profileName,
      profilePictureUrl: item.instance?.profilePictureUrl,
    }));

    console.log(`[Status Debug] Mapped instances statuses: ${instances.map((i: any) => `${i.instanceName}:${i.status}`).join(", ")}`);

    // Filter if instanceName param is present
    const { searchParams } = new URL(request.url);
    const targetInstance = searchParams.get("instanceName");

    if (targetInstance) {
      const specificInstance = instances.find((i: any) => i.instanceName === targetInstance);
      console.log(`[Status Debug] Target instance ${targetInstance} found? ${!!specificInstance}. Status: ${specificInstance?.status}`);

      return NextResponse.json({
        configured: true,
        connected: specificInstance?.status === "open",
        exists: !!specificInstance,
        status: specificInstance?.status || "disconnected",
        profile: specificInstance ? {
          name: specificInstance.profileName,
          phone: specificInstance.owner,
          picture: specificInstance.profilePictureUrl
        } : null
      });
    }

    const connectedInstances = instances.filter(
      (i: any) => i.status === "open"
    );

    // Self-healing: Ensure connected instances have webhook set
    if (connectedInstances.length > 0) {
      try {
        // Use centralized APP_URL
        const { APP_URL } = await import("@/lib/constants");
        const targetWebhookUrl = `${APP_URL}/api/whatsapp/webhook`;
        const { getWebhook, setWebhook } = await import("@/lib/evolution");

        // Check first connected instance (most likely the one being used)
        // In a real multi-tenant scenario we might want to check all, but let's be careful with rate limits
        const instanceToCheck = connectedInstances[0];

        // We do this async to not block the status check
        (async () => {
          try {
            const currentWebhook = await getWebhook(instanceToCheck.instanceName);
            if (!currentWebhook || currentWebhook.url !== targetWebhookUrl || !currentWebhook.webhook_by_events) {
              console.log(`[Status Fix] Setting missing/wrong webhook for ${instanceToCheck.instanceName}`);
              await setWebhook(instanceToCheck.instanceName, targetWebhookUrl);
            }
          } catch (err) {
            console.error(`[Status Fix] Failed to check/set webhook for ${instanceToCheck.instanceName}`, err);
          }
        })();
      } catch (e) {
        // ignore setup errors
      }
    }

    return NextResponse.json({
      configured: true,
      connected: connectedInstances.length > 0,
      totalInstances: instances.length,
      connectedInstances: connectedInstances.length,
      instances,
    });
  } catch (error: any) {
    console.error("Error checking WhatsApp status:", error.message);
    return NextResponse.json({
      configured: true,
      connected: false,
      error: error.message,
      instances: [],
    });
  }
}

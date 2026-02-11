import { NextRequest, NextResponse } from "next/server";
import { isEvolutionConfigured } from "@/lib/evolution";
import axios from "axios";

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
    const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: EVOLUTION_KEY },
    });

    let instances = response.data.map((item: any) => ({
      instanceName: item.instance?.instanceName || item.name,
      status: item.instance?.status || item.state || "close",
      owner: item.instance?.owner,
      profileName: item.instance?.profileName,
      profilePictureUrl: item.instance?.profilePictureUrl,
    }));

    // Filter if instanceName param is present
    const { searchParams } = new URL(request.url);
    const targetInstance = searchParams.get("instanceName");

    if (targetInstance) {
      const specificInstance = instances.find((i: any) => i.instanceName === targetInstance);

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

import { NextRequest, NextResponse } from "next/server";
import { fetchQRCode, getConnectionState, isEvolutionConfigured } from "@/lib/evolution";

/**
 * GET /api/whatsapp/connect?instanceName=xxx
 * Get QR code for WhatsApp connection
 */
export async function GET(request: NextRequest) {
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

    // First check connection state
    const state = await getConnectionState(instanceName);

    if (state.state === "open") {
      return NextResponse.json({
        connected: true,
        state: "open",
        message: "Already connected to WhatsApp",
      });
    }

    // Get QR code if not connected
    const qrData = await fetchQRCode(instanceName);

    return NextResponse.json({
      connected: false,
      state: state.state,
      qrcode: qrData.base64,
      pairingCode: qrData.pairingCode,
    });
  } catch (error: any) {
    console.error("Error getting QR code:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to get QR code" },
      { status: 500 }
    );
  }
}

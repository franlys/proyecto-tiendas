import { NextRequest, NextResponse } from "next/server";
import { fetchQRCode, getConnectionState, createInstance, isEvolutionConfigured } from "@/lib/evolution";

/**
 * GET /api/whatsapp/connect?instanceName=xxx
 * Get QR code for WhatsApp connection
 * Auto-creates instance if it doesn't exist
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
    let state: { state: string };
    try {
      state = await getConnectionState(instanceName);
    } catch (stateError: any) {
      // Instance doesn't exist - create it
      if (stateError.message?.includes("404") || stateError.message?.includes("does not exist")) {
        console.log(`Instance ${instanceName} doesn't exist, creating...`);
        try {
          await createInstance(instanceName);
          console.log(`Instance ${instanceName} created successfully`);
          // After creation, try to get QR code directly
          const qrData = await fetchQRCode(instanceName);
          return NextResponse.json({
            connected: false,
            state: "close",
            qrcode: qrData.base64,
            base64: qrData.base64,
            pairingCode: qrData.pairingCode,
          });
        } catch (createError: any) {
          console.error("Error creating instance:", createError.message);
          return NextResponse.json(
            { error: `Failed to create instance: ${createError.message}` },
            { status: 500 }
          );
        }
      }
      throw stateError;
    }

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
      base64: qrData.base64,
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

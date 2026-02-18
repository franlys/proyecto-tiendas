import { NextRequest, NextResponse } from "next/server";
import { fetchQRCode, getConnectionState, createInstance, isEvolutionConfigured } from "@/lib/evolution";

export const dynamic = "force-dynamic";

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

    const forceWebhook = searchParams.get("forceWebhook") === "true";

    if (forceWebhook) {
      try {
        // Use centralized APP_URL
        const { APP_URL } = await import("@/lib/constants");
        const webhookUrl = `${APP_URL}/api/whatsapp/webhook`;

        const { setWebhook, getWebhook } = await import("@/lib/evolution");
        await setWebhook(instanceName, webhookUrl);

        // Verify it was set
        const status = await getWebhook(instanceName);

        console.log(`[Force Webhook] Updated ${instanceName} to ${webhookUrl}`);

        return NextResponse.json({
          success: true,
          message: "Webhook forced update successful",
          webhook: status
        });
      } catch (e: any) {
        console.error("Force webhook failed:", e);
        return NextResponse.json(
          { error: `Failed to force webhook: ${e.message}` },
          { status: 500 }
        );
      }
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

          // Automatically set webhook
          try {
            // HARDCODED URL: Force production URL to avoid undefined/localhost issues
            // Use centralized APP_URL
            const { APP_URL } = await import("@/lib/constants");
            const webhookUrl = `${APP_URL}/api/whatsapp/webhook`;

            const { setWebhook } = await import("@/lib/evolution");
            await setWebhook(instanceName, webhookUrl);

            console.log(`Webhook set for ${instanceName} to ${webhookUrl}`);
          } catch (webhookError) {
            console.error("Failed to set webhook:", webhookError);
          }

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
      // Ensure webhook is set even if already connected (self-healing)
      try {
        // HARDCODED URL: Force production URL to avoid undefined/localhost issues
        // Use centralized APP_URL
        const { APP_URL } = await import("@/lib/constants");
        const webhookUrl = `${APP_URL}/api/whatsapp/webhook`;

        const { setWebhook } = await import("@/lib/evolution");
        // We do this asynchronously to not block the response
        setWebhook(instanceName, webhookUrl).catch(e => console.error("Background webhook set failed:", e));
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        connected: true,
        state: "open",
        message: "Already connected to WhatsApp",
      });
    }

    // Ensure webhook is set before fetching QR (even if instance exists)
    try {
      // HARDCODED URL: Force production URL to avoid undefined/localhost issues
      // Use centralized APP_URL
      const { APP_URL } = await import("@/lib/constants");
      const webhookUrl = `${APP_URL}/api/whatsapp/webhook`;

      const { setWebhook } = await import("@/lib/evolution");
      await setWebhook(instanceName, webhookUrl);

      console.log(`[Connect] Webhook ensured for ${instanceName} (while getting QR)`);
    } catch (e) {
      console.error("Webhook set failed:", e);
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

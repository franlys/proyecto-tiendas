import { NextRequest, NextResponse } from "next/server";
import {
  sendTextMessage,
  sendImage,
  sendDocument,
  isEvolutionConfigured,
} from "@/lib/evolution";

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message
 */
export async function POST(request: NextRequest) {
  if (!isEvolutionConfigured()) {
    return NextResponse.json(
      { error: "Evolution API not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { instanceName, phone, message, type = "text", mediaUrl, fileName, caption } = body;

    if (!instanceName || !phone) {
      return NextResponse.json(
        { error: "instanceName and phone are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "text":
        if (!message) {
          return NextResponse.json(
            { error: "message is required for text type" },
            { status: 400 }
          );
        }
        result = await sendTextMessage(instanceName, phone, message);
        break;

      case "image":
        if (!mediaUrl) {
          return NextResponse.json(
            { error: "mediaUrl is required for image type" },
            { status: 400 }
          );
        }
        result = await sendImage(instanceName, phone, mediaUrl, caption);
        break;

      case "document":
        if (!mediaUrl || !fileName) {
          return NextResponse.json(
            { error: "mediaUrl and fileName are required for document type" },
            { status: 400 }
          );
        }
        result = await sendDocument(instanceName, phone, mediaUrl, fileName, caption);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown message type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      messageId: result.key?.id,
      status: result.status,
    });
  } catch (error: any) {
    console.error("Error sending message:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

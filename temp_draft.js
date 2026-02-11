const axios = require("axios");

// Configuration
// We need the API Key and URL. Since this is a local script, we need to paste them or read them.
// Assuming the user has them in verify-debug-logs.js or similar? No.
// I will assume the user has to run this locally, but they won't have the ENV vars set in their terminal usually.
// I will try to read from a local .env file if it exists, or ask the user.
// actually, I'll rely on the fact that I can see the DIAGNOSTIC output which had the baseUrl.
// I don't have the API Key visible in the diagnostic output (good security).
// But I can try to "guess" it if it's in the repo... no.
// I will use the "test-webhook-simulate.js" style but for OUTBOUND.
// Wait, I can't run this locally if I don't have the API KEY.
// The user has the API KEY in Vercel.

// Better approach:
// create a new route `app/api/debug/test-send/route.ts`
// This runs on Vercel, has access to ENV, and can trigger the send.
// Then I ask the user to visit it.

// Let's do that.

const content = `
import { NextResponse } from "next/server";
import { sendTextMessage } from "@/lib/evolution";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const instance = "shop_surprise_gifts_v2";

  if (!phone) {
    return NextResponse.json({ error: "Missing phone param" }, { status: 400 });
  }

  try {
    console.log("Attempting to send test message to", phone, "via", instance);
    const result = await sendTextMessage(instance, phone, "🔔 *PRUEBA DE CONEXIÓN*\n\nSi lees esto, el servidor puede ENVIAR mensajes (Salida OK).");
    
    return NextResponse.json({ 
      success: true, 
      result 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to send", 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
`;

module.exports = { content };

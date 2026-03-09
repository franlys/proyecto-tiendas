import { NextRequest, NextResponse } from "next/server";
import { getShopBasicInfo } from "@/lib/services/whatsapp-config.service";
import { sendEmail, emailTemplates } from "@/lib/email";

/**
 * GET /api/debug/email-test?shopId=xxx
 * Test email configuration and sending for a shop
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  const diagnostics: Record<string, any> = {
    shopId,
    timestamp: new Date().toISOString(),
  };

  // 1. Check RESEND_API_KEY
  diagnostics.resendApiKey = {
    configured: !!process.env.RESEND_API_KEY,
    length: process.env.RESEND_API_KEY?.length || 0,
    prefix: process.env.RESEND_API_KEY?.substring(0, 6) || "N/A",
  };

  // 2. Get shop info
  try {
    const shopInfo = await getShopBasicInfo(shopId);

    diagnostics.shopInfo = {
      found: !!shopInfo,
      name: shopInfo?.name,
      slug: shopInfo?.slug,
      contactEmail: shopInfo?.contact?.email || null,
      ownerNotificationPhone: shopInfo?.ownerNotificationPhone || null,
      hasTheme: !!shopInfo?.theme,
      primaryColor: shopInfo?.theme?.primaryColor || null,
    };

    // 3. Try sending a test email if shop has email
    if (shopInfo?.contact?.email) {
      diagnostics.testEmail = {
        to: shopInfo.contact.email,
        attempting: true,
      };

      try {
        const testContent = emailTemplates.newBookingNotification({
          shopName: shopInfo.name || shopId,
          shopLogo: shopInfo.logo,
          shopPrimaryColor: shopInfo.theme?.primaryColor,
          orderNumber: "TEST-001",
          customerName: "Cliente de Prueba",
          customerPhone: "+52 555 123 4567",
          customerEmail: "test@example.com",
          serviceName: "Servicio de Prueba",
          servicePrice: 500,
          date: new Date().toISOString().split("T")[0],
          time: "10:00",
          duration: 60,
        });

        const result = await sendEmail({
          to: shopInfo.contact.email,
          subject: "🧪 Prueba de Email - Linko App",
          html: testContent,
        });

        diagnostics.testEmail.result = result;
      } catch (emailError: any) {
        diagnostics.testEmail.error = emailError.message;
      }
    } else {
      diagnostics.testEmail = {
        skipped: true,
        reason: "No contact email configured for this shop",
      };
    }
  } catch (shopError: any) {
    diagnostics.shopInfo = {
      error: shopError.message,
    };
  }

  return NextResponse.json(diagnostics);
}

export const runtime = "nodejs";

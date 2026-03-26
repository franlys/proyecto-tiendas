import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/email";
import { sendPushToShop } from "@/lib/services/push-notification.service";
import type { FinancingApplication } from "@/lib/types/financing.types";

function buildBankEmailHtml(app: Omit<FinancingApplication, "id" | "shopId" | "status" | "createdAt">, shopName: string, bankName: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:28px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
              ${shopName}
            </h1>
            <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
              Solicitud de Financiamiento — ${bankName}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <tr>
                <td style="padding-bottom:20px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Fecha de Solicitud</p>
                  <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.requestDate}</p>
                </td>
              </tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Nombre Completo</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.fullName}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Cédula del Cliente</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.cedula}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Dirección</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.address}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Referencia de Donde Vive</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.referencia}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Teléfono</p>
                      <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.phone}</p>
                    </td>
                    <td width="50%">
                      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Celular</p>
                      <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.celular}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Lugar de Trabajo</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;">${app.workplace}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Descripción del Artículo</p>
                <p style="margin:0;font-size:15px;color:#1a1a1a;font-weight:600;white-space:pre-line;">${app.articleDescription}</p>
              </td></tr>

              <tr><td style="border-top:1px solid #eee;padding:20px 0;background:#f9f9f9;border-radius:8px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Monto Total Solicitado</p>
                <p style="margin:0;font-size:24px;color:#1a1a1a;font-weight:900;">RD$ ${Number(app.totalAmount).toLocaleString("es-DO")}</p>
              </td></tr>

            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">
              Solicitud enviada desde la tienda digital de ${shopName} — ${new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId, fullName, cedula, address, referencia,
      phone, celular, workplace, articleDescription, totalAmount,
    } = body;

    if (!shopId || !fullName || !cedula || !totalAmount) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    // Get shop info + financing config
    const shopDoc = await db.collection("shops").doc(shopId).get();
    const shopData = shopDoc.data();
    const shopName = shopData?.name || "Tienda";

    const configDoc = await db.collection("shops").doc(shopId).collection("settings").doc("financing").get();
    const config = configDoc.exists ? configDoc.data() : null;
    const bankEmail = config?.bankEmail || null;
    const bankName = config?.bankName || "BANFONDESA";

    const requestDate = new Date().toLocaleDateString("es-DO", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Save to Firestore
    const appRef = db.collection("shops").doc(shopId).collection("financingApplications").doc();
    await appRef.set({
      id: appRef.id,
      shopId,
      requestDate,
      fullName,
      cedula,
      address: address || "",
      referencia: referencia || "",
      phone: phone || "",
      celular,
      workplace: workplace || "",
      articleDescription: articleDescription || "",
      totalAmount: Number(totalAmount),
      status: "submitted",
      createdAt: FieldValue.serverTimestamp(),
    });

    const appData = {
      requestDate, fullName, cedula, address, referencia,
      phone, celular, workplace, articleDescription, totalAmount,
    };

    // Send email to bank if configured
    if (bankEmail) {
      await sendEmail({
        to: bankEmail,
        subject: `Solicitud de Financiamiento — ${fullName} | ${shopName}`,
        html: buildBankEmailHtml(appData, shopName, bankName),
      });
    }

    // Push notification + admin notification
    await sendPushToShop(shopId, {
      title: "Nueva Solicitud de Financiamiento",
      body: `${fullName} solicita RD$ ${Number(totalAmount).toLocaleString()} — ${bankName}`,
      tag: `financing-${appRef.id}`,
      data: { type: "financing", url: "/admin/financing" },
      requireInteraction: true,
    });

    await db.collection("shops").doc(shopId).collection("notifications").add({
      type: "financing",
      title: "Nueva Solicitud de Financiamiento",
      message: `${fullName} solicita RD$ ${Number(totalAmount).toLocaleString()}`,
      data: { financingId: appRef.id },
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: appRef.id });
  } catch (error) {
    console.error("[Financing] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) return NextResponse.json({ error: "Falta shopId" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 });

    const snapshot = await db
      .collection("shops").doc(shopId).collection("financingApplications")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[Financing] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

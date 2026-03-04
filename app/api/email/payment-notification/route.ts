import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const {
            to,
            shopName,
            shopLogo,
            shopPrimaryColor,
            shopBackgroundImage,
            customerName,
            customerPhone,
            customerEmail,
            amount,
            currency,
            paymentMethod,
            receiptUrl,
            referenceNumber,
            orderId,
            orderNumber,
            receiptId,
        } = data;

        if (!to || !customerName || !amount || !receiptUrl) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
                { status: 400 }
            );
        }

        // Generate email HTML using the template
        const html = emailTemplates.paymentReceiptNotification({
            shopName: shopName || "Tu Tienda",
            shopLogo,
            shopPrimaryColor,
            shopBackgroundImage,
            customerName,
            customerPhone: customerPhone || "No proporcionado",
            customerEmail,
            amount,
            currency: currency || "USD",
            paymentMethod: paymentMethod || "Transferencia",
            receiptUrl,
            referenceNumber,
            orderId,
            orderNumber,
        });

        // Send email
        const result = await sendEmail({
            to,
            subject: `💰 Nuevo comprobante de pago - ${customerName}`,
            html,
        });

        if (!result.success) {
            console.error("Error sending payment notification email:", result.error);
            return NextResponse.json(
                { error: result.error || "Error al enviar el email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
        });

    } catch (error: any) {
        console.error("Error in payment notification endpoint:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}

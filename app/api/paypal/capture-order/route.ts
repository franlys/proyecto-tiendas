/**
 * PayPal Capture Order API
 * POST /api/paypal/capture-order
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { capturePayPalOrder, isPayPalConfigured } from "@/lib/paypal";

export async function POST(request: NextRequest) {
    try {
        if (!isPayPalConfigured()) {
            return NextResponse.json(
                { error: "PayPal no está configurado" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { paypalOrderId, shopId } = body;

        if (!paypalOrderId || !shopId) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: paypalOrderId, shopId" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Error de conexión a la base de datos" },
                { status: 500 }
            );
        }

        // Capture the PayPal order
        const captureResult = await capturePayPalOrder(paypalOrderId);

        if (!captureResult) {
            return NextResponse.json(
                { error: "Error al capturar el pago" },
                { status: 500 }
            );
        }

        // Update payment record
        const paymentRef = db
            .collection("shops")
            .doc(shopId)
            .collection("payments")
            .doc(paypalOrderId);

        const paymentDoc = await paymentRef.get();

        if (paymentDoc.exists) {
            const paymentData = paymentDoc.data();

            await paymentRef.update({
                status: captureResult.status === "COMPLETED" ? "succeeded" : "failed",
                paypalCaptureId: captureResult.captureId,
                payerEmail: captureResult.payer?.email,
                payerName: captureResult.payer?.name,
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Update the order
            if (paymentData?.orderId) {
                await db
                    .collection("shops")
                    .doc(shopId)
                    .collection("orders")
                    .doc(paymentData.orderId)
                    .update({
                        paymentStatus: captureResult.status === "COMPLETED" ? "paid" : "failed",
                        status: captureResult.status === "COMPLETED" ? "confirmed" : "pending",
                        paidAt: captureResult.status === "COMPLETED" ? new Date().toISOString() : null,
                        updatedAt: new Date().toISOString(),
                    });
            }
        }

        return NextResponse.json({
            success: true,
            status: captureResult.status,
            captureId: captureResult.captureId,
            payer: captureResult.payer,
        });
    } catch (error) {
        console.error("PayPal capture error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

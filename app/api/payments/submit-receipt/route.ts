import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const {
            orderId,
            shopId,
            customerName,
            customerPhone,
            customerEmail,
            paymentMethodId,
            paymentMethodName,
            paymentMethodType,
            amount,
            currency,
            receiptUrl,
            referenceNumber,
            customerNote,
        } = data;

        // Validate required fields
        if (!orderId || !shopId || !customerName || !paymentMethodId || !receiptUrl) {
            return NextResponse.json(
                { error: "Faltan campos requeridos" },
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

        // Create receipt document
        const receiptData = {
            orderId,
            shopId,
            customerName,
            customerPhone: customerPhone || "",
            customerEmail: customerEmail || "",
            paymentMethodId,
            paymentMethodName,
            paymentMethodType,
            amount,
            currency: currency || "USD",
            receiptUrl,
            referenceNumber: referenceNumber || "",
            status: "pending",
            customerNote: customerNote || "",
            submittedAt: FieldValue.serverTimestamp(),
        };

        // Save to Firestore
        const receiptRef = await db
            .collection("shops")
            .doc(shopId)
            .collection("payment-receipts")
            .add(receiptData);

        // Update order with payment info
        try {
            await db
                .collection("shops")
                .doc(shopId)
                .collection("orders")
                .doc(orderId)
                .update({
                    paymentStatus: "pending_validation",
                    paymentReceiptId: receiptRef.id,
                    paymentMethod: paymentMethodName,
                    paymentMethodType: paymentMethodType,
                    updatedAt: FieldValue.serverTimestamp(),
                });
        } catch (err) {
            // Order might not exist yet, ignore
            console.log("Order not found for update:", orderId);
        }

        // Get shop info for email notification
        const shopDoc = await db.collection("shops").doc(shopId).get();
        const shopData = shopDoc.data();

        // Send email notification to shop owner
        if (shopData?.contact?.email || shopData?.ownerEmail) {
            const ownerEmail = shopData.ownerEmail || shopData.contact?.email;
            const shopName = shopData.name || "Tu tienda";

            try {
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/email/payment-notification`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: ownerEmail,
                        shopName,
                        customerName,
                        customerPhone,
                        customerEmail,
                        amount,
                        currency,
                        paymentMethod: paymentMethodName,
                        receiptUrl,
                        referenceNumber,
                        orderId,
                        receiptId: receiptRef.id,
                    }),
                });
            } catch (emailError) {
                console.error("Error sending email notification:", emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            receiptId: receiptRef.id,
        });

    } catch (error: any) {
        console.error("Error submitting payment receipt:", error);
        return NextResponse.json(
            { error: error.message || "Error al procesar el comprobante" },
            { status: 500 }
        );
    }
}

/**
 * PayPal Create Order API
 * POST /api/paypal/create-order
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import type { ShopPaymentConfig } from "@/lib/types/payment.types";

export async function POST(request: NextRequest) {
    try {
        if (!isPayPalConfigured()) {
            return NextResponse.json(
                { error: "PayPal no está configurado" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const {
            shopId,
            orderId,
            items,
            deliveryFee = 0,
        } = body;

        // Validate required fields
        if (!shopId || !orderId || !items?.length) {
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

        // Get shop payment config
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            return NextResponse.json(
                { error: "Tienda no encontrada" },
                { status: 404 }
            );
        }

        const shopData = shopDoc.data();
        const payments = shopData?.payments as ShopPaymentConfig | undefined;

        if (!payments?.enabled || payments?.provider !== "paypal") {
            return NextResponse.json(
                { error: "PayPal no está habilitado para esta tienda" },
                { status: 400 }
            );
        }

        // Build items including delivery fee if present
        const orderItems = [...items];
        if (deliveryFee > 0) {
            orderItems.push({
                name: "Cargo por envío",
                description: "Delivery fee",
                quantity: 1,
                unitPrice: deliveryFee,
            });
        }

        // Create PayPal order
        const paypalOrder = await createPayPalOrder({
            items: orderItems,
            currency: payments.currency || "USD",
            shopId,
            orderId,
            paypalEmail: payments.paypalEmail, // Payment goes to shop owner's PayPal
        });

        if (!paypalOrder) {
            return NextResponse.json(
                { error: "Error al crear orden de PayPal" },
                { status: 500 }
            );
        }

        // Create payment record in Firestore
        const totalAmount = orderItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        const paymentRecord = {
            orderId,
            shopId,
            paypalOrderId: paypalOrder.id,
            amount: Math.round(totalAmount * 100), // Store in cents
            currency: payments.currency || "USD",
            status: "pending",
            provider: "paypal",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db
            .collection("shops")
            .doc(shopId)
            .collection("payments")
            .doc(paypalOrder.id)
            .set(paymentRecord);

        // Update order with payment info
        await db
            .collection("shops")
            .doc(shopId)
            .collection("orders")
            .doc(orderId)
            .update({
                paypalOrderId: paypalOrder.id,
                paymentStatus: "pending",
                paymentProvider: "paypal",
                updatedAt: new Date().toISOString(),
            });

        return NextResponse.json({
            success: true,
            orderId: paypalOrder.id,
        });
    } catch (error) {
        console.error("PayPal create order error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

/**
 * Stripe Checkout Session API
 * POST /api/stripe/checkout - Create checkout session
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { toCents } from "@/lib/types/payment.types";
import type { ShopPaymentConfig, CreateCheckoutRequest } from "@/lib/types/payment.types";

export async function POST(request: NextRequest) {
    try {
        if (!isStripeConfigured()) {
            return NextResponse.json(
                { error: "Stripe no está configurado" },
                { status: 503 }
            );
        }

        const body: CreateCheckoutRequest = await request.json();
        const {
            shopId,
            orderId,
            items,
            customerEmail,
            customerName,
            successUrl,
            cancelUrl,
            deliveryFee = 0,
        } = body;

        // Validate required fields
        if (!shopId || !orderId || !items?.length || !successUrl || !cancelUrl) {
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

        if (!payments?.enabled || !payments?.stripeAccountId) {
            return NextResponse.json(
                { error: "Pagos no están habilitados para esta tienda" },
                { status: 400 }
            );
        }

        if (!payments.stripeChargesEnabled) {
            return NextResponse.json(
                { error: "La cuenta de Stripe no está completamente configurada" },
                { status: 400 }
            );
        }

        // Build line items for Stripe
        const lineItems = items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitAmountCents: toCents(item.unitPrice),
            images: item.image ? [item.image] : [],
        }));

        // Add delivery fee as line item if present
        if (deliveryFee > 0) {
            lineItems.push({
                name: "Cargo por envío",
                description: "Delivery fee",
                quantity: 1,
                unitAmountCents: toCents(deliveryFee),
                images: [],
            });
        }

        // Add success/cancel URLs with order info
        const successUrlWithParams = `${successUrl}?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrlWithParams = `${cancelUrl}?orderId=${orderId}`;

        // Create checkout session
        const session = await createCheckoutSession({
            shopStripeAccountId: payments.stripeAccountId,
            items: lineItems,
            currency: payments.currency?.toLowerCase() || "usd",
            customerEmail,
            successUrl: successUrlWithParams,
            cancelUrl: cancelUrlWithParams,
            metadata: {
                shopId,
                orderId,
                customerName: customerName || "",
            },
            applicationFeePercent: payments.applicationFeePercent || 0,
        });

        if (!session) {
            return NextResponse.json(
                { error: "Error al crear sesión de pago" },
                { status: 500 }
            );
        }

        // Create payment record in Firestore
        const paymentRecord = {
            orderId,
            shopId,
            customerEmail,
            customerName,
            stripeCheckoutSessionId: session.id,
            amount: toCents(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) + deliveryFee),
            currency: payments.currency || "USD",
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db
            .collection("shops")
            .doc(shopId)
            .collection("payments")
            .doc(session.id)
            .set(paymentRecord);

        // Update order with payment session
        await db
            .collection("shops")
            .doc(shopId)
            .collection("orders")
            .doc(orderId)
            .update({
                paymentSessionId: session.id,
                paymentStatus: "pending",
                updatedAt: new Date().toISOString(),
            });

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

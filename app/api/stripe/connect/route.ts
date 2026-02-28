/**
 * Stripe Connect Onboarding API
 * POST /api/stripe/connect - Start onboarding for a shop
 * GET /api/stripe/connect?shopId=xxx - Get account status
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
    createConnectAccount,
    createAccountLink,
    getConnectAccount,
    isStripeConfigured,
} from "@/lib/stripe";
import type { ShopPaymentConfig } from "@/lib/types/payment.types";

/**
 * POST - Start Stripe Connect onboarding
 */
export async function POST(request: NextRequest) {
    try {
        if (!isStripeConfigured()) {
            return NextResponse.json(
                { error: "Stripe no está configurado" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { shopId, email, shopName, returnUrl, refreshUrl } = body;

        if (!shopId || !email || !returnUrl) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: shopId, email, returnUrl" },
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

        // Check if shop already has a Stripe account
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            return NextResponse.json(
                { error: "Tienda no encontrada" },
                { status: 404 }
            );
        }

        const shopData = shopDoc.data();
        let stripeAccountId = shopData?.payments?.stripeAccountId;

        // Create new Connect account if doesn't exist
        if (!stripeAccountId) {
            const account = await createConnectAccount(
                email,
                shopName || shopData?.name || "Mi Tienda",
                "US" // Default to US
            );

            if (!account) {
                return NextResponse.json(
                    { error: "Error al crear cuenta de Stripe" },
                    { status: 500 }
                );
            }

            stripeAccountId = account.id;

            // Save to Firestore
            const paymentConfig: Partial<ShopPaymentConfig> = {
                enabled: false, // Will be enabled after onboarding
                provider: "stripe",
                stripeAccountId,
                stripeAccountStatus: "pending",
                methods: ["card", "apple_pay", "google_pay"],
                currency: "USD",
                stripeOnboardingComplete: false,
                stripeDetailsSubmitted: false,
                stripeChargesEnabled: false,
                stripePayoutsEnabled: false,
            };

            await db.collection("shops").doc(shopId).update({
                payments: paymentConfig,
                updatedAt: new Date().toISOString(),
            });
        }

        // Create account link for onboarding
        const finalRefreshUrl = refreshUrl || `${returnUrl}?refresh=true`;
        const accountLink = await createAccountLink(
            stripeAccountId,
            returnUrl,
            finalRefreshUrl
        );

        if (!accountLink) {
            return NextResponse.json(
                { error: "Error al crear enlace de onboarding" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: accountLink.url,
            accountId: stripeAccountId,
        });
    } catch (error) {
        console.error("Stripe Connect error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

/**
 * GET - Get Stripe Connect account status
 */
export async function GET(request: NextRequest) {
    try {
        if (!isStripeConfigured()) {
            return NextResponse.json(
                { error: "Stripe no está configurado" },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId es requerido" },
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

        if (!payments?.stripeAccountId) {
            return NextResponse.json({
                connected: false,
                message: "No hay cuenta de Stripe conectada",
            });
        }

        // Get account details from Stripe
        const account = await getConnectAccount(payments.stripeAccountId);

        if (!account) {
            return NextResponse.json({
                connected: false,
                accountId: payments.stripeAccountId,
                message: "No se pudo obtener información de la cuenta",
            });
        }

        // Update Firestore with latest status
        const updatedPayments: Partial<ShopPaymentConfig> = {
            stripeDetailsSubmitted: account.details_submitted,
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeOnboardingComplete:
                account.details_submitted && account.charges_enabled,
            stripeAccountStatus: account.charges_enabled
                ? "active"
                : account.details_submitted
                    ? "restricted"
                    : "pending",
            // Enable payments if charges are enabled
            enabled: account.charges_enabled,
        };

        await db.collection("shops").doc(shopId).update({
            payments: { ...payments, ...updatedPayments },
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            connected: true,
            accountId: payments.stripeAccountId,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            onboardingComplete:
                account.details_submitted && account.charges_enabled,
            status: updatedPayments.stripeAccountStatus,
        });
    } catch (error) {
        console.error("Stripe Connect GET error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook - Handle Stripe events
 *
 * Events handled:
 * - checkout.session.completed - Payment successful
 * - payment_intent.payment_failed - Payment failed
 * - account.updated - Connect account status changed
 * - charge.refunded - Refund processed
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { adminDb } from "@/lib/firebase-admin";
import { constructWebhookEvent, isStripeConfigured } from "@/lib/stripe";
import type Stripe from "stripe";

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    if (!isStripeConfigured()) {
        return NextResponse.json(
            { error: "Stripe no está configurado" },
            { status: 503 }
        );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return NextResponse.json(
            { error: "Webhook secret no configurado" },
            { status: 500 }
        );
    }

    try {
        // Get raw body
        const body = await request.text();

        // Get signature from headers
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "No signature provided" },
                { status: 400 }
            );
        }

        // Verify webhook signature and construct event
        let event: Stripe.Event;
        try {
            event = constructWebhookEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database connection error" },
                { status: 500 }
            );
        }

        // Handle the event
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(db, session);
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentSucceeded(db, paymentIntent);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentFailed(db, paymentIntent);
                break;
            }

            case "account.updated": {
                const account = event.data.object as Stripe.Account;
                await handleAccountUpdated(db, account);
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object as Stripe.Charge;
                await handleChargeRefunded(db, charge);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(
    db: FirebaseFirestore.Firestore,
    session: Stripe.Checkout.Session
) {
    const { shopId, orderId } = session.metadata || {};

    if (!shopId || !orderId) {
        console.error("Missing metadata in checkout session:", session.id);
        return;
    }

    console.log(`✅ Payment completed for order ${orderId} in shop ${shopId}`);

    // Update payment record
    await db
        .collection("shops")
        .doc(shopId)
        .collection("payments")
        .doc(session.id)
        .update({
            status: "succeeded",
            stripePaymentIntentId: session.payment_intent,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

    // Update order status
    await db
        .collection("shops")
        .doc(shopId)
        .collection("orders")
        .doc(orderId)
        .update({
            paymentStatus: "paid",
            status: "confirmed", // Auto-confirm paid orders
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

    // TODO: Send confirmation notification (WhatsApp, email, etc.)
}

/**
 * Handle successful payment intent (for custom flows)
 */
async function handlePaymentSucceeded(
    db: FirebaseFirestore.Firestore,
    paymentIntent: Stripe.PaymentIntent
) {
    const { shopId, orderId } = paymentIntent.metadata || {};

    if (!shopId || !orderId) {
        console.log("Payment succeeded without order metadata:", paymentIntent.id);
        return;
    }

    console.log(`✅ PaymentIntent succeeded for order ${orderId}`);

    // Update order
    await db
        .collection("shops")
        .doc(shopId)
        .collection("orders")
        .doc(orderId)
        .update({
            paymentStatus: "paid",
            paymentIntentId: paymentIntent.id,
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
    db: FirebaseFirestore.Firestore,
    paymentIntent: Stripe.PaymentIntent
) {
    const { shopId, orderId } = paymentIntent.metadata || {};

    if (!shopId || !orderId) {
        console.log("Payment failed without order metadata:", paymentIntent.id);
        return;
    }

    console.log(`❌ Payment failed for order ${orderId}`);

    // Update order
    await db
        .collection("shops")
        .doc(shopId)
        .collection("orders")
        .doc(orderId)
        .update({
            paymentStatus: "failed",
            paymentFailureReason:
                paymentIntent.last_payment_error?.message || "Payment failed",
            updatedAt: new Date().toISOString(),
        });
}

/**
 * Handle Connect account updates
 */
async function handleAccountUpdated(
    db: FirebaseFirestore.Firestore,
    account: Stripe.Account
) {
    console.log(`🔄 Account updated: ${account.id}`);

    // Find shop with this Stripe account
    const shopsSnapshot = await db
        .collection("shops")
        .where("payments.stripeAccountId", "==", account.id)
        .get();

    if (shopsSnapshot.empty) {
        console.log("No shop found for account:", account.id);
        return;
    }

    // Update each shop (should be only one)
    for (const shopDoc of shopsSnapshot.docs) {
        const currentPayments = shopDoc.data().payments || {};

        const updatedPayments = {
            ...currentPayments,
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
            enabled: account.charges_enabled,
        };

        await shopDoc.ref.update({
            payments: updatedPayments,
            updatedAt: new Date().toISOString(),
        });

        console.log(`Updated shop ${shopDoc.id} with account status`);
    }
}

/**
 * Handle refund
 */
async function handleChargeRefunded(
    db: FirebaseFirestore.Firestore,
    charge: Stripe.Charge
) {
    console.log(`💸 Charge refunded: ${charge.id}`);

    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) return;

    // Find payments with this payment intent
    const shopsSnapshot = await db.collection("shops").get();

    for (const shopDoc of shopsSnapshot.docs) {
        const paymentsSnapshot = await shopDoc.ref
            .collection("payments")
            .where("stripePaymentIntentId", "==", paymentIntentId)
            .get();

        for (const paymentDoc of paymentsSnapshot.docs) {
            const paymentData = paymentDoc.data();

            await paymentDoc.ref.update({
                status: charge.refunded ? "refunded" : "succeeded",
                refundedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            // Update order if exists
            if (paymentData.orderId) {
                await shopDoc.ref
                    .collection("orders")
                    .doc(paymentData.orderId)
                    .update({
                        paymentStatus: "refunded",
                        refundedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
            }
        }
    }
}

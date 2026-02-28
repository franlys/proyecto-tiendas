/**
 * Stripe Server-Side Configuration
 * Uses Stripe Connect for multi-shop payments
 */

import Stripe from "stripe";

// Validate environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === "production") {
    console.warn("⚠️ STRIPE_SECRET_KEY is not set. Payments will not work.");
}

/**
 * Stripe instance for server-side operations
 * Only use this in API routes, not in client components
 */
export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: "2024-12-18.acacia" as any,
        typescript: true,
    })
    : null;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
    return !!stripe;
}

/**
 * Get Stripe publishable key for client
 */
export function getStripePublishableKey(): string | null {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}

/**
 * Create a Stripe Connect account for a shop
 */
export async function createConnectAccount(
    email: string,
    shopName: string,
    country: string = "US"
): Promise<Stripe.Account | null> {
    if (!stripe) {
        console.error("Stripe not configured");
        return null;
    }

    try {
        const account = await stripe.accounts.create({
            type: "express", // Express accounts are easiest to set up
            country,
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual",
            business_profile: {
                name: shopName,
                mcc: "5499", // Miscellaneous Food Stores
            },
        });

        return account;
    } catch (error) {
        console.error("Error creating Connect account:", error);
        throw error;
    }
}

/**
 * Create an account link for Stripe Connect onboarding
 */
export async function createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
): Promise<Stripe.AccountLink | null> {
    if (!stripe) {
        console.error("Stripe not configured");
        return null;
    }

    try {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });

        return accountLink;
    } catch (error) {
        console.error("Error creating account link:", error);
        throw error;
    }
}

/**
 * Get Connect account details
 */
export async function getConnectAccount(
    accountId: string
): Promise<Stripe.Account | null> {
    if (!stripe) return null;

    try {
        return await stripe.accounts.retrieve(accountId);
    } catch (error) {
        console.error("Error retrieving Connect account:", error);
        return null;
    }
}

/**
 * Create a Checkout Session for a shop
 * Uses Stripe Connect to route payment to the shop's account
 */
export async function createCheckoutSession(options: {
    shopStripeAccountId: string;
    items: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitAmountCents: number;
        images?: string[];
    }>;
    currency?: string;
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    applicationFeePercent?: number;
}): Promise<Stripe.Checkout.Session | null> {
    if (!stripe) {
        console.error("Stripe not configured");
        return null;
    }

    const {
        shopStripeAccountId,
        items,
        currency = "usd",
        customerEmail,
        successUrl,
        cancelUrl,
        metadata = {},
        applicationFeePercent = 0,
    } = options;

    try {
        // Build line items
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
            (item) => ({
                price_data: {
                    currency,
                    product_data: {
                        name: item.name,
                        description: item.description,
                        images: item.images?.filter(Boolean) || [],
                    },
                    unit_amount: item.unitAmountCents,
                },
                quantity: item.quantity,
            })
        );

        // Calculate total for application fee
        const totalCents = items.reduce(
            (sum, item) => sum + item.unitAmountCents * item.quantity,
            0
        );
        const applicationFeeAmount =
            applicationFeePercent > 0
                ? Math.round((totalCents * applicationFeePercent) / 100)
                : undefined;

        // Create the checkout session
        const session = await stripe.checkout.sessions.create(
            {
                mode: "payment",
                line_items: lineItems,
                customer_email: customerEmail,
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata,
                payment_intent_data: {
                    application_fee_amount: applicationFeeAmount,
                    metadata,
                },
                // Enable automatic tax if needed
                // automatic_tax: { enabled: true },
            },
            {
                stripeAccount: shopStripeAccountId, // Route to connected account
            }
        );

        return session;
    } catch (error) {
        console.error("Error creating checkout session:", error);
        throw error;
    }
}

/**
 * Create a Payment Intent (for custom checkout flow)
 */
export async function createPaymentIntent(options: {
    shopStripeAccountId: string;
    amountCents: number;
    currency?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
    applicationFeePercent?: number;
}): Promise<Stripe.PaymentIntent | null> {
    if (!stripe) {
        console.error("Stripe not configured");
        return null;
    }

    const {
        shopStripeAccountId,
        amountCents,
        currency = "usd",
        metadata = {},
        applicationFeePercent = 0,
    } = options;

    try {
        const applicationFeeAmount =
            applicationFeePercent > 0
                ? Math.round((amountCents * applicationFeePercent) / 100)
                : undefined;

        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: amountCents,
                currency,
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata,
                application_fee_amount: applicationFeeAmount,
            },
            {
                stripeAccount: shopStripeAccountId,
            }
        );

        return paymentIntent;
    } catch (error) {
        console.error("Error creating payment intent:", error);
        throw error;
    }
}

/**
 * Retrieve a Checkout Session
 */
export async function retrieveCheckoutSession(
    sessionId: string,
    stripeAccountId?: string
): Promise<Stripe.Checkout.Session | null> {
    if (!stripe) return null;

    try {
        return await stripe.checkout.sessions.retrieve(
            sessionId,
            { expand: ["payment_intent", "line_items"] },
            stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
        );
    } catch (error) {
        console.error("Error retrieving checkout session:", error);
        return null;
    }
}

/**
 * Construct webhook event from raw body
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
): Stripe.Event {
    if (!stripe) {
        throw new Error("Stripe not configured");
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Issue a refund
 */
export async function createRefund(
    paymentIntentId: string,
    amountCents?: number,
    stripeAccountId?: string
): Promise<Stripe.Refund | null> {
    if (!stripe) return null;

    try {
        return await stripe.refunds.create(
            {
                payment_intent: paymentIntentId,
                amount: amountCents, // Partial refund if specified
            },
            stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
        );
    } catch (error) {
        console.error("Error creating refund:", error);
        throw error;
    }
}

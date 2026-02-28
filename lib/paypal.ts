/**
 * PayPal Server-Side Configuration
 * Uses PayPal REST API for payments
 */

// PayPal API URLs
const PAYPAL_API_URL = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Validate environment variables
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!paypalClientId && process.env.NODE_ENV === "production") {
    console.warn("NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set. PayPal payments will not work.");
}

/**
 * Check if PayPal is configured
 */
export function isPayPalConfigured(): boolean {
    return !!(paypalClientId && paypalClientSecret);
}

/**
 * Get PayPal client ID for frontend
 */
export function getPayPalClientId(): string | null {
    return paypalClientId || null;
}

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string> {
    if (!paypalClientId || !paypalClientSecret) {
        throw new Error("PayPal credentials not configured");
    }

    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString("base64");

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("PayPal auth error:", error);
        throw new Error("Failed to get PayPal access token");
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(options: {
    items: Array<{
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
    }>;
    currency?: string;
    shopId: string;
    orderId: string;
    paypalEmail?: string; // Merchant's PayPal email for receiving payment
}): Promise<{ id: string; status: string } | null> {
    const {
        items,
        currency = "USD",
        shopId,
        orderId,
        paypalEmail,
    } = options;

    try {
        const accessToken = await getAccessToken();

        // Calculate totals
        const itemTotal = items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
        );

        // Build line items for PayPal
        const purchaseItems = items.map((item) => ({
            name: item.name.substring(0, 127), // PayPal limit
            description: item.description?.substring(0, 127),
            quantity: String(item.quantity),
            unit_amount: {
                currency_code: currency,
                value: item.unitPrice.toFixed(2),
            },
        }));

        const orderPayload: any = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: orderId,
                    description: `Orden ${orderId}`,
                    custom_id: JSON.stringify({ shopId, orderId }),
                    amount: {
                        currency_code: currency,
                        value: itemTotal.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: currency,
                                value: itemTotal.toFixed(2),
                            },
                        },
                    },
                    items: purchaseItems,
                    // If merchant email is provided, payment goes to them
                    ...(paypalEmail && {
                        payee: {
                            email_address: paypalEmail,
                        },
                    }),
                },
            ],
            application_context: {
                brand_name: "Tu Tienda",
                landing_page: "NO_PREFERENCE",
                user_action: "PAY_NOW",
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${shopId}/order-success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${shopId}/checkout`,
            },
        };

        const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("PayPal create order error:", error);
            throw new Error(error.message || "Failed to create PayPal order");
        }

        const order = await response.json();
        return {
            id: order.id,
            status: order.status,
        };
    } catch (error) {
        console.error("Error creating PayPal order:", error);
        throw error;
    }
}

/**
 * Capture a PayPal order (complete the payment)
 */
export async function capturePayPalOrder(
    orderId: string
): Promise<{
    id: string;
    status: string;
    payer?: {
        email: string;
        name: string;
    };
    captureId?: string;
} | null> {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch(
            `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("PayPal capture error:", error);
            throw new Error(error.message || "Failed to capture PayPal order");
        }

        const data = await response.json();

        // Extract capture details
        const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

        return {
            id: data.id,
            status: data.status,
            payer: data.payer
                ? {
                    email: data.payer.email_address,
                    name: `${data.payer.name?.given_name || ""} ${data.payer.name?.surname || ""}`.trim(),
                }
                : undefined,
            captureId: capture?.id,
        };
    } catch (error) {
        console.error("Error capturing PayPal order:", error);
        throw error;
    }
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId: string): Promise<any> {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch(
            `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("PayPal get order error:", error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting PayPal order:", error);
        return null;
    }
}

/**
 * Refund a PayPal capture
 */
export async function refundPayPalCapture(
    captureId: string,
    amount?: number,
    currency: string = "USD"
): Promise<{ id: string; status: string } | null> {
    try {
        const accessToken = await getAccessToken();

        const payload: any = {};
        if (amount) {
            payload.amount = {
                value: amount.toFixed(2),
                currency_code: currency,
            };
        }

        const response = await fetch(
            `${PAYPAL_API_URL}/v2/payments/captures/${captureId}/refund`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("PayPal refund error:", error);
            throw new Error(error.message || "Failed to refund PayPal capture");
        }

        const data = await response.json();
        return {
            id: data.id,
            status: data.status,
        };
    } catch (error) {
        console.error("Error refunding PayPal capture:", error);
        throw error;
    }
}

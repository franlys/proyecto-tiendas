/**
 * Payment Types for Stripe Integration
 * Supports Stripe Connect for multi-shop payments
 */

export type PaymentProvider = "stripe" | "paypal" | "none";

export type PaymentMethod = "card" | "apple_pay" | "google_pay" | "paypal" | "venmo";

/**
 * Countries supported by Stripe Connect
 * https://stripe.com/docs/connect/cross-border-payouts
 */
export type StripeCountry =
    | "US"   // United States
    | "DO"   // Dominican Republic
    | "MX"   // Mexico
    | "PR"   // Puerto Rico (US territory)
    | "BR"   // Brazil
    | "CL"   // Chile
    | "CO"   // Colombia
    | "PE"   // Peru
    | "AR"   // Argentina
    | "ES"   // Spain
    | "GB"   // United Kingdom
    | "CA";  // Canada

export const STRIPE_COUNTRY_LABELS: Record<StripeCountry, string> = {
    DO: "🇩🇴 República Dominicana",
    US: "🇺🇸 Estados Unidos",
    MX: "🇲🇽 México",
    PR: "🇵🇷 Puerto Rico",
    BR: "🇧🇷 Brasil",
    CL: "🇨🇱 Chile",
    CO: "🇨🇴 Colombia",
    PE: "🇵🇪 Perú",
    AR: "🇦🇷 Argentina",
    ES: "🇪🇸 España",
    GB: "🇬🇧 Reino Unido",
    CA: "🇨🇦 Canadá",
};

/**
 * Default currency for each country
 */
export const STRIPE_COUNTRY_DEFAULT_CURRENCY: Record<StripeCountry, Currency> = {
    DO: "DOP",
    US: "USD",
    MX: "MXN",
    PR: "USD",
    BR: "USD", // BRL not in our Currency type yet
    CL: "USD",
    CO: "USD",
    PE: "USD",
    AR: "USD",
    ES: "USD", // EUR not in our Currency type yet
    GB: "USD", // GBP not in our Currency type yet
    CA: "USD", // CAD not in our Currency type yet
};

export type PaymentStatus =
    | "pending"      // Payment not yet initiated
    | "processing"   // Payment being processed
    | "succeeded"    // Payment successful
    | "failed"       // Payment failed
    | "cancelled"    // Payment cancelled
    | "refunded";    // Payment refunded

export type Currency = "USD" | "MXN" | "DOP";

/**
 * Shop Payment Configuration
 * Stored in shops/{shopId}
 */
export interface ShopPaymentConfig {
    enabled: boolean;
    provider: PaymentProvider;
    // Stripe Connect fields
    stripeAccountId?: string;          // Connected Stripe account ID (acct_xxx)
    stripeAccountStatus?: "pending" | "active" | "restricted";
    stripeCountry?: StripeCountry;     // Country for the Stripe Connect account
    stripeOnboardingComplete?: boolean;
    stripeDetailsSubmitted?: boolean;
    stripeChargesEnabled?: boolean;
    stripePayoutsEnabled?: boolean;
    // PayPal fields
    paypalMerchantId?: string;         // PayPal merchant ID
    paypalEmail?: string;              // PayPal email for receiving payments
    paypalOnboardingComplete?: boolean;
    // Common fields
    methods: PaymentMethod[];
    currency: Currency;
    // Settings
    requirePaymentBeforeOrder?: boolean; // If false, allows "pay later" / cash on delivery
    applicationFeePercent?: number;       // Platform fee (optional)
}

/**
 * Default payment config for new shops
 */
export const DEFAULT_PAYMENT_CONFIG: ShopPaymentConfig = {
    enabled: false,
    provider: "none",
    methods: [],
    currency: "USD",
    requirePaymentBeforeOrder: false,
};

/**
 * Payment Record
 * Stored in shops/{shopId}/payments/{paymentId}
 */
export interface PaymentRecord {
    id: string;
    orderId: string;
    shopId: string;
    customerId?: string;
    customerEmail?: string;
    customerName?: string;

    // Stripe IDs
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    stripeCheckoutSessionId?: string;

    // Amounts (in cents)
    amount: number;
    currency: Currency;
    applicationFee?: number;

    // Status
    status: PaymentStatus;
    failureReason?: string;

    // Payment method details
    paymentMethod?: PaymentMethod;
    cardBrand?: string;      // visa, mastercard, amex
    cardLast4?: string;      // Last 4 digits

    // Timestamps
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    refundedAt?: string;
}

/**
 * Checkout Session Request
 * Used when creating a Stripe Checkout session
 */
export interface CreateCheckoutRequest {
    shopId: string;
    orderId: string;
    items: CheckoutItem[];
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    successUrl: string;
    cancelUrl: string;
    // Optional metadata
    deliveryType?: "pickup" | "delivery";
    deliveryFee?: number;
    notes?: string;
}

export interface CheckoutItem {
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;      // In dollars (will be converted to cents)
    image?: string;
}

/**
 * Checkout Session Response
 */
export interface CheckoutSessionResponse {
    sessionId: string;
    url: string;            // Redirect URL to Stripe Checkout
}

/**
 * Stripe Connect Onboarding Request
 */
export interface ConnectOnboardingRequest {
    shopId: string;
    returnUrl: string;      // URL to return after onboarding
    refreshUrl: string;     // URL if onboarding needs refresh
}

/**
 * Stripe Connect Onboarding Response
 */
export interface ConnectOnboardingResponse {
    url: string;            // Stripe Connect onboarding URL
    accountId: string;      // New or existing account ID
}

/**
 * Webhook Event Types we handle
 */
export type StripeWebhookEventType =
    | "checkout.session.completed"
    | "payment_intent.succeeded"
    | "payment_intent.payment_failed"
    | "account.updated"
    | "charge.refunded";

/**
 * Currency formatting helpers
 */
export const CURRENCY_CONFIG: Record<Currency, { symbol: string; decimals: number; locale: string }> = {
    USD: { symbol: "$", decimals: 2, locale: "en-US" },
    MXN: { symbol: "$", decimals: 2, locale: "es-MX" },
    DOP: { symbol: "RD$", decimals: 2, locale: "es-DO" },
};

export function formatCurrency(amount: number, currency: Currency = "USD"): string {
    const config = CURRENCY_CONFIG[currency];
    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency,
        minimumFractionDigits: config.decimals,
    }).format(amount);
}

/**
 * Convert dollars to cents (for Stripe)
 */
export function toCents(dollars: number): number {
    return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function toDollars(cents: number): number {
    return cents / 100;
}

/**
 * Payment method display labels
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    card: "Tarjeta de Crédito/Débito",
    apple_pay: "Apple Pay",
    google_pay: "Google Pay",
    paypal: "PayPal",
    venmo: "Venmo",
};

/**
 * Payment status display labels (Spanish)
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    succeeded: "Pagado",
    failed: "Fallido",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
};

/**
 * Payment status colors for UI
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    processing: "bg-blue-500/20 text-blue-400",
    succeeded: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    cancelled: "bg-zinc-500/20 text-zinc-400",
    refunded: "bg-purple-500/20 text-purple-400",
};

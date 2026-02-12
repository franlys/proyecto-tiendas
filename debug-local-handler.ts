
import * as fs from 'fs';
import * as path from 'path';

// 1. INJECT ENV VARS BEFORE IMPORTS
try {
    const credsPath = path.join(__dirname, './firebase-credentials.json');
    const serviceAccount = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify(serviceAccount);
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = serviceAccount.project_id;
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL = serviceAccount.client_email;
    process.env.FIREBASE_ADMIN_PRIVATE_KEY = serviceAccount.private_key;

    console.log("✅ Environment injected from firebase-credentials.json");
} catch (e) {
    console.error("❌ Failed to load credentials:", e);
    process.exit(1);
}

// 2. IMPORTS (Relative from Root)
import { adminDb } from "./lib/firebase-admin";
import { getWhatsAppConfigWithDefaults, getShopBasicInfo } from "./lib/services/whatsapp-config.service";
import { createCustomer, getCustomerByPhone } from "./lib/services/customer.service";
import { detectMessageIntent } from "./lib/services/conversation-context.service";
import { formatPhoneForWhatsApp } from "./lib/utils";

// MOCK Evolution
const sendTextMessage = async (instance: string, phone: string, text: string) => {
    console.log(`[MOCK SEND] To: ${phone} | Msg: ${text}`);
};

const APP_URL = "https://linko-app-pied.vercel.app";

async function handleNewMessage(instance: string, data: any) {
    console.log(`\n--- START VALIDATION for ${instance} ---`);
    const { key, message, pushName } = data;

    // 1. Resolve Shop ID
    let shopSlug = instance.replace("shop_", "");
    if (shopSlug.endsWith("_v2")) {
        shopSlug = shopSlug.slice(0, -3);
    }
    shopSlug = shopSlug.replace(/_/g, "-");

    let shopId = shopSlug;
    console.log(`Calculated Slug: ${shopSlug}`);

    try {
        // We use the service directly
        const shopInfo = await getShopBasicInfo(shopSlug);
        if (shopInfo) {
            shopId = shopInfo.id;
            console.log(`✅ Resolved Shop ID: ${shopId}`);
        } else {
            console.log(`⚠️ Shop not found by slug. Using slug as ID: ${shopId}`);
        }
    } catch (e) {
        console.error("Error resolving shop ID:", e);
    }

    // 2. Format Phone
    const rawPhone = key.remoteJid.split("@")[0];
    const phone = formatPhoneForWhatsApp(rawPhone);
    console.log(`Phone: ${phone} (Raw: ${rawPhone})`);

    const text = message.conversation || "";
    console.log(`Text: "${text}"`);

    // 4. Customer Management
    try {
        const customer = await getCustomerByPhone(shopId, phone);
        if (!customer) {
            console.log("New customer detected! Creating...");
            await createCustomer(shopId, {
                phone,
                name: pushName || "Test User",
                registrationState: "completed",
                source: "whatsapp"
            });
            console.log("Customer created.");
        } else {
            console.log(`Customer exists: ${customer.id}`);
        }
    } catch (e) {
        console.error("Error in customer management:", e);
        // Continue anyway
    }

    // 5. Config Loading
    console.log("Loading Config...");
    let config;
    try {
        const configResult = await getWhatsAppConfigWithDefaults(shopId);
        config = configResult.config;
        console.log(`Config Loaded. Enabled: ${config.enabled}`);
        console.log(`BusinessHours: ${config.businessHoursEnabled}`);
        console.log(`Welcome Msg: ${config.welcomeMessage.substring(0, 20)}...`);
    } catch (e) {
        console.error("Error loading config:", e);
        return;
    }

    // 6. Check Enabled
    if (!config.enabled) {
        console.log("Auto-reply DISABLED in config.");
        return;
    }

    // 7. Intent
    const { intent, confidence } = detectMessageIntent(text);
    console.log(`Intent: ${intent} (${confidence})`);

    // 8. Generate Response
    let responseMessage = "";
    if (intent === "catalog") {
        responseMessage = `CATALOG LINK: ${APP_URL}/${shopId}`;
    } else {
        // Generic
        const options: string[] = [];
        if (config.showCatalogOption) options.push(config.catalogOptionText);
        if (config.showBookingOption) options.push(config.bookingOptionText);
        if (config.showQuestionOption) options.push(config.questionOptionText);

        const optionsText = options.length > 0 ? `\n\n${options.join("\n")}` : "";
        responseMessage = `¡Hola! ${config.welcomeMessage}${optionsText}`;
    }

    // 9. Send
    await sendTextMessage(instance, phone, responseMessage);
}

// RUN TEST
// Use a RANDOM phone to simulate new user
const randomPhone = "1809" + Math.floor(Math.random() * 10000000).toString();

const testPayload = {
    key: { remoteJid: `${randomPhone}@s.whatsapp.net`, fromMe: false },
    pushName: "Random Tester Root",
    message: { conversation: "Hola" }
};

handleNewMessage("shop_surprise_gifts_v2", testPayload)
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });

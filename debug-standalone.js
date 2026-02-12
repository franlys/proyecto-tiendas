
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. INITIALIZE FIREBASE
const logFile = path.join(__dirname, 'debug_output.txt');
fs.writeFileSync(logFile, "--- START ---\n");

function log(msg) {
    const line = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
    console.log(line);
    fs.appendFileSync(logFile, line + "\n");
}

try {
    const credsPath = path.join(__dirname, 'firebase-credentials.json');
    const serviceAccount = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

    // Initialize with specific credentials
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        log("✅ Firebase Initialized");
    }
} catch (e) {
    log("❌ Failed to load credentials:" + e);
    process.exit(1);
}

const db = admin.firestore();

// 2. MOCK HELPERS & LOGIC

function formatPhoneForWhatsApp(phone) {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("8")) {
        clean = "1" + clean;
    }
    return clean;
}

function detectMessageIntent(text) {
    const lowerText = (text || "").toLowerCase().trim();
    if (["catalogo", "catálogo", "menu"].some(kw => lowerText.includes(kw))) return { intent: "catalog", confidence: 0.9 };
    if (["hola", "buenos"].some(kw => lowerText.startsWith(kw))) return { intent: "greeting", confidence: 0.8 };
    return { intent: "unknown", confidence: 0.3 };
}

// 3. SERVICE LOGIC (Inlined)

async function getShopBasicInfo(slugOrId) {
    console.log(`[ShopInfo] Searching for: ${slugOrId}`);

    // Try by ID first
    const docRef = db.collection("shops").doc(slugOrId);
    const doc = await docRef.get();

    if (doc.exists) {
        console.log(`[ShopInfo] Found by ID: ${doc.id}`);
        const data = doc.data();
        return { id: doc.id, slug: data.slug || doc.id, name: data.name, businessType: data.businessType };
    }

    // Try by Slug
    console.log(`[ShopInfo] Searching by Slug...`);
    const q = await db.collection("shops").where("slug", "==", slugOrId).limit(1).get();

    if (!q.empty) {
        const d = q.docs[0];
        console.log(`[ShopInfo] Found by Slug: ${d.id}`);
        const data = d.data();
        return { id: d.id, slug: data.slug || d.id, name: data.name, businessType: data.businessType };
    }

    return null;
}

async function getCustomerByPhone(shopId, phone) {
    const formatted = formatPhoneForWhatsApp(phone);
    console.log(`[Customer] Searching ${formatted} in shops/${shopId}/customers`);

    const snap = await db.collection(`shops/${shopId}/customers`)
        .where("phone", "==", formatted)
        .limit(1)
        .get();

    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function createCustomer(shopId, data) {
    console.log(`[Customer] Creating new customer for ${shopId}`);
    const formatted = formatPhoneForWhatsApp(data.phone);
    const ref = db.collection(`shops/${shopId}/customers`).doc();
    const now = new Date().toISOString();

    const newC = {
        ...data,
        id: ref.id,
        phone: formatted,
        createdAt: now,
        updatedAt: now
    };

    await ref.set(newC);
    console.log(`[Customer] Created: ${ref.id}`);
    return newC;
}

async function getWhatsAppConfig(shopId) {
    console.log(`[Config] Loading for ${shopId}`);

    // Config path: shops/{shopId}/whatsapp_bot/config
    const doc = await db.collection("shops").doc(shopId).collection("whatsapp_bot").doc("config").get();

    const defaults = {
        enabled: true,
        welcomeMessage: "DEFAULT WELCOME",
        showCatalogOption: true,
        catalogOptionText: "VER CATALOGO",
        businessHoursEnabled: false
    };

    if (doc.exists) {
        console.log("[Config] Found custom config");
        return { ...defaults, ...doc.data() };
    }

    console.log("[Config] Using Defaults");
    return defaults;
}

// 4. HANDLER LOGIC

async function handleNewMessage(instance, data) {
    console.log("\n==================================");
    console.log(`HANDLING MESSAGE from ${instance}`);

    // Resolve ID
    let shopSlug = instance.replace("shop_", "").replace("_v2", "").replace(/_/g, "-");
    let shopId = shopSlug; // fallback

    const shopInfo = await getShopBasicInfo(shopSlug);
    if (shopInfo) {
        shopId = shopInfo.id;
        console.log(`RESOLVED ID: ${shopId}`);
    } else {
        console.log(`SHOP NOT FOUND for ${shopSlug}`);
    }

    const rawPhone = data.key.remoteJid.split("@")[0];
    const phone = formatPhoneForWhatsApp(rawPhone);
    const text = data.message.conversation || "";

    // Customer Check
    try {
        const customer = await getCustomerByPhone(shopId, phone);
        if (!customer) {
            console.log(`New Customer! ${pushName}`);
            await createCustomer(shopId, {
                phone,
                name: data.pushName,
                source: "whatsapp"
            });
        } else {
            console.log(`Existing Customer: ${customer.id} (${customer.name})`);
        }
    } catch (e) {
        console.error("Customer Error:", e);
    }

    // Auto Reply
    try {
        const config = await getWhatsAppConfig(shopId);
        if (!config.enabled) {
            console.log("BOT DISABLED");
            return;
        }

        const { intent } = detectMessageIntent(text);
        console.log(`INTENT: ${intent}`);

        let reply = "";
        if (intent === "catalog") {
            reply = "CATALOG LINK";
        } else {
            reply = config.welcomeMessage;
        }

        console.log(`>>> SENDING REPLY: ${reply}`);

    } catch (e) {
        console.error("Config/Reply Error:", e);
    }
}

// 5. RUN
(async () => {
    try {
        const randomPhone = "1809" + Math.floor(Math.random() * 10000000);
        console.log(`Testing with Phone: ${randomPhone}`);

        await handleNewMessage("shop_surprise_gifts_v2", {
            key: { remoteJid: `${randomPhone}@s.whatsapp.net` },
            pushName: "Standalone Tester",
            message: { conversation: "Hola" }
        });

        console.log("✅ TEST COMPLETED");
        process.exit(0);
    } catch (e) {
        console.error("❌ TEST FAILED:", e);
        process.exit(1);
    }
})();

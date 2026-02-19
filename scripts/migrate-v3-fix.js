
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const WEBHOOK_BASE_URL = "https://linko-app-pied.vercel.app"; // Hardcoded for production

const SHOP_SLUG = "surprise-gifts";
// The instance we want to DELETE (the old one stuck in v1 or v2)
const OLD_INSTANCE = "shop_surprise_gifts";
// The instance we want to CREATE (clean session)
const NEW_INSTANCE = "shop_surprise_gifts_v3";

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
        console.error("❌ Missing .env.local configuration");
        return;
    }

    console.log(`🚀 Starting migration for ${SHOP_SLUG}...`);
    console.log(`   Old Instance: ${OLD_INSTANCE}`);
    console.log(`   New Instance: ${NEW_INSTANCE}`);

    try {
        // 1. Check current instances
        console.log("\n1️⃣ Checking active instances...");
        const instances = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        const instanceList = Array.isArray(instances.data) ? instances.data : [];
        const oldExists = instanceList.find(i => i.instance.instanceName === OLD_INSTANCE);
        const newExists = instanceList.find(i => i.instance.instanceName === NEW_INSTANCE);

        // 2. Delete OLD instance if exists
        if (oldExists) {
            console.log(`\n🗑️ Deleting OLD instance: ${OLD_INSTANCE}...`);
            try {
                await axios.delete(`${EVOLUTION_URL}/instance/delete/${OLD_INSTANCE}`, {
                    headers: { apikey: EVOLUTION_KEY }
                });
                console.log("   ✅ Old instance deleted.");
            } catch (e) {
                console.error("   ⚠️ Failed to delete old instance (might be already gone):", e.response?.data || e.message);
            }
        } else {
            console.log("   ℹ️ Old instance not found (good).");
        }

        // 3. Create NEW instance if not exists
        if (!newExists) {
            console.log(`\n✨ Creating NEW instance: ${NEW_INSTANCE}...`);
            await axios.post(`${EVOLUTION_URL}/instance/create`, {
                instanceName: NEW_INSTANCE,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            }, {
                headers: { apikey: EVOLUTION_KEY }
            });
            console.log("   ✅ New instance created.");
        } else {
            console.log("   ℹ️ New instance already exists.");
            // Optional: Logout to ensure clean slate? 
            // await axios.delete(`${EVOLUTION_URL}/instance/logout/${NEW_INSTANCE}`, { headers: { apikey: EVOLUTION_KEY } });
        }

        // Wait a bit for creation
        await delay(2000);

        // 4. Set Webhook for NEW instance
        console.log(`\n🔗 Configuring Webhook for ${NEW_INSTANCE}...`);
        const webhookUrl = `${WEBHOOK_BASE_URL}/api/whatsapp/webhook/shop_${SHOP_SLUG}`; // Matches logic in route.ts
        console.log(`   URL: ${webhookUrl}`);

        await axios.post(`${EVOLUTION_URL}/webhook/set/${NEW_INSTANCE}`, {
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: true,
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
        }, {
            headers: { apikey: EVOLUTION_KEY }
        });
        console.log("   ✅ Webhook configured.");

        // 5. Fetch QR Code
        console.log(`\n📷 Fetching QR Code for ${NEW_INSTANCE}...`);
        const qr = await axios.get(`${EVOLUTION_URL}/instance/connect/${NEW_INSTANCE}`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        if (qr.data && qr.data.base64) {
            console.log("\n✅ MIGRATION SUCCESS! New QR Code generated.");
            console.log("👉 Go to the App admin panel to scan the code, OR use the base64 below if needed.");
            // console.log(qr.data.base64); // Too long to log mostly
        } else {
            console.log("⚠️ Instance created but no QR returned (might be already connected?). Check App.");
        }

    } catch (error) {
        console.error("\n❌ MIGRATION FAILED:", error.response?.data || error.message);
    }
}

main();

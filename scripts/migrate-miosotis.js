
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const WEBHOOK_BASE_URL = "https://linko-app-pied.vercel.app";

// Shop Slug for Miosotis
const SHOP_SLUG = "miosotis-nails";

// Instances to cleanup
const INSTANCES_TO_DELETE = [
    "shop_miosotis_nails",     // v1
    "shop_miosotis_nails_v2",  // v2 (The one causing 401s)
    "shop_miosotis_nails_v3"   // v3 (The one with ENOENT error)
];

// Target New Instance
const NEW_INSTANCE = "shop_miosotis_nails_v3";

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
        console.error("❌ Missing .env.local configuration");
        return;
    }

    console.log(`🚀 Starting migration/reset for ${SHOP_SLUG}...`);

    try {
        // 1. Delete ALL old/current instances for this shop
        for (const instance of INSTANCES_TO_DELETE) {
            console.log(`\n🛑 Attempting to LOGOUT: ${instance}...`);
            try {
                await axios.delete(`${EVOLUTION_URL}/instance/logout/${instance}`, {
                    headers: { apikey: EVOLUTION_KEY }
                });
                console.log(`   ✅ Logged out ${instance}`);
            } catch (e) {
                console.log(`   ℹ️ Could not logout ${instance} (maybe already logged out)`);
            }

            await delay(1000);

            console.log(`\n🗑️ Attempting to DELETE: ${instance}...`);
            try {
                await axios.delete(`${EVOLUTION_URL}/instance/delete/${instance}`, {
                    headers: { apikey: EVOLUTION_KEY }
                });
                console.log(`   ✅ Deleted ${instance}`);
            } catch (e) {
                console.log(`   ℹ️ Could not delete ${instance} (maybe didn't exist)`);
            }
        }

        await delay(2000);

        // 2. Create FRESH Instance
        console.log(`\n✨ Creating FRESH instance: ${NEW_INSTANCE}...`);
        await axios.post(`${EVOLUTION_URL}/instance/create`, {
            instanceName: NEW_INSTANCE,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        }, {
            headers: { apikey: EVOLUTION_KEY }
        });
        console.log("   ✅ New instance created.");

        await delay(2000);

        // 3. Configure Webhook
        console.log(`\n🔗 Configuring Webhook for ${NEW_INSTANCE}...`);
        // Note: The slug passed in URL should be the clean slug "miosotis-nails" 
        // Logic in route.ts: instance.replace("shop_", "").replace(/_v\d+$/, "").replace(/_/g, "-")
        // shop_miosotis_nails_v3 -> miosotis_nails -> miosotis-nails. CORRECT.

        const webhookUrl = `${WEBHOOK_BASE_URL}/api/whatsapp/webhook/shop_${SHOP_SLUG.replace(/-/g, '_')}`;
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

        // 4. Fetch QR
        console.log(`\n📷 Fetching QR Code...`);
        const qr = await axios.get(`${EVOLUTION_URL}/instance/connect/${NEW_INSTANCE}`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        if (qr.data && qr.data.base64) {
            console.log("\n✅ RESET COMPLETE! New QR Code generated.");
            console.log("👉 Please scan the NEW code from the App.");
        }

    } catch (error) {
        console.error("\n❌ MIGRATION FAILED:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

main();

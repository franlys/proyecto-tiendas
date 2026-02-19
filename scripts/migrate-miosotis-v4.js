
const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
// HARDCODED CORRECT BASE URL
const WEBHOOK_BASE_URL = "https://linko-app-pied.vercel.app";

const SHOP_SLUG = "miosotis-nails";
const INSTANCES_TO_DELETE = [
    "shop_miosotis_nails_v2",
    "shop_miosotis_nails_v3"
];

const NEW_INSTANCE = "shop_miosotis_nails_v4";

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log(`🚀 STARTING NUCLEAR MIGRATION TO ${NEW_INSTANCE}...`);

    try {
        // 1. CLEANUP
        for (const oldInstance of INSTANCES_TO_DELETE) {
            console.log(`\n☠️ Killing ${oldInstance}...`);
            try {
                await axios.delete(`${EVOLUTION_URL}/instance/logout/${oldInstance}`, { headers: { apikey: EVOLUTION_KEY } });
                console.log("   ✅ Logged out.");
            } catch (e) { console.log("   ℹ️ Logout failed/skipped."); }

            await delay(1000);

            try {
                await axios.delete(`${EVOLUTION_URL}/instance/delete/${oldInstance}`, { headers: { apikey: EVOLUTION_KEY } });
                console.log("   ✅ Deleted.");
            } catch (e) { console.log("   ℹ️ Delete failed/skipped."); }
        }

        console.log("\n⏳ Waiting 5 seconds for server clean up...");
        await delay(5000);

        // 2. CREATE V4
        console.log(`\n✨ Creating FRESH instance: ${NEW_INSTANCE}...`);
        await axios.post(`${EVOLUTION_URL}/instance/create`, {
            instanceName: NEW_INSTANCE,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        }, { headers: { apikey: EVOLUTION_KEY } });
        console.log("   ✅ Instance Created.");

        await delay(2000);

        // 3. WEBHOOK (CORRECTED)
        const webhookUrl = `${WEBHOOK_BASE_URL}/api/whatsapp/webhook/${NEW_INSTANCE}`;
        console.log(`\n🔗 Setting Webhook to: ${webhookUrl}`);

        await axios.post(`${EVOLUTION_URL}/webhook/set/${NEW_INSTANCE}`, {
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: true,
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
            enabled: true
        }, { headers: { apikey: EVOLUTION_KEY } });
        console.log("   ✅ Webhook Set.");

        // 4. QR CODE
        await delay(1000);
        console.log(`\n📷 Fetching QR...`);
        const qr = await axios.get(`${EVOLUTION_URL}/instance/connect/${NEW_INSTANCE}`, { headers: { apikey: EVOLUTION_KEY } });

        if (qr.data?.base64) {
            console.log("\n✅ SUCCESS! New QR Code is ready.");
            console.log("👉 GO TO ADMIN PANEL AND SCAN.");
        } else {
            console.log("⚠️ No QR returned. Check admin panel.");
        }

    } catch (e) {
        console.error("\n❌ MIGRATION FAILED:", e.response?.data || e.message);
    }
}

main();

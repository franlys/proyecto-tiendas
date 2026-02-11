const axios = require("axios");
require("dotenv").config({ path: ".env.local" });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "https://api.whatsapp.franciscook.com";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "429683C4C977-4987-A6E5-94675D726604";

const shopSlug = "surprise-gifts";
const oldInstance = `shop_${shopSlug.replace(/-/g, "_")}`;
const newInstance = `shop_${shopSlug.replace(/-/g, "_")}_v2`;
const webhookUrl = "https://linko-app-pied.vercel.app/api/whatsapp/webhook";

console.log(`🔧 Fixing Webhook for: ${newInstance}`);
console.log(`   URL: ${EVOLUTION_URL}`);

async function run() {
    try {
        // 1. Delete Old Instance
        try {
            console.log(`🗑️ Deleting old instance: ${oldInstance}...`);
            await axios.delete(`${EVOLUTION_URL}/instance/delete/${oldInstance}`, {
                headers: { apikey: EVOLUTION_KEY }
            });
            console.log("   ✅ Deleted.");
        } catch (e) {
            console.log("   ⚠️ Could not delete old (maybe already gone).");
        }

        // 2. Check New Instance
        let exists = false;
        try {
            await axios.get(`${EVOLUTION_URL}/instance/connectionState/${newInstance}`, {
                headers: { apikey: EVOLUTION_KEY }
            });
            exists = true;
            console.log(`✅ New instance ${newInstance} exists.`);
        } catch (e) {
            console.log(`ℹ️ New instance ${newInstance} not found. Creating...`);
            await axios.post(`${EVOLUTION_URL}/instance/create`, {
                instanceName: newInstance,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            }, { headers: { apikey: EVOLUTION_KEY } });
            console.log("   ✅ Created.");
        }

        // 3. Set Webhook
        console.log(`🔗 Setting Webhook to: ${webhookUrl}`);
        const res = await axios.post(`${EVOLUTION_URL}/webhook/set/${newInstance}`, {
            url: webhookUrl,
            webhook_by_events: true,
            webhook_base64: true,
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
        }, { headers: { apikey: EVOLUTION_KEY } });

        console.log("   ✅ Webhook Set Response:", JSON.stringify(res.data));

    } catch (error) {
        console.error("❌ Linko Fatal Error:", error.response?.data || error.message);
    }
}

run();

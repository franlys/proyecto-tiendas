
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = "shop_miosotis_nails_v3";

// HARDCODED CORRECT URL
const WEBHOOK_URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook/shop_miosotis_nails_v3";

async function updateWebhook() {
    try {
        console.log(`🔗 Updating Webhook for ${INSTANCE}...`);
        console.log(`   Target URL: ${WEBHOOK_URL}`);

        const response = await axios.post(`${EVOLUTION_URL}/webhook/set/${INSTANCE}`, {
            url: WEBHOOK_URL,
            webhook_by_events: false,
            webhook_base64: true,
            events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
        }, {
            headers: { apikey: EVOLUTION_KEY }
        });

        console.log("✅ Webhook Updated Successfully.");
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error("❌ Error updating webhook:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

updateWebhook();

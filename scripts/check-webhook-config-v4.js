
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = "shop_miosotis_nails_v4";

async function checkWebhook() {
    try {
        console.log(`🔍 Checking Webhook Config for ${INSTANCE}...`);

        const response = await axios.get(`${EVOLUTION_URL}/webhook/find/${INSTANCE}`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        console.log("✅ Webhook Config response:");
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error("❌ Error fetching webhook config:", error.message);
    }
}

checkWebhook();

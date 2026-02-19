
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = "shop_miosotis_nails_v3";

async function checkQR() {
    try {
        console.log(`Checking QR for ${INSTANCE}...`);
        const response = await axios.get(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        if (response.data && response.data.base64) {
            console.log("✅ QR Code is responding/exists.");
            // console.log(response.data.base64.substring(0, 50) + "..."); 
        } else {
            console.log("⚠️ No QR code in response (Instance might be connected or broken).");
            console.log(JSON.stringify(response.data, null, 2));
        }
    } catch (error) {
        console.error("❌ Error fetching QR:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

checkQR();

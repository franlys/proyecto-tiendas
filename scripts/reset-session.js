
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

const INSTANCE = "shop_miosotis_nails_v2";
const API_URL = process.env.EVOLUTION_API_URL || "https://evolution-api-production-0fa7.up.railway.app";
const API_KEY = process.env.EVOLUTION_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: EVOLUTION_API_KEY is missing in .env");
    process.exit(1);
}

async function resetSession() {
    console.log(`🗑️ LOGGING OUT session for: ${INSTANCE}`);
    try {
        await axios.delete(`${API_URL}/instance/logout/${INSTANCE}`, {
            headers: { apikey: API_KEY }
        });
        console.log("✅ Logout command sent.");
    } catch (e) {
        console.log(`⚠️ Logout warning (might be already closed): ${e.message}`);
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));

    console.log(`♻️ DELETING instance (to force fresh QR)...`);
    try {
        await axios.delete(`${API_URL}/instance/delete/${INSTANCE}`, {
            headers: { apikey: API_KEY }
        });
        console.log("✅ Instance deleted.");
    } catch (e) {
        console.log(`⚠️ Delete warning: ${e.message}`);
    }

    console.log(`\n✨ Done! Now go to your app dashboard and 'Conectar WhatsApp' to scan a NEW QR code.`);
    console.log(`   This will generate new encryption keys and fix the 'Bad MAC' errors.`);
}

resetSession();


const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local if present
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (e) {
    console.log('No .env.local found or error loading it');
}

const API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-0fa7.up.railway.app';
const API_KEY = process.env.EVOLUTION_API_KEY;
const PROD_WEBHOOK = "https://linko-app-pied.vercel.app/api/whatsapp/webhook";

// Instances seen in logs
const TARGET_INSTANCES = [
    "shop_surprise_gifts_v2",
    "shop_miosotis_nails_v2"
];

async function fixWebhook(instanceName) {
    console.log(`\n🔧 Fixing webhook for: ${instanceName}...`);

    if (!API_KEY) {
        console.error("❌ ERROR: EVOLUTION_API_KEY not found in environment.");
        return;
    }

    try {
        const url = `${API_URL}/webhook/set/${instanceName}`;
        console.log(`   Calling: ${url}`);

        // Disable webhook_by_events to avoid subpath issues (just in case)
        // AND set the correct URL
        const payload = {
            "webhookUrl": PROD_WEBHOOK,
            "webhookByEvents": false,
            "events": [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED"
            ],
            "enabled": true
        };

        const response = await axios.post(url, payload, {
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ SUCCESS: Webhook updated to ${PROD_WEBHOOK}`);
        console.log(`   Response:`, response.data);

    } catch (error) {
        console.error(`❌ FAILED for ${instanceName}:`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   Error: ${error.message}`);
        }
    }
}

async function main() {
    console.log("🚀 STARTING WEBHOOK FIX (Force Production URL)");
    console.log("-----------------------------------------------");
    console.log(`Target URL: ${PROD_WEBHOOK}`);

    for (const instance of TARGET_INSTANCES) {
        await fixWebhook(instance);
    }
}

main();

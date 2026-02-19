
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

// Instances to target if they exist (even if not in list, we try to delete)
const ZOMBIES = [
    "shop_miosotis_nails_v1",
    "shop_miosotis_nails_v2",
    "shop_miosotis_nails_v3"
];

async function killZombies() {
    console.log("🧟 Starting Zombie Hunt...");

    // 1. Try to fetch all to see what's visible
    try {
        const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
            headers: { apikey: EVOLUTION_KEY }
        });

        const instances = Array.isArray(response.data) ? response.data : [];
        console.log(`📋 Visible instances: ${instances.map(i => i.instance.instanceName).join(", ")}`);
    } catch (e) {
        console.error("⚠️ Could not fetch instances list (ignoring)");
    }

    // 2. Blindly fire delete commands at known zombies
    for (const zombie of ZOMBIES) {
        try {
            console.log(`🔫 Shooting at ${zombie}...`);
            await axios.delete(`${EVOLUTION_URL}/instance/delete/${zombie}`, {
                headers: { apikey: EVOLUTION_KEY }
            });
            console.log(`✅ Deleted ${zombie} (or it was already dead)`);
        } catch (error) {
            // 404 means it's already gone, which is good
            if (error.response && error.response.status === 404) {
                console.log(`💀 ${zombie} is already dead (404).`);
            } else {
                console.log(`⚠️ Failed to delete ${zombie}: ${error.message}`);
            }
        }
    }

    console.log("🏁 Zombie Hunt Complete.");
}

killZombies();

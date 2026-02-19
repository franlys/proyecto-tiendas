
const axios = require('axios');

const URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook";

const payload = {
    "event": "MESSAGES_UPSERT",
    "instance": "shop_miosotis_nails_v2",
    "data": {
        "key": {
            "remoteJid": "18294617939@s.whatsapp.net",
            "fromMe": false,
            "id": "PING_TEST_ID_FINAL"
        },
        "pushName": "Test Ping User",
        "message": {
            "conversation": "PING"
        },
        "messageTimestamp": Date.now() / 1000,
        "status": "PENDING"
    }
};

async function testPing() {
    console.log(`🚀 Sending PING to: ${URL} for 18294617939`);
    try {
        const start = Date.now();
        const response = await axios.post(URL, payload);
        const duration = Date.now() - start;

        console.log(`✅ Status: ${response.status} ${response.statusText} (${duration}ms)`);
        console.log(`📄 Response Data:`, JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPing();

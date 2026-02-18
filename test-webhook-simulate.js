const axios = require("axios");

const URL = process.env.APP_URL || "https://linko-app-pied.vercel.app/api/whatsapp/webhook";
const payload = {
    event: "MESSAGES_UPSERT",
    instance: "shop_surprise_gifts_v2",
    data: {
        key: {
            remoteJid: "18092328741@s.whatsapp.net",
            fromMe: false,
            id: "TEST_ID_12345"
        },
        pushName: "Simulated Tester",
        message: {
            conversation: "PING"
        },
        messageTimestamp: Date.now() / 1000,
        status: "PENDING"
    }
};

const fs = require('fs');

async function testWebhook() {
    const logData = [];
    const log = (msg) => { console.log(msg); logData.push(msg); };
    const err = (msg) => { console.error(msg); logData.push("ERROR: " + msg); };

    log(`🚀 Sending Simulated Webhook to: ${URL}`);

    try {
        const response = await axios.post(URL, payload);
        log(`✅ Status: ${response.status}`);
        log(`📄 Data: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
        log(`❌ Fatal Error: ${error.response ? error.response.status : error.message}`);
        if (error.response) {
            log(`DETAILS: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }

    fs.writeFileSync('debug_output.txt', logData.join('\n'));
}

testWebhook();

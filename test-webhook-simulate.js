const axios = require("axios");

const URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook"; // Production URL
const payload = {
    event: "MESSAGES_UPSERT",
    instance: "shop_surprise_gifts_v2",
    data: {
        key: {
            remoteJid: "1234567890@s.whatsapp.net",
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

async function testWebhook() {
    console.log(`🚀 Sending Simulated Webhook to: ${URL}`);
    console.log(`📦 Payload Instance: ${payload.instance}`);

    try {
        const response = await axios.post(URL, payload);
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Data:`, response.data);
    } catch (error) {
        console.error(`❌ Error:`, error.response ? {
            status: error.response.status,
            data: error.response.data
        } : error.message);
    }
}

testWebhook();

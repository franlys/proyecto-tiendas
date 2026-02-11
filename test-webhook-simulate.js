const axios = require("axios");

const URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook"; // Production URL
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

async function testWebhook() {
    console.log(`🚀 Sending Simulated Webhook to: ${URL}`);
    console.log(`📦 Payload Instance: ${payload.instance}`);

    try {
        const response = await axios.post(URL, payload);
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Data:`, response.data);
    } catch (error) {
        if (error.response) {
            console.error("❌ Fatal Error:", error.response.status);
            console.error("DETAILS:", error.response.data?.details || "No Details");
            console.error("STACK:", error.response.data?.stack || "No Stack");
            console.error("ENV CHECK:", JSON.stringify(error.response.data?.env_check, null, 2));
        } else {
            console.error("❌ Error:", error.message);
        }
    }
}

testWebhook();

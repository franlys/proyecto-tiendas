
const axios = require('axios');

const WEBHOOK_URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook";

async function testWebhook() {
    console.log(`🚀 Sending DUMMY webhook to: ${WEBHOOK_URL}`);

    try {
        const payload = {
            event: "TEST_EVENT",
            instance: "shop_miosotis_nails_v3",
            data: {
                key: { remoteJid: "1234567890@s.whatsapp.net", fromMe: false },
                pushName: "Tester Script",
                message: { conversation: "Test from script" }
            }
        };

        const response = await axios.post(WEBHOOK_URL, payload);
        console.log("✅ Response Status:", response.status);
        console.log("✅ Response Data:", response.data);

    } catch (error) {
        console.error("❌ Request Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testWebhook();

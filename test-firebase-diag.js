const axios = require('axios');
const URL = "https://linko-app-pied.vercel.app/api/debug/firebase";

async function check() {
    try {
        console.log("Checking Firebase Config on Production...");
        const res = await axios.get(URL);
        console.log("Status:", res.status);
        console.log("Body:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("ERROR Checking Firebase:", e.message);
        if (e.response) {
            console.error("Response Status:", e.response.status);
            console.error("Response Body:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

check();

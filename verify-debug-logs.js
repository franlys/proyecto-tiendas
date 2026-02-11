const admin = require("firebase-admin");
const path = require("path");

async function checkDebugLogs() {
    console.log("🔍 Checking Emergency Webhook Logs (webhook_debug_logs)...");

    const credPath = path.resolve("./firebase-credentials.json");
    try {
        const serviceAccount = require(credPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        if (!admin.apps.length) {
            console.error("❌ Credentials Error:", e.message);
            return;
        }
    }

    const db = admin.firestore();

    try {
        // Query the debug collection (simple get)
        const snapshot = await db.collection("webhook_debug_logs").get();

        if (snapshot.empty) {
            console.log("\n❌ NO LOGS FOUND in 'webhook_debug_logs'.");
            console.log("👉 CONCLUSION: The webhook request NEVER reached the server code.");
            console.log("   Possible causes:");
            console.log("   1. Evolution API is not sending the event.");
            console.log("   2. The Webhook URL is unreachable from the Evolution server.");
            console.log("   3. Vercel is blocking the request (unlikely).");
        } else {
            console.log(`\n✅ FOUND ${snapshot.size} LOGS! The webhook IS reaching the server.`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`\n📄 [${data.timestamp}] Event: ${data.event}`);
                console.log(`   Instance: ${data.instance}`);
                console.log(`   Payload Preview: ${data.payload ? data.payload.substring(0, 200) : "No payload"}`);
            });
        }
    } catch (error) {
        console.error("⚠️ Error reading logs:", error.message);
    }
}

checkDebugLogs();

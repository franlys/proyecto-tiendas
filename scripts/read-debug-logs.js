
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-credentials.json");

// Initialize Firebase
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase initialized successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        process.exit(1);
    }
}

const db = admin.firestore();

async function readLogs() {
    console.log("Reading last 20 webhook debug logs...");

    try {
        const snapshot = await db.collection("webhook_debug_logs")
            .orderBy("timestamp", "desc")
            .limit(20)
            .get();

        if (snapshot.empty) {
            console.log("No logs found in 'webhook_debug_logs' collection.");
            return;
        }

        console.log(`Found ${snapshot.size} logs.`);

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n--- Log [${doc.id}] ---`);
            console.log(`Time: ${data.timestamp}`);
            console.log(`Event: ${data.event}`);
            console.log(`Instance: ${data.instance}`);

            try {
                // Payload might be a string or object
                let payload = data.payload;
                if (typeof payload === 'string') {
                    payload = JSON.parse(payload);
                }

                const msgData = payload.data || {};
                const key = msgData.key || {};
                const message = msgData.message || {};

                const from = key.remoteJid;
                const pushName = msgData.pushName;
                const text = message.conversation || message.extendedTextMessage?.text;

                console.log(`From: ${from} (${pushName})`);
                console.log(`Body: ${text || "[Non-text message]"}`);
            } catch (e) {
                console.log("Error parsing payload details:", e.message);
                // console.log("Raw payload:", data.payload); 
            }
        });

    } catch (error) {
        console.error("Error reading logs:", error);
    }
}

readLogs().catch(console.error);

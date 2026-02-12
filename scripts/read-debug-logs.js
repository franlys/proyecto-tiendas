
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-credentials.json");
const fs = require('fs');

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
    console.log("Reading last 20 webhook debug logs... (No OrderBy)");

    try {
        const snapshot = await db.collection("webhook_debug_logs")
            .limit(20)
            .get();

        if (snapshot.empty) {
            console.log("No logs found.");
            fs.writeFileSync('debug_logs.json', JSON.stringify([], null, 2));
            return;
        }

        const logs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            try {
                if (typeof data.payload === 'string') {
                    data.payloadObj = JSON.parse(data.payload);
                }
            } catch (e) { }

            logs.push({
                id: doc.id,
                ...data
            });
        });

        console.log(`Found ${logs.length} logs. Writing to debug_logs.json`);
        fs.writeFileSync('debug_logs.json', JSON.stringify(logs, null, 2));

    } catch (error) {
        console.error("Error reading logs:", error);
    }
}

readLogs().catch(console.error);

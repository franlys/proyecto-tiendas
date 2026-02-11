const admin = require("firebase-admin");
const path = require("path");

// Force reading the local credentials file manually
// because the environment variable approach is for Vercel, not local node scripts
const serviceAccount = require("./firebase-credentials.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnose() {
    console.log("🔍 DIAGNOSING LAST WEBHOOKS & PROCESSING STATUS...");
    console.log("==================================================");

    // 1. Check if the Code *Thought* it received a PING
    // This doc is updated inside the if (text === 'PING') block
    const statusRef = db.collection("shops").doc("surprise-gifts").collection("whatsappConfig").doc("status");
    const statusSnap = await statusRef.get();

    if (statusSnap.exists) {
        console.log("✅ PING LOGIC STATUS (shops/surprise-gifts/whatsappConfig/status):");
        console.log(JSON.stringify(statusSnap.data(), null, 2));
    } else {
        console.log("❌ NO PING STATUS FOUND. The code never reached the 'PING' logic block.");
    }

    console.log("\n📦 LAST 3 RAW WEBHOOK PAYLOADS:");
    console.log("==================================================");

    const logsSnap = await db.collection("webhook_debug_logs")
        .orderBy("timestamp", "desc")
        .limit(3)
        .get();

    if (logsSnap.empty) {
        console.log("❌ No logs found.");
    } else {
        logsSnap.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n[${index + 1}] Timestamp: ${data.timestamp} | Instance: ${data.instance}`);
            try {
                // The payload is stored as a stringified JSON
                const payloadObj = JSON.parse(data.payload);
                // Print the message part deeply to see structure
                console.log("MESSAGE CONTENT:", JSON.stringify(payloadObj.data?.message, null, 2));
                console.log("FULL DATA KEY:", JSON.stringify(payloadObj.data?.key, null, 2));
            } catch (e) {
                console.log("Payload (Raw):", data.payload.substring(0, 500));
            }
        });
    }
}

diagnose();

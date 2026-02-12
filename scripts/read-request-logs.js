const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

// Initialize
const credsPath = path.join(__dirname, '../firebase-credentials.json');
const serviceAccount = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function run() {
    const shopId = "shop-1770499271092"; // Hardcoded from screenshot
    console.log(`Reading logs for ${shopId}...`);

    const snap = await db.collection("shops").doc(shopId).collection("request_logs")
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();

    const logs = [];
    snap.forEach(doc => {
        logs.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate().toISOString()
        });
    });

    const content = JSON.stringify(logs, null, 2);
    // Use absolute path
    const outPath = path.resolve(__dirname, '../logs_dump.txt');
    fs.writeFileSync(outPath, content);
    // console.log(`Logs written to ${outPath}`);
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});

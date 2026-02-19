
const admin = require("firebase-admin");
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin (Robust)
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let certConfig;

    if (serviceAccount) {
        try { certConfig = JSON.parse(serviceAccount); } catch (e) { }
    }

    if (!certConfig) {
        const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (privateKey && clientEmail && projectId) {
            certConfig = { projectId, clientEmail, privateKey };
        } else {
            console.error("❌ Keys Missing"); process.exit(1);
        }
    }

    try {
        admin.initializeApp({ credential: admin.credential.cert(certConfig) });
    } catch (e) {
        console.error("❌ Init Error:", e.message); process.exit(1);
    }
}

const db = admin.firestore();
const SHOP_SLUG = "miosotis-nails";

console.log(`🎧 Listening for Webhook Logs for: ${SHOP_SLUG}...`);

const listener = db.collection("shops").doc(SHOP_SLUG).collection("request_logs")
    .orderBy("timestamp", "desc")
    .limit(1)
    .onSnapshot((snapshot) => {
        if (snapshot.empty) return;

        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const time = data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString() : "Now";
                console.log(`\n🔔 [${time}] NEW WEBHOOK HIT:`);
                console.log(`   Phone: ${data.phone}`);
                console.log(`   Text:  "${data.text}"`);
                console.log(`   Status: ${data.status}`);
                if (data.error) console.log(`   ❌ Error: ${data.error}`);
            }
        });
    }, (error) => {
        console.error("❌ Listener Error:", error);
    });

// Keep alive
setInterval(() => { }, 1000);

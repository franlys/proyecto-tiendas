const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function check() {
    console.log("Checking Local Firebase Config...");

    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

        // Handle JSON key format if present
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            try {
                const json = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
                privateKey = json.private_key;
                console.log("Loaded from FIREBASE_SERVICE_ACCOUNT_KEY");
            } catch (e) {
                console.error("Failed to parse Service Account JSON");
            }
        }

        // Basic clean
        privateKey = privateKey.replace(/\\n/g, '\n');

        if (!privateKey || !clientEmail || !projectId) {
            console.error("MISSING KEYS in .env");
            return;
        }

        console.log(`Project: ${projectId}`);
        console.log(`Email: ${clientEmail}`);
        console.log(`Key Length: ${privateKey.length}`);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });
        }

        const db = admin.firestore();
        console.log("Attempting to read 'shops' collection...");
        const snapshot = await db.collection('shops').limit(1).get();
        console.log(`Success! Found ${snapshot.size} shops.`);

        if (snapshot.size > 0) {
            console.log("First shop ID:", snapshot.docs[0].id);
        }

    } catch (e) {
        console.error("FIREBASE ERROR:", e.message);
        console.error(e);
    }
}

check();


const admin = require("firebase-admin");
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let certConfig;

    if (serviceAccount) {
        console.log("✅ Loading from FIREBASE_SERVICE_ACCOUNT_KEY");
        try {
            certConfig = JSON.parse(serviceAccount);
        } catch (e) {
            console.error("❌ Error parsing JSON key:", e.message);
        }
    }

    if (!certConfig) {
        console.log("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY missing or invalid. Trying individual vars...");
        const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (privateKey && clientEmail && projectId) {
            console.log("✅ Loading from individual vars");
            certConfig = {
                projectId,
                clientEmail,
                privateKey
            };
        } else {
            console.error("❌ ALL Keys Missing. Check .env.local");
            console.error("Debug:", {
                hasKey: !!privateKey,
                hasEmail: !!clientEmail,
                hasProject: !!projectId
            });
            process.exit(1);
        }
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(certConfig)
        });
        console.log("✅ Firebase Admin Initialized");
    } catch (e) {
        console.error("❌ Init Error:", e.message);
        process.exit(1);
    }
}

const db = admin.firestore();
const SHOP_SLUG = "miosotis-nails";
const PROD_URL = "https://linko-app-pied.vercel.app/miosotis-nails";

async function fixWebsite() {
    try {
        console.log(`🔍 Looking for shop: ${SHOP_SLUG}...`);
        const docRef = db.collection("shops").doc(SHOP_SLUG);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error("❌ Shop not found!");
            return;
        }

        const data = doc.data();
        console.log(`   Current Website: ${data.website}`);

        if (data.website !== PROD_URL) {
            console.log(`✏️ Updating website to: ${PROD_URL}...`);
            await docRef.update({
                website: PROD_URL
            });
            console.log("✅ Website updated successfully.");
        } else {
            console.log("✅ Website is already correct.");
        }

    } catch (error) {
        console.error("❌ Error updating shop:", error);
    }
}

fixWebsite();

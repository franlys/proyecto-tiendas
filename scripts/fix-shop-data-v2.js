
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error:', error);
        process.exit(1);
    }
}

const db = admin.firestore();
const SHOP_SLUG = "miosotis-nails";
// The correct production URL
const PROD_URL = "https://linko-app-pied.vercel.app/shop/miosotis-nails";

async function fixShopData() {
    try {
        console.log(`🔍 Updating shop: ${SHOP_SLUG}...`);
        const docRef = db.collection("shops").doc(SHOP_SLUG);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error("❌ Shop not found!");
            return;
        }

        const data = doc.data();
        console.log(`   Current Website: ${data.website}`);

        // Update Website
        await docRef.update({
            website: PROD_URL
        });
        console.log(`✅ Website updated to: ${PROD_URL}`);

        // Check notificationPhones
        const phones = data.notificationPhones || [];
        console.log(`   Current Notification Phones:`, phones);

        if (phones.length === 0) {
            console.log("⚠️ No notification phones found! This is why the owner receives welcome messages.");
            console.log("👉 Please provide the owner's phone number to add it to this list.");
        } else {
            console.log("ℹ️ Notification phones exist. If owner still gets welcome msg, their number might be formatted differently.");
        }

    } catch (error) {
        console.error("❌ Error updating shop:", error);
    }
}

fixShopData();


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

async function checkShopData() {
    const shopSlug = 'miosotis-nails';
    console.log(`🔍 Checking data for: ${shopSlug}`);

    try {
        const doc = await db.collection('shops').doc(shopSlug).get();
        if (!doc.exists) {
            console.log('❌ Shop not found!');
            return;
        }

        const data = doc.data();
        console.log('------------------------------------------------');
        console.log(`🌍 Website URL: ${data.website}`);
        console.log('------------------------------------------------');
        console.log(`📱 Owner Phone (notificationPhones):`, data.notificationPhones);
        console.log('------------------------------------------------');
        console.log(`🆔 Shop ID: ${data.id}`);
        console.log(`👤 Owner ID: ${data.ownerId}`);
        console.log('------------------------------------------------');

        // Check if website matches production
        const PROD_URL = "https://linko-app-pied.vercel.app/shop/miosotis-nails";
        if (data.website !== PROD_URL) {
            console.log(`⚠️ URL MISMATCH! Expected: ${PROD_URL}`);
            console.log(`   Current: ${data.website}`);
        } else {
            console.log("✅ URL matches production.");
        }

    } catch (error) {
        console.error('❌ Error fetching shop data:', error);
    }
}

checkShopData();

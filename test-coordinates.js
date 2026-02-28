require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (err) {
        console.error('Error initializing admin', err);
    }
}

const db = admin.firestore();

async function checkShop() {
    const snapshot = await db.collection('shops').where('slug', '==', 'sculpt-love-method').get();
    if (snapshot.empty) {
        console.log("No shop found with slug sculpt-love-method");
        return;
    }

    const shopData = snapshot.docs[0].data();
    console.log("Shop Data ID:", snapshot.docs[0].id);
    console.log("Shop Contact:", JSON.stringify(shopData.contact, null, 2));
    console.log("Shop Location Info:", JSON.stringify(shopData.location, null, 2));
    console.log("Shop locationDetails:", JSON.stringify(shopData.locationDetails, null, 2));
    console.log("Shop coordinates:", JSON.stringify(shopData.coordinates, null, 2));
    process.exit(0);
}

checkShop();

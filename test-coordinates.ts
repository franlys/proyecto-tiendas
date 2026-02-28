import { adminDb } from './lib/firebase-admin';

async function checkShop() {
    const db = adminDb();
    if (!db) {
        console.log("No admin db");
        return;
    }

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
}

checkShop();

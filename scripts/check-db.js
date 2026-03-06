const admin = require('firebase-admin');
const serviceAccount = require('../firebase-credentials.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkShop(slug) {
    console.log(`Checking shop: ${slug}`);
    const shopRef = db.collection('shops').doc(slug);
    const doc = await shopRef.get();

    if (!doc.exists) {
        console.log('Shop doc not found by ID/Slug directly. Checking by slug field...');
        const q = await db.collection('shops').where('slug', '==', slug).get();
        if (q.empty) {
            console.log('No shop found with that slug.');
            return;
        }
        console.log(`Found ${q.size} shop(s) with slug matching.`);
        q.forEach(d => {
            console.log(`DOC ID: ${d.id}`);
            console.log('DATA:', JSON.stringify(d.data(), null, 2));
        });
    } else {
        console.log('Found shop by ID/Slug directly:');
        console.log('DATA:', JSON.stringify(doc.data(), null, 2));
    }
}

checkShop('sculpt-love-method').catch(console.error);

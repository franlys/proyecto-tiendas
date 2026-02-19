
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

async function testConnection() {
    try {
        console.log(`🔌 Connecting to project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
        const collections = await db.listCollections();
        console.log('📂 Collections found:');
        collections.forEach(col => console.log(` - ${col.id}`));

        const shopSlug = 'miosotis-nails';
        console.log(`\n🔍 Checking for shop doc: shops/${shopSlug}`);
        const doc = await db.collection('shops').doc(shopSlug).get();

        if (doc.exists) {
            console.log('✅ Shop document FOUND!');
            console.log('Data keys:', Object.keys(doc.data()));
        } else {
            console.log('❌ Shop document NOT FOUND.');
            // Try listing shops to see what IDs are there
            const snapshot = await db.collection('shops').limit(5).get();
            console.log('   First 5 shop IDs:');
            snapshot.forEach(doc => console.log(`   - ${doc.id}`));
        }

    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();

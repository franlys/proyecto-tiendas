const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // Assuming you have this locally, if not we'll use default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function removeLoyaltyFromMiosotis() {
    try {
        const shopRef = db.doc('shops/miosotis-nails');
        await shopRef.update({
            features: admin.firestore.FieldValue.arrayRemove('loyalty'),
            enabledFeatures: admin.firestore.FieldValue.arrayRemove('loyalty')
        });
        console.log("Successfully removed loyalty feature from miosotis-nails!");
        process.exit(0);
    } catch (error) {
        console.error("Error removing loyalty feature:", error);
        process.exit(1);
    }
}

removeLoyaltyFromMiosotis();

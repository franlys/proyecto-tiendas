import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_BASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"|"$/g, "");

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
        projectId,
    });
}

const db = getFirestore(admin.app(), "default");

async function migrateData() {
    console.log("Starting migration to canonical shop ID shop-17704992271092...");
    const targetShopId = "shop-17704992271092";

    // 1. Migrate Products from 'sculpt-love-method'
    const sourceProductsReq = await db.collection("shops").doc("sculpt-love-method").collection("products").get();
    console.log(`Found ${sourceProductsReq.size} products in 'sculpt-love-method'`);

    let movedProducts = 0;
    for (const doc of sourceProductsReq.docs) {
        await db.collection("shops").doc(targetShopId).collection("products").doc(doc.id).set(doc.data());
        await doc.ref.delete();
        movedProducts++;
    }
    console.log(`Moved ${movedProducts} products.`);

    // 2. Migrate Training Packages from 'shop-1771856899800'
    const sourceTrainingReq = await db.collection("shops").doc("shop-1771856899800").collection("training-packages").get();
    console.log(`Found ${sourceTrainingReq.size} training packages in 'shop-1771856899800'`);

    let movedTraining = 0;
    for (const doc of sourceTrainingReq.docs) {
        await db.collection("shops").doc(targetShopId).collection("training-packages").doc(doc.id).set(doc.data());
        await doc.ref.delete();
        movedTraining++;
    }
    console.log(`Moved ${movedTraining} training packages.`);

    // 3. Delete the empty dangling documents if they exist
    await db.collection("shops").doc("sculpt-love-method").delete();
    await db.collection("shops").doc("shop-1771856899800").delete();

    console.log("Migration complete!");
}

migrateData().catch(console.error);

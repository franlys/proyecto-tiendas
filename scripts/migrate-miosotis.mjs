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

async function migrateMiosotis() {
    console.log("=== MIGRATING MIOSOTIS NAILS ===");

    // We know the source is "shops/miosotis-nails/services"
    // And the target is "shops/shop-1771178165833"

    const legacyServices = await db.collection("shops").doc("miosotis-nails").collection("services").get();
    const targetPath = db.collection("shops").doc("shop-1771178165833");

    console.log(`Found ${legacyServices.size} legacy services.`);

    if (legacyServices.size > 0) {
        let count = 0;
        const batch = db.batch();
        for (const doc of legacyServices.docs) {
            const data = doc.data();
            const newRef = targetPath.collection("services").doc(doc.id);
            batch.set(newRef, data);

            batch.delete(doc.ref);
            count++;
        }
        await batch.commit();
        console.log(`Migrated ${count} services to canonical shop document.`);
    }
}

migrateMiosotis().catch(console.error);

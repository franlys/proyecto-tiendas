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

const db = getFirestore();

async function check() {
    try {
        const docRef = db.collection("shops").doc("sculpt-love-method");
        const doc = await docRef.get();
        console.log("sculpt-love-method doc exists?", doc.exists);

        const subProducts = await docRef.collection("products").get();
        console.log("sculpt-love-method/products size:", subProducts.size);

        const subTraining = await docRef.collection("training-packages").get();
        console.log("sculpt-love-method/training-packages size:", subTraining.size);

        // Also check if there's any other shop that matches
        const allShops = await db.collection("shops").get();
        allShops.forEach(s => {
            if (s.data().slug === "sculpt-love-method" || s.data().name?.includes("Sculpt")) {
                console.log("Found another match:", s.id, s.data().name, s.data().slug);
            }
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();

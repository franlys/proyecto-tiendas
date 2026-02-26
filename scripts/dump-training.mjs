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

async function check() {
    try {
        const shopId = "shop-17704992271092";
        console.log("Checking training-packages for", shopId);
        const snap = await db.collection("shops").doc(shopId).collection("training-packages").get();
        console.log("Size:", snap.size);
        snap.forEach(doc => console.log("-", doc.id, doc.data().name));
    } catch (e) {
        console.error("ERROR:");
        console.error(e.message);
    }
    process.exit(0);
}

check();

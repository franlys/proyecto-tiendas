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

async function checkSubcollections() {
    const shopId = "shop-17704992271092"; // sculpt-love-method ID
    console.log(`=== CHECKING SUBCOLLECTIONS FOR ${shopId} ===`);
    try {
        const docRef = db.collection("shops").doc(shopId);
        const subcollections = await docRef.listCollections();

        if (subcollections.length === 0) {
            console.log("No subcollections found for this shop.");
        } else {
            console.log("✅ FOUND SUBCOLLECTIONS! The data is still there!");
            for (const sub of subcollections) {
                const snapshot = await sub.select().limit(1).get();
                console.log(`- ${sub.id} (Has data: ${!snapshot.empty})`);
            }
        }
    } catch (err) {
        console.error("Error reading subcollections:", err);
    }
}

checkSubcollections().catch(console.error);

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

async function fixShopLogin() {
    const shopId = "shop-17704992271092"; // sculpt-love-method ID

    console.log(`🚀 Adding custom login credentials to Shop: ${shopId}`);

    try {
        await db.collection("shops").doc(shopId).update({
            ownerUsername: "sculpt-love-method",
            ownerPassword: "123"
        });

        console.log(`✅ Shop document updated with ownerUsername and ownerPassword!`);
        console.log(`The user should now be able to login using sculpt-love-method / 123`);

    } catch (error) {
        console.error("❌ Error updating shop:", error);
    }
}

fixShopLogin();

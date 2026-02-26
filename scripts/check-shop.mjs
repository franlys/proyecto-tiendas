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

async function checkShop() {
    console.log("🔍 Checking shop sculpt-love-method...");
    try {
        const shopDoc = await db.collection("shops").doc("sculpt-love-method").get();
        if (shopDoc.exists) {
            console.log("✅ Shop exists:", shopDoc.data());
        } else {
            console.log("❌ Shop does not exist in 'shops' collection");
        }

        const storesQuery = await db.collection("stores").doc("sculpt-love-method").get();
        if (storesQuery.exists) {
            console.log("✅ Store exists in 'stores':", storesQuery.data());
        }

        const usersQuery = await db.collection("users").where("role", "==", "admin").get();
        console.log(`Found ${usersQuery.docs.length} admins.`);
        usersQuery.docs.forEach(u => {
            console.log(`👤 Admin ID: ${u.id} | Email: ${u.data().email} | ShopId: ${u.data().shopId}`);
        });
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkShop();

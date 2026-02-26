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

async function checkDb(dbName) {
    console.log(`\n=== CHECKING DATABASE: ${dbName} ===`);
    try {
        const db = getFirestore(admin.app(), dbName);
        const shops = await db.collection("shops").get();
        const users = await db.collection("users").get();

        console.log(`Total Shops: ${shops.docs.length}`);
        console.log(`Total Users: ${users.docs.length}`);

        const targetShop = await db.collection("shops").doc("sculpt-love-method").get();
        if (targetShop.exists) {
            console.log("✅ FOUND sculpt-love-method in this DB !!");
        }

    } catch (err) {
        console.error(`Error reading ${dbName}:`, err.message);
    }
}

async function main() {
    await checkDb("(default)");
    await checkDb("default");
}

main().catch(console.error);

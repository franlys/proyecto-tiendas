import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import fs from "fs";

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
    console.log("🔍 Finding users with shopId 'sculpt-love-method'...");
    try {
        const usersQuery = await db.collection("users").where("shopId", "==", "sculpt-love-method").get();
        const users = usersQuery.docs.map(u => ({ id: u.id, ...u.data() }));

        fs.writeFileSync("sculpt-users.json", JSON.stringify(users, null, 2), "utf8");
        console.log(`✅ Found ${users.length} users. Saved to sculpt-users.json`);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkShop();

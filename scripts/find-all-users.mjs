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

async function findAllUsers() {
    console.log("🔍 Listing ALL users to find the owner of sculpt-love-method...");
    try {
        const allUsers = await db.collection("users").get();

        allUsers.docs.forEach(u => {
            const data = u.data();
            console.log(`👤 ID: ${u.id} | Email: ${data.email} | Name: ${data.name} | Role: ${data.role} | ShopId: ${data.shopId}`);
        });

    } catch (error) {
        console.error("❌ Error finding users:", error);
    }
}

findAllUsers();

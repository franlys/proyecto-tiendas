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

async function listAllCollections() {
    console.log("=== LISTING ALL COLLECTIONS IN DEFAULT DB ===");
    try {
        const collections = await db.listCollections();
        if (collections.length === 0) {
            console.log("No collections found.");
        } else {
            console.log("Found collections:");
            for (const collection of collections) {
                console.log(`- ${collection.id}`);
                // Count documents in each collection
                const snapshot = await collection.select().get();
                console.log(`  (${snapshot.size} documents)`);
            }
        }
    } catch (err) {
        console.error("Error listing collections:", err);
    }
}

listAllCollections().catch(console.error);

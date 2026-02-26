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

async function dumpAll() {
    let output = "=== ALL SHOPS ===\n";
    const shops = await db.collection("shops").get();
    shops.forEach(doc => {
        output += `[SHOP] ID: ${doc.id} | Slug: ${doc.data().slug} | Name: ${doc.data().name} | Type: ${doc.data().businessType} | OwnerId: ${doc.data().ownerId}\n`;
    });

    output += "\n=== ALL USERS ===\n";
    const users = await db.collection("users").get();
    users.forEach(doc => {
        output += `[USER] ID: ${doc.id} | Email: ${doc.data().email} | Role: ${doc.data().role} | ShopId: ${doc.data().shopId}\n`;
    });

    fs.writeFileSync("dump.txt", output, "utf8");
    console.log("Dump saved to dump.txt");
}

dumpAll().catch(console.error);

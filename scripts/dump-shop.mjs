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

async function check() {
    let output = "=== CHECK MULTIPLE SUBCOLLECTIONS ===\n";

    for (const shopId of ["shop-1771856899800", "shop-17704992271092", "sculpt-love-method"]) {
        output += `Shop: ${shopId}\n`;

        const orders = await db.collection("shops").doc(shopId).collection("orders").get();
        output += `  orders: ${orders.size}\n`;

        const products = await db.collection("shops").doc(shopId).collection("products").get();
        output += `  products: ${products.size}\n`;

        const training = await db.collection("shops").doc(shopId).collection("training-packages").get();
        output += `  training-packages: ${training.size}\n`;
    }

    fs.writeFileSync("inspect_output_clean.txt", output, "utf-8");
}

check().catch(console.error);

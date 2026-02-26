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

async function checkShopBySlug() {
    console.log("🔍 Finding shop by slug 'sculpt-love-method'...");
    try {
        const shopsQuery = await db.collection("shops").where("slug", "==", "sculpt-love-method").get();
        if (shopsQuery.empty) {
            console.log("❌ No shops found with slug 'sculpt-love-method'");
        } else {
            console.log(`✅ Found ${shopsQuery.docs.length} shops with slug 'sculpt-love-method'`);
            shopsQuery.docs.forEach(d => console.log(`ID: ${d.id}`, d.data()));
        }

        // Also let's check by name containing "sculpt"
        const allShopsByName = await db.collection("shops").get();
        const sculptShops = allShopsByName.docs.filter(d =>
            d.data().name?.toLowerCase().includes("sculpt") ||
            d.data().slug?.toLowerCase().includes("sculpt")
        );
        console.log(`\n🔍 Found ${sculptShops.length} shops containing 'sculpt' in name/slug:`);
        sculptShops.forEach(d => console.log(`ID: ${d.id}`, d.data().name, d.data().slug));

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

checkShopBySlug();

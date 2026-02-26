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

async function diagnoseUserAndShop() {
    let log = "🔍 Diagnosing User and Shop state...\n";
    try {
        const username = "sculpt-love-method";
        const email = "info@sculptlovemethod.com";

        log += "👤 Checking users...\n";
        const usersByUsername = await db.collection("users").where("username", "==", username).get();
        const usersByEmail = await db.collection("users").where("email", "==", email).get();

        usersByUsername.docs.forEach(d => log += `   [Username Match] ID: ${d.id}, ShopId: ${d.data().shopId}, Email: ${d.data().email}\n`);
        usersByEmail.docs.forEach(d => log += `   [Email Match] ID: ${d.id}, ShopId: ${d.data().shopId}, Username: ${d.data().username}\n`);

        log += "🏠 Checking all shops matching 'sculpt-love-method' or containing it...\n";
        const allShops = await db.collection("shops").get();
        let foundAny = false;
        allShops.docs.forEach(d => {
            const data = d.data();
            if (data.slug?.includes('sculpt') || data.name?.toLowerCase().includes('sculpt') || d.id === 'shop-17704992271092') {
                log += `   - ID: ${d.id}, Slug: ${data.slug}, Name: ${data.name}\n`;
                foundAny = true;
            }
        });

        if (!foundAny) {
            log += "   ❌ No shops found matching sculpt-love-method!\n";
        }

        // Since we know the previous Target Shop ID was shop-17704992271092, check if it explicitly exists:
        const targetShop = await db.collection("shops").doc("shop-17704992271092").get();
        if (targetShop.exists) {
            log += `   ✅ Shop shop-17704992271092 EXACT MATCH exists! Slug: ${targetShop.data().slug}\n`;
        } else {
            log += `   ❌ Shop shop-17704992271092 EXACT MATCH is MISSING!\n`;
        }

    } catch (error) {
        log += `❌ Error diagnosing: ${error}\n`;
    }

    fs.writeFileSync("diagnose_output.txt", log, "utf8");
    console.log("Done");
}

diagnoseUserAndShop();

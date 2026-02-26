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

async function fullRecovery() {
    const shopId = "shop-17704992271092"; // sculpt-love-method ID
    const slug = "sculpt-love-method";
    const email = "info@sculptlovemethod.com";

    console.log(`🚀 Starting Full Recovery for: ${slug} (${shopId})`);

    // 1. Recover the Shop Document
    const shopData = {
        name: "Sculpt Love Method",
        slug: slug,
        // we'll assign ownerId later, just a placeholder for now
        ownerId: "TEMP_OWNER_ID",
        businessType: "meal_prep",
        businessTypes: ["meal_prep", "entrenador_personal"],
        createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-23T14:28:21.271Z")),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        contact: {
            phone: "+1234567890",
            whatsapp: "+1234567890",
            email: email,
            instagram: "@sculptlovemethod"
        },
        theme: {
            primaryColor: "#ec4899", // pink-500 default
            fontFamily: "Inter"
        },
        config: {
            requireAddress: true,
            deliveryTypes: ["pickup", "delivery"]
        }
    };

    try {
        await db.collection("shops").doc(shopId).set(shopData);
        console.log(`✅ Shop document recovered at shops/${shopId}! Products and orders inside this shop are now accessible.`);

        // Also create a custom user account in Auth
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
            console.log("Auth user already exists:", userRecord.uid);

            // Delete it for the sake of fresh recovery
            await admin.auth().deleteUser(userRecord.uid);
            console.log("Deleted old auth user.");
        } catch (e) {
            console.log("No existing auth user found.");
        }

        userRecord = await admin.auth().createUser({
            email: email,
            emailVerified: true,
            password: "password123", // Set a default password so the user can login
            displayName: "Sculpt Love Admin",
            disabled: false,
        });
        console.log(`✅ Created Firebase Auth User: ${userRecord.uid} using password: password123`);

        // Update shop with real ownerId
        await db.collection("shops").doc(shopId).update({ ownerId: userRecord.uid });

        // Add user to 'users' collection
        await db.collection("users").doc(userRecord.uid).set({
            email: email,
            name: "Sculpt Love Admin",
            role: "admin",
            shopId: shopId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            phone: "+1234567890"
        });
        console.log(`✅ Created Firestore User Document for ${userRecord.uid}`);

        console.log(`🎉 RECOVERY COMPLETE!`);
        console.log(`Tell the user to login with: ${email} / password123`);
    } catch (error) {
        console.error("❌ Error during recovery:", error);
    }
}

fullRecovery();

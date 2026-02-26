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

async function recoverShop() {
    const shopId = "shop-17704992271092";
    const slug = "sculpt-love-method";
    const email = "info@sculptlovemethod.com";

    console.log(`🚀 Recovering Shop: ${slug} (${shopId})`);

    try {
        // 1. Fetch user to ensure we have the correct user info
        const usersSnapshot = await db.collection("users").where("email", "==", email).get();
        if (usersSnapshot.empty) {
            console.error(`❌ User ${email} not found!`);
            return;
        }
        const userDoc = usersSnapshot.docs[0];
        const user = userDoc.data();

        // Default shop data
        const shopData = {
            name: "Sculpt Love Method",
            slug: slug,
            ownerId: userDoc.id,
            ownerUsername: "sculpt-love-method",
            businessType: "meal_prep",
            businessTypes: ["meal_prep", "entrenador_personal"],
            createdAt: admin.firestore.Timestamp.fromDate(new Date("2026-02-23T14:28:21.271Z")),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            contact: {
                phone: user.phone || "+1234567890",
                whatsapp: user.phone || "+1234567890",
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

        // 2. Set the shop document
        await db.collection("shops").doc(shopId).set(shopData);
        console.log(`✅ Shop document created at shops/${shopId}`);

        // 3. Ensure user points to this shopId
        if (user.shopId !== shopId) {
            console.log(`👤 Updating user ${userDoc.id} shopId to ${shopId}`);
            await db.collection("users").doc(userDoc.id).update({ shopId: shopId });
        } else {
            console.log(`👤 User already pointing to ${shopId}`);
        }

        console.log("✅ Recovery completed successfully. The user should be able to log in and see the shop and orders.");

    } catch (error) {
        console.error("❌ Error recovering shop:", error);
    }
}

recoverShop();

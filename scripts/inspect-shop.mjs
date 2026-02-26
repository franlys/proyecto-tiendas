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

async function inspectShop() {
    const shopId = "shop-17704992271092"; // sculpt-love-method ID
    console.log(`=== INSPECTING SHOP ${shopId} ===`);

    const doc = await db.collection("shops").doc(shopId).get();
    console.log("Shop Data:", JSON.stringify(doc.data(), null, 2));

    const productsSnap = await db.collection("shops").doc(shopId).collection("products").get();
    console.log(`\nProducts Count: ${productsSnap.size}`);
    productsSnap.forEach(p => console.log(` - [${p.id}] ${p.data().name}`));

    const ordersSnap = await db.collection("shops").doc(shopId).collection("orders").get();
    console.log(`\nOrders Count: ${ordersSnap.size}`);
    ordersSnap.forEach(o => console.log(` - [${o.id}] ${o.data().status} | ${o.data().createdAt?.toDate()}`));
}

inspectShop().catch(console.error);

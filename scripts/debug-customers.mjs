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

async function checkOrphans() {
    const shopId = "shop-1740003058913"; // sculpt-love-method
    const slug = "sculpt-love-method";

    const ordersSnap = await db.collection("shops").doc(shopId).collection("orders").get();
    const phonesInOrders = new Set();
    ordersSnap.forEach(doc => {
        const phone = doc.data().customerPhone;
        if (phone) {
            phonesInOrders.add(phone.replace(/\D/g, ""));
        }
    });

    const customersSnap = await db.collection("shops").doc(shopId).collection("customers").get();
    console.log(`- Orders in canonical: ${ordersSnap.size}`);
    console.log(`- Unique Phones in Canonical Orders: ${phonesInOrders.size}`);
    console.log(`- Customers in canonical config: ${customersSnap.size}`);

    // Check slug 
    const slugCustomers = await db.collection("shops").doc(slug).collection("customers").get();
    const slugLoyalty = await db.collection("shops").doc(slug).collection("customerLoyalty").get();

    console.log(`- Customers in Ghost Slug: ${slugCustomers.size}`);
    console.log(`- Loyalty in Ghost Slug: ${slugLoyalty.size}`);
}

checkOrphans().catch(console.error);

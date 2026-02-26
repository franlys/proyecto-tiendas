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

async function check() {
    console.log("=== SEARCHING ALL COLLECTIONS FOR MIOSOTIS ===");

    // Check if there is a shop doc literally called "miosotis-nails"
    const literalDoc = await db.collection("shops").doc("miosotis-nails").get();
    if (literalDoc.exists) {
        console.log("Literal doc miosotis-nails exists!");
        console.log("Data:", literalDoc.data());

        const s1 = await literalDoc.ref.collection("services").get();
        console.log("- services size:", s1.size);
        const s2 = await literalDoc.ref.collection("bookingServices").get();
        console.log("- bookingServices size:", s2.size);
        const p1 = await literalDoc.ref.collection("products").get();
        console.log("- products size:", p1.size);
    }

    const allServices = await db.collectionGroup("services").get();
    const allBooking = await db.collectionGroup("bookingServices").get();
    const allProducts = await db.collectionGroup("products").get();

    for (const snap of [allServices, allBooking, allProducts]) {
        for (const doc of snap.docs) {
            if (doc.ref.path.toLowerCase().includes("miosotis")) {
                console.log("Found match in path:", doc.ref.path, doc.data().name);
            }
        }
    }
}

check().catch(console.error);

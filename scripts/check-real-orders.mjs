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

async function checkRealData() {
    const shopsToCheck = [
        { slug: "miosotis-nails", realId: "shop-1771178165833" },
        { slug: "sculpt-love-method", realId: "shop-17704992271092" },
        { slug: "franlys-nails", realId: "shop-1738730999017" },
        { slug: "bella-y-saludable", realId: "shop-1738363717140" }
    ];

    const results = {};

    for (const shop of shopsToCheck) {
        const orderSnapshot = await db.collection("shops").doc(shop.realId).collection("orders").get();
        results[shop.slug] = {
            realIdPath: orderSnapshot.size,
            docs: orderSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        };
    }

    fs.writeFileSync("real-orders.json", JSON.stringify(results, null, 2));
}

checkRealData().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(console.error);

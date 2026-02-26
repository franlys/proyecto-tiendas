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

const COLLECTIONS_TO_MIGRATE = [
    "services",
    "bookingServices",
    "products",
    "training-packages",
    "orders",
    "promos",
    "categories"
];

async function migrate() {
    console.log("=== STARTING GLOBAL MIGRATION: SLUG to ID ===");

    // 1. Get all shops
    const shopsSnap = await db.collection("shops").get();

    // Filter to real shops (docs that contain a name/slug)
    const realShops = shopsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.slug && data.name && doc.id.startsWith("shop-");
    });

    console.log(`Found ${realShops.length} actual shops.`);

    for (const shop of realShops) {
        const shopId = shop.id;
        const slug = shop.data().slug;

        console.log(`\nProcessing shop: ${shop.data().name} (${shopId}) - Slug: ${slug}`);

        // Check if there is a document in 'shops' explicitly named as 'slug'
        const slugDocRef = db.collection("shops").doc(slug);
        const slugDocSnap = await slugDocRef.get();

        if (slugDocSnap.exists) {
            console.log(`  -> FOUND rogue slug document for '${slug}'. Migrating data...`);

            // Migrate each subcollection
            for (const collName of COLLECTIONS_TO_MIGRATE) {
                const legacyCollRef = slugDocRef.collection(collName);
                const canonicalCollRef = db.collection("shops").doc(shopId).collection(collName);

                const legacyDocs = await legacyCollRef.get();
                if (!legacyDocs.empty) {
                    console.log(`    - Found ${legacyDocs.size} docs in '${collName}'. Merging...`);

                    const batch = db.batch();
                    let count = 0;

                    for (const doc of legacyDocs.docs) {
                        const targetRef = canonicalCollRef.doc(doc.id);
                        // Check if it already exists, if so skip or overwrite? Let's overwrite to ensure admin changes take precedence, 
                        // but if they are completely different IDs, they will just append.
                        batch.set(targetRef, doc.data(), { merge: true });
                        count++;

                        // Delete the old one
                        batch.delete(doc.ref);

                        // Commit in chunks of 500
                        if (count % 400 === 0) {
                            await batch.commit();
                            console.log(`      Committed ${count} docs`);
                        }
                    }

                    if (count % 400 !== 0) {
                        await batch.commit();
                    }

                    console.log(`    - Successfully migrated and cleaned up ${count} docs in '${collName}'`);
                }
            }

            // Optional: delete the rogue slug document itself
            console.log(`  -> Deleting rogue root document: ${slug}`);
            await slugDocRef.delete();

        } else {
            console.log(`  -> No rogue slug document found. Safe.`);
        }
    }

    console.log("\n=== MIGRATION COMPLETE ===");
}

migrate().catch(console.error);

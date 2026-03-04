import { adminDb } from "../lib/firebase-admin";

async function checkMiosotis() {
    const db = adminDb();
    if (!db) {
        console.error("Firebase Admin not initialized");
        return;
    }

    // Try to find Miosotis nails by slug
    const shopsRef = db.collection("shops");
    const querySnapshot = await shopsRef.where("slug", "==", "miosotis-nails").get();

    if (querySnapshot.empty) {
        console.log("Miosotis Nails not found by slug 'miosotis-nails'. Let's search by name.");
        const nameSnapshot = await shopsRef.where("name", ">=", "Miosotis").where("name", "<=", "Miosotis\uf8ff").get();
        if (nameSnapshot.empty) {
            console.log("No shops starting with Miosotis found.");
            return;
        }
        nameSnapshot.forEach(doc => {
            console.log(`Found shop: ${doc.id} - ${doc.data().name} (Slug: ${doc.data().slug})`);
        });
        return;
    }

    querySnapshot.forEach(async (doc) => {
        const shop = doc.data();
        console.log(`\n================================`);
        console.log(`Shop Found: ${shop.name}`);
        console.log(`ID: ${doc.id}`);
        console.log(`Slug: ${shop.slug}`);
        console.log(`Template: ${shop.templateType}`);
        console.log(`Enabled Features:`, shop.enabledFeatures);
        console.log(`Features (legacy):`, shop.features);

        // Check products under doc.id
        console.log(`\nChecking products under shops/${doc.id}/products`);
        const productsById = await db.collection("shops").doc(doc.id).collection("products").get();
        console.log(`Products found: ${productsById.size}`);

        // Check products under shop.slug
        console.log(`Checking products under shops/${shop.slug}/products`);
        const productsBySlug = await db.collection("shops").doc(shop.slug).collection("products").get();
        console.log(`Products found: ${productsBySlug.size}`);

        // Check services under doc.id
        console.log(`\nChecking bookingServices under shops/${doc.id}/bookingServices`);
        const servicesById = await db.collection("shops").doc(doc.id).collection("bookingServices").get();
        console.log(`Services found: ${servicesById.size}`);

        // Check services under shop.slug
        console.log(`Checking bookingServices under shops/${shop.slug}/bookingServices`);
        const servicesBySlug = await db.collection("shops").doc(shop.slug).collection("bookingServices").get();
        console.log(`Services found: ${servicesBySlug.size}`);
    });
}

checkMiosotis().catch(console.error);

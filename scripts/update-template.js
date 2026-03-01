const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

try {
    const app = initializeApp();
    const db = getFirestore(app);

    async function seedGingxerShop() {
        const shopsRef = db.collection("shops");
        const slug = "gingxerstudio";
        const snapshot = await shopsRef.where("slug", "==", slug).get();

        if (snapshot.empty) {
            console.log("gingxerstudio does not exist in DB yet. Creating...");
            const newDocRef = await shopsRef.add({
                name: "Gingxer Studio",
                slug: slug,
                description: "ALL FOR THE LOVE",
                templateType: "street-drop-v1",
                contact: { phone: "1234567890" },
                businessType: "retail",
            });
            console.log(`Created new document with ID: ${newDocRef.id}`);
        } else {
            console.log("gingxerstudio exists. Updating templateType to 'street-drop-v1'...");
            const docId = snapshot.docs[0].id;
            await shopsRef.doc(docId).set({ templateType: "street-drop-v1" }, { merge: true });
            console.log("Updated document.");
        }
    }

    seedGingxerShop().catch(console.error);
} catch (error) {
    console.error("Firebase admin init error", error);
}

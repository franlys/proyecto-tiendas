const admin = require("firebase-admin");
const path = require("path");

async function checkPing() {
    console.log("🔍 Checking Webhook Logs...");

    const credPath = path.resolve("./firebase-credentials.json");
    const serviceAccount = require(credPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    // Check both potential paths (Slug vs ID)
    const possibleIds = ["surprise-gifts", "shop-1770499271092"];

    for (const shopId of possibleIds) {
        console.log(`\n📂 Checking path: shops/${shopId}/whatsappConfig/status`);
        try {
            const docRef = db.collection("shops").doc(shopId).collection("whatsappConfig").doc("status");
            const doc = await docRef.get();

            if (doc.exists) {
                console.log("✅ LOG FOUND!");
                console.log(JSON.stringify(doc.data(), null, 2));
                return; // Stop after finding one
            } else {
                console.log("❌ Document not found.");
            }
        } catch (error) {
            console.error("⚠️ Error reading path:", error.message);
        }
    }

    console.log("\n❌ No logs found in any expected location.");
}

checkPing();

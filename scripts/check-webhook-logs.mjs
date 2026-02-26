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

async function searchWebhookLogs() {
    console.log("=== SEARCHING WEBHOOK LOGS FOR SCULPT ===");
    try {
        const logs = await db.collection("webhook_debug_logs").orderBy("timestamp", "desc").limit(100).get();
        let found = false;
        logs.forEach(doc => {
            const data = doc.data();
            const strData = JSON.stringify(data).toLowerCase();
            if (strData.includes("sculpt")) {
                console.log(`[FOUND in log ${doc.id}]`, strData.substring(0, 200) + "...");
                found = true;
            }
        });
        if (!found) {
            console.log("No recent mention of 'sculpt' in the last 100 webhook logs. This might be a completely different DB instance.");
        } else {
            console.log("Found footprints! The database was indeed wiped but logs remain.");
        }
    } catch (err) {
        console.error("Error reading logs:", err);
    }
}

searchWebhookLogs().catch(console.error);

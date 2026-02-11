
import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// --- 1. Load Env ---
try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        envConfig.split("\n").forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, "");
                process.env[key] = value;
            }
        });
        console.log("Loaded .env.local");
    } else {
        console.log(".env.local not found at", envPath);
    }
} catch (e) {
    console.log("Could not load .env.local", e);
}

// --- 2. Init Firebase ---
function initAdmin() {
    if (admin.apps.length > 0) return admin.app();

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";

    if (!projectId || !clientEmail || !rawPrivateKey) {
        console.error("Missing credentials!");
        console.log("ProjectId:", projectId);
        console.log("ClientEmail:", clientEmail);
        console.log("PrivateKey Len:", rawPrivateKey.length);
        return null;
    }

    // Format Key Logic (from lib/firebase-admin.ts)
    function formatPrivateKey(key: string) {
        const header = "-----BEGIN PRIVATE KEY-----";
        const footer = "-----END PRIVATE KEY-----";
        let internalBody = key.replace(/\\n/g, "");
        internalBody = internalBody.replace(header, "").replace(footer, "");
        const cleanBody = internalBody.replace(/[^a-zA-Z0-9+/=]/g, "");
        const chunkedBody = cleanBody.match(/.{1,64}/g)?.join("\n");
        return `${header}\n${chunkedBody}\n${footer}`;
    }

    const formattedKey = formatPrivateKey(rawPrivateKey);

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedKey,
            }),
            projectId: projectId,
        });
    } catch (e) {
        console.error("Init failed:", e);
        return null;
    }
}

const app = initAdmin();
const db = app ? getFirestore(app) : null;

// --- 3. Run Diagnosis ---
async function main() {
    if (!db) {
        console.error("No DB connection");
        return;
    }

    console.log("--- Starting Diagnosis ---");

    const shopsSnap = await db.collection("shops").get(); // Get all to filter

    console.log(`Analyzing ${shopsSnap.size} shops...`);

    const targetPhone = "18099775250"; // User's personal phone (normalized)

    for (const doc of shopsSnap.docs) {
        const data = doc.data();

        // Normalize owner phones to check match
        const p1 = (data.ownerPhone || "").replace(/\D/g, "");
        const p2 = (data.ownerNotificationPhone || "").replace(/\D/g, "");
        const p3 = (data.contact?.phone || "").replace(/\D/g, "");

        const isMatch = p1.includes(targetPhone) || p2.includes(targetPhone) || p3.includes(targetPhone);

        if (isMatch) {
            console.log(`\n>>> MATCH FOUND: ${doc.id} <<<`);
            console.log(`Name: ${data.name}`);
            console.log(`Owner Phone: ${data.ownerPhone}`);
            console.log(`Owner Notif: ${data.ownerNotificationPhone}`);
            console.log(`Contact: ${JSON.stringify(data.contact || {})}`);

            // Check Config
            const botConfigSnap = await db.collection("shops").doc(doc.id).collection("whatsapp_bot").doc("config").get();
            if (botConfigSnap.exists) {
                const botData = botConfigSnap.data();
                console.log(`[Bot Config] Enabled: ${botData.enabled}`);
                console.log(`[Bot Config] Owner Notif Phone: ${botData.ownerNotificationPhone}`);
                console.log(`[Bot Config] Staff Phones: ${JSON.stringify(botData.staffNotificationPhones || [])}`);
            } else {
                console.log(`[Bot Config] NOT FOUND`);
            }

            // Check recent customers
            const customersSnap = await db.collection("shops").doc(doc.id).collection("customers")
                .orderBy("updatedAt", "desc")
                .limit(5)
                .get();

            console.log(`[Recent Customers]:`);
            customersSnap.docs.forEach(c => {
                const cData = c.data();
                console.log(`  - ${cData.phone} ("${cData.name}") [${cData.registrationState}]`);
            });
        }
    }
}

main().catch(console.error);

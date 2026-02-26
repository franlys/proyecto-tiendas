import admin from "firebase-admin";
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

async function listAllUsers() {
    try {
        console.log("=== FIREBASE AUTH USERS ===");
        let users = await admin.auth().listUsers(100);

        if (users.users.length === 0) {
            console.log("No users in Firebase Auth.");
        } else {
            for (const user of users.users) {
                console.log(`[AUTH] UID: ${user.uid} | Email: ${user.email} | Name: ${user.displayName}`);
            }
        }
    } catch (err) {
        console.error("Error fetching auth users:", err);
    }
}

listAllUsers().catch(console.error);

import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    let cleanKey = key.trim();

    // 1. Remove wrapping quotes
    if (
        (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
        (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
    ) {
        cleanKey = cleanKey.slice(1, -1);
    }

    // 2. Handle literal escaped newlines (standard .env format)
    cleanKey = cleanKey.replace(/\\n/g, "\n");

    // 3. Handle "One-Line" or "Mashed" keys (User Case)
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    // If it contains the header but DOES NOT have a newline immediately after
    if (cleanKey.includes(header) && !cleanKey.includes(`${header}\n`)) {
        // Isolate the body by stripping headers
        let body = cleanKey.replace(header, "").replace(footer, "").trim();

        // Improve formatting: If spaces exist, they are likely broken newlines
        if (body.includes(" ")) {
            body = body.replace(/ /g, "\n");
        }

        return `${header}\n${body}\n${footer}`;
    }

    return cleanKey;
}

export function initAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
    const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "").trim();
    const rawPrivateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").trim();

    // Diagnostics for logs
    const missing = [];
    if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!rawPrivateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");

    if (missing.length > 0) {
        if (process.env.NODE_ENV === "production") {
            const msg = `MISSING KEYS: ${missing.join(", ")}`;
            console.error(`❌ [FIREBASE ADMIN] ${msg}`);
            throw new Error(`Error de Configuración Vercel: ${msg}`);
        }
        console.warn("Missing Admin Credentials in Dev:", missing);
        return null;
    }

    const formattedKey = formatPrivateKey(rawPrivateKey);

    // DEBUG: Log precise key diagnosis
    if (process.env.NODE_ENV === "production") {
        console.log("🔍 [KEY DIAGNOSIS]");
        console.log(`   - Raw Length: ${rawPrivateKey.length}`);
        console.log(`   - Formatted Length: ${formattedKey.length}`);
        console.log(`   - Starts With Header?: ${formattedKey.startsWith("-----BEGIN PRIVATE KEY-----")}`);
        console.log(`   - Contains Newlines?: ${formattedKey.includes("\n")}`);
        console.log(`   - First 10 chars: "${formattedKey.substring(0, 10)}..."`);
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: formattedKey,
            }),
        });
    } catch (error: any) {
        console.error("❌ [FIREBASE ADMIN] Init Failed:", error);
        throw new Error(`Error fatal al inicializar Firebase Admin: ${error.message}`);
    }
}

export const adminAuth = () => {
    const app = initAdmin();
    return app ? app.auth() : null;
};

export const adminDb = () => {
    const app = initAdmin();
    return app ? app.firestore() : null;
};

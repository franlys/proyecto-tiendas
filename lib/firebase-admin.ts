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

    // 2. Basic cleanup of escaped newlines
    cleanKey = cleanKey.replace(/\\n/g, "\n");

    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    // 3. PEM Reconstruction: Extract, Clean, Chunk
    if (cleanKey.includes(header)) {
        // Isolate the base64 payload by removing headers and ALL whitespace
        const bodyRaw = cleanKey
            .replace(header, "")
            .replace(footer, "")
            .replace(/\s+/g, "");

        // RFC 7468: Split into 64-character lines
        const chunkedBody = bodyRaw.match(/.{1,64}/g)?.join("\n");

        return `${header}\n${chunkedBody}\n${footer}`;
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

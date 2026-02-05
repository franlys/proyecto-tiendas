import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    // Robust Regex Extraction: Ignores outer garbage, grabs inner base64
    const match = key.match(/-----BEGIN PRIVATE KEY-----([\s\S]*)-----END PRIVATE KEY-----/);

    if (match && match[1]) {
        // We found headers. Extract body.
        const bodyRaw = match[1].replace(/\s+/g, ""); // Remove all whitespace
        // Re-chunk to 64 chars
        const chunkedBody = bodyRaw.match(/.{1,64}/g)?.join("\n");
        return `-----BEGIN PRIVATE KEY-----\n${chunkedBody}\n-----END PRIVATE KEY-----`;
    }

    // Fallback: Maybe it's verified JSON string?
    let clean = key.trim();
    if (clean.startsWith('"') || clean.startsWith("'")) clean = clean.slice(1, -1);
    clean = clean.replace(/\\n/g, "\n");
    return clean;
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

    // NEW: Check for Truncation
    // Remove quotes first to check end safely
    const cleanRaw = rawPrivateKey.replace(/^["']|["']$/g, "").trim();
    if (!cleanRaw.includes("-----END PRIVATE KEY-----")) {
        console.error("❌ [FIREBASE ADMIN] KEY TRUNCATION DETECTED!");
        console.error("   - Length:", cleanRaw.length);
        console.error("   - End of Key:", cleanRaw.slice(-50));
        throw new Error("Error Crítico: La Variable de Entorno FIREBASE_ADMIN_PRIVATE_KEY está incomplet. Parece que no se copió el final '-----END PRIVATE KEY-----'.");
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

        // PUBLIC DIAGNOSTICS FOR UI
        const debugStart = formattedKey.substring(0, 15).replace(/\n/g, "N");
        const debugEnd = formattedKey.slice(-15).replace(/\n/g, "N");
        const diag = `[Len:${formattedKey.length} Start:${debugStart} End:${debugEnd}]`;

        throw new Error(`Firebase Key Error: ${error.message} ${diag}`);
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

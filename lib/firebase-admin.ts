import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    // 1. Normalize: remove literal escaped newlines and headers
    let internalBody = key.replace(/\\n/g, "");
    internalBody = internalBody.replace(header, "").replace(footer, "");

    // 2. Whitelist: Keep ONLY valid Base64 characters (A-Z, a-z, 0-9, +, /, =)
    // This aggressively removes spaces, quotes, newlines, and potential copy-paste artifacts
    const cleanBody = internalBody.replace(/[^a-zA-Z0-9+/=]/g, "");

    if (cleanBody.length < 500) {
        // RSA 2048 keys are usually ~1600 chars. <500 implies severe data loss.
        console.warn(`⚠️ [FIREBASE ADMIN] Private Key body seems too short! (Len: ${cleanBody.length})`);
    }

    // 3. Reconstruct standard PEM
    const chunkedBody = cleanBody.match(/.{1,64}/g)?.join("\n");
    return `${header}\n${chunkedBody}\n${footer}`;
}

// Helper to sanitize Env Vars (remove quotes if user added them)
function cleanEnv(val: string | undefined) {
    let v = (val || "").trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
    }
    return v;
}

export function initAdmin() {
    // 1. Singleton Check
    if (admin.apps.length > 0) {
        return admin.app();
    }

    // 2. Load & Sanitize Credentials
    const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    const clientEmail = cleanEnv(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
    const rawPrivateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").trim();

    // 3. Validation
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

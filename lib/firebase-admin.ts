import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    // 1. Remove wrapping quotes (common in Vercel)
    let cleanKey = key.trim();
    if (
        (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
        (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
    ) {
        cleanKey = cleanKey.slice(1, -1);
    }

    // 2. Handle escaped newlines
    return cleanKey.replace(/\\n/g, "\n");
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
            console.error(`❌ [FIREBASE ADMIN] MISSING KEYS: ${missing.join(", ")}`);
            throw new Error(`Error de Configuración Vercel: Faltan las variables: ${missing.join(", ")}`);
        }
        console.warn("Missing Admin Credentials in Dev:", missing);
        return null;
    }

    const formattedKey = formatPrivateKey(rawPrivateKey);

    // DEBUG: Log key structure
    if (process.env.NODE_ENV === "production") {
        const lines = formattedKey.split("\n");
        console.log(`🔑 [FIREBASE ADMIN] Key Processed. Total Lines: ${lines.length}`);
        console.log(`   - Header: ${lines[0]}`);
        console.log(`   - Footer: ${lines[lines.length - 1]}`);
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
        console.error("❌ [FIREBASE ADMIN] Key Parsing Failed!");
        console.error("   - Error:", error.message);
        throw new Error(`Error procesando la Clave Privada (Private Key). Revisa el formato en Vercel.`);
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

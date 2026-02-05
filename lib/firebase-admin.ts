import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    // 1. Remove wrapping quotes
    let cleanKey = key.trim();
    while (
        (cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
        (cleanKey.startsWith("'") && cleanKey.endsWith("'"))
    ) {
        cleanKey = cleanKey.slice(1, -1).trim();
    }

    // 2. Handle escaped newlines
    cleanKey = cleanKey.replace(/\\n/g, "\n");

    // 3. PEM Reconstruction (Aggressive fix for formatting issues)
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    if (cleanKey.includes(header) && cleanKey.includes(footer)) {
        // Extract body, kill all whitespace/newlines, re-wrap cleanly
        const body = cleanKey
            .replace(header, "")
            .replace(footer, "")
            .replace(/\s/g, "");

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
            console.error(`❌ [FIREBASE ADMIN] MISSING KEYS: ${missing.join(", ")}`);
            throw new Error(`Error de Configuración Vercel: Faltan las variables: ${missing.join(", ")}`);
        }
        console.warn("Missing Admin Credentials in Dev:", missing);
        return null;
    }

    const formattedKey = formatPrivateKey(rawPrivateKey);

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
        console.error("   - Start Check:", formattedKey.substring(0, 30));
        throw new Error(`Error procesando la Clave Privada (Private Key) de Firebase. Asegúrate de haberla copiado completa y sin comillas extra.`);
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

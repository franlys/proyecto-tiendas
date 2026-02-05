import "server-only";
import * as admin from "firebase-admin";

interface FirebaseAdminConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

function formatPrivateKey(key: string) {
    return key.replace(/\\n/g, "\n");
}

export function initAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
    const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "").trim();
    let privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").trim();

    // Remove wrapping quotes common in Vercel copy-paste
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }


    const missing = [];
    if (!projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");

    if (missing.length > 0) {
        // En producción es crítico
        if (process.env.NODE_ENV === "production") {
            // Log obfuscated values for debugging before throwing
            console.error(`❌ [FIREBASE ADMIN] MISSING KEYS: ${missing.join(", ")}`);
            console.error(`   - Received Project: ${projectId ? "OK" : "MISSING"}`);
            console.error(`   - Received Email: ${clientEmail ? "OK" : "MISSING"}`);
            console.error(`   - Received Key: ${privateKey ? "OK (Length: " + privateKey.length + ")" : "MISSING"}`);

            throw new Error(`Error de Configuración Vercel: Faltan las variables: ${missing.join(", ")}`);
        }
        console.warn("Missing Admin Credentials in Dev:", missing);
        return null;
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: formatPrivateKey(privateKey),
        }),
    });
}

export const adminAuth = () => {
    const app = initAdmin();
    return app ? app.auth() : null;
};

export const adminDb = () => {
    const app = initAdmin();
    return app ? app.firestore() : null;
};

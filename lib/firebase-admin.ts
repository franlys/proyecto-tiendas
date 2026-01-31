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

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        // In development/build, we might not have these, but they are required for runtime
        if (process.env.NODE_ENV === "production") {
            throw new Error("Missing Firebase Admin credentials");
        }
        console.warn("Missing Firebase Admin credentials in dev/build");
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

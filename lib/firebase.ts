import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug / Validation
if (!firebaseConfig.apiKey) {
    console.error("❌ FIREBASE MISSING KEYS. Application will not work.");
    if (typeof window !== "undefined") {
        console.warn("⚠️ Las variables de entorno de Firebase no están cargadas. Revisa .env.local (local) o Vercel -> Settings -> Environment Variables (producción).");
    }
} else {
    console.log("✅ Firebase Config Loaded for Project:", firebaseConfig.projectId);
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Use Long Polling to avoid WebSocket timeouts/blocks
// IMPORTANT: Specify 'default' database ID because the database was created as 'default' not '(default)'
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, 'default');
const storage = getStorage(app);

export { app, auth, db, storage };

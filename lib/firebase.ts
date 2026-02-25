import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";
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

// Initialize Firebase with safety wrappers
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
} catch (error) {
    console.error("❌ CRITICAL: Failed to initialize Firebase App/Auth:", error);
    // Fallback if app fails (this shouldn't happen unless keys are totally invalid)
    if (!app) {
        app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    }
    if (app && !auth) {
        auth = getAuth(app);
    }
}

if (!app || !auth) {
    throw new Error("Firebase app or auth could not be initialized");
}

const finalApp = app as FirebaseApp;
const finalAuth = auth as Auth;


// Initialize Firestore with robust fallback
let db: Firestore;
try {
    // IMPORTANT: Specify 'default' database ID only if you explicitly created one named 'default'.
    // Standard initialization is usually sufficient for most projects.
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, 'default');
    console.log("✅ Firestore initialized with experimentalForceLongPolling");
} catch (error) {
    console.warn("⚠️ Failed to initialize Firestore with settings, falling back to standard getFirestore:", error);
    try {
        db = getFirestore(app);
        console.log("✅ Firestore initialized with standard getFirestore");
    } catch (innerError) {
        console.error("❌ CRITICAL: Failed to initialize Firestore even with fallback:", innerError);
        db = getFirestore(app);
    }
}

const storage = getStorage(finalApp);

export { finalApp as app, finalAuth as auth, db, storage };


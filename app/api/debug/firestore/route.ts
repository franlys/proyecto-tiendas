import { NextResponse } from "next/server";
import { initAdmin, adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "NOT_SET",
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? "SET (hidden)" : "NOT_SET",
      privateKeyLength: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").length,
      privateKeyStart: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").substring(0, 30),
      privateKeyEnd: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").slice(-30),
      nodeEnv: process.env.NODE_ENV,
    },
    adminSdk: {
      initialized: false,
      error: null as string | null,
    },
    firestoreTest: {
      success: false,
      error: null as string | null,
    },
  };

  // Test Admin SDK initialization
  try {
    const app = initAdmin();
    if (app) {
      diagnostics.adminSdk.initialized = true;
      diagnostics.adminSdk.appName = app.name;
      diagnostics.adminSdk.projectId = app.options.projectId;
    } else {
      diagnostics.adminSdk.error = "initAdmin returned null";
    }
  } catch (error: any) {
    diagnostics.adminSdk.error = error.message;
  }

  // Test Firestore write (only if admin initialized)
  if (diagnostics.adminSdk.initialized) {
    try {
      // Use adminDb() which explicitly specifies the 'default' database ID
      const db = adminDb();

      if (!db) {
        diagnostics.firestoreTest.error = "adminDb() returned null";
      } else {
        // Try to write a test document
        const testRef = db.collection("_diagnostics").doc("test");
        await testRef.set({
          timestamp: new Date().toISOString(),
          test: true,
        });

        // Read it back
        const doc = await testRef.get();

        if (doc.exists) {
          diagnostics.firestoreTest.success = true;
          diagnostics.firestoreTest.data = doc.data();

          // Clean up
          await testRef.delete();
        }
      }
    } catch (error: any) {
      diagnostics.firestoreTest.error = error.message;
      diagnostics.firestoreTest.code = error.code;
      diagnostics.firestoreTest.details = error.details;
    }
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

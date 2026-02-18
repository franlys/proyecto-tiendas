import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "";

    let status = "unknown";
    let error = null;
    let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
        initAdmin();
        status = "success";
    } catch (e: any) {
        status = "error";
        error = e.message;
    }

    return NextResponse.json({
        status,
        error,
        env: {
            hasKey: key.length > 0,
            keyLength: key.length,
            hasKeyJson: keyJson.length > 0,
            projectId,
            nodeEnv: process.env.NODE_ENV,
            keyStart: key.substring(0, 15),
            keyEnd: key.substring(key.length - 15)
        }
    });
}

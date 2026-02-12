
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "No DB connection" }, { status: 500 });
        }

        const snapshot = await db.collection("webhook_debug_logs")
            .orderBy("timestamp", "desc")
            .limit(30)
            .get();

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return NextResponse.json({
            count: logs.length,
            logs
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

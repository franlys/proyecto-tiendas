import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    try {
        const { consultationId } = await params;
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        const docRef = db
            .collection("shops")
            .doc(shopId)
            .collection("beautyConsultations")
            .doc(consultationId);

        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json(
                { error: "Consultation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ consultation: doc.data() });
    } catch (error) {
        console.error("Error fetching consultation:", error);
        return NextResponse.json(
            { error: "Failed to fetch consultation" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    try {
        const { consultationId } = await params;
        const data = await request.json();
        const { shopId, ...updates } = data;

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        const docRef = db
            .collection("shops")
            .doc(shopId)
            .collection("beautyConsultations")
            .doc(consultationId);

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating consultation:", error);
        return NextResponse.json(
            { error: "Failed to update consultation" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ consultationId: string }> }
) {
    try {
        const { consultationId } = await params;
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        const docRef = db
            .collection("shops")
            .doc(shopId)
            .collection("beautyConsultations")
            .doc(consultationId);

        await docRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting consultation:", error);
        return NextResponse.json(
            { error: "Failed to delete consultation" },
            { status: 500 }
        );
    }
}

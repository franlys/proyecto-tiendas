import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { BeautyConsultation } from "@/lib/types/beauty-consultation.types";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { shopId, ...consultationData } = data;

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

        // Create consultation document
        const consultationsRef = db
            .collection("shops")
            .doc(shopId)
            .collection("beautyConsultations");

        const docRef = consultationsRef.doc();

        const consultation: Partial<BeautyConsultation> = {
            ...consultationData,
            id: docRef.id,
            shopId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await docRef.set(consultation);

        // If there's a bookingId, update the booking with the consultation reference
        if (consultationData.bookingId) {
            try {
                const bookingRef = db
                    .collection("shops")
                    .doc(shopId)
                    .collection("bookings")
                    .doc(consultationData.bookingId);

                await bookingRef.update({
                    consultationId: docRef.id,
                    hasConsultation: true,
                    updatedAt: new Date().toISOString(),
                });
            } catch (e) {
                // Booking might not exist yet, that's ok
                console.log("Could not update booking with consultation reference");
            }
        }

        return NextResponse.json({
            success: true,
            consultationId: docRef.id,
            consultation,
        });
    } catch (error) {
        console.error("Error creating beauty consultation:", error);
        return NextResponse.json(
            { error: "Failed to create consultation" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");
        const bookingId = searchParams.get("bookingId");
        const consultationId = searchParams.get("consultationId");

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

        const consultationsRef = db
            .collection("shops")
            .doc(shopId)
            .collection("beautyConsultations");

        // Get single consultation by ID
        if (consultationId) {
            const doc = await consultationsRef.doc(consultationId).get();
            if (!doc.exists) {
                return NextResponse.json(
                    { error: "Consultation not found" },
                    { status: 404 }
                );
            }
            return NextResponse.json({ consultation: doc.data() });
        }

        // Get consultation by booking ID
        if (bookingId) {
            const snapshot = await consultationsRef
                .where("bookingId", "==", bookingId)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return NextResponse.json({ consultation: null });
            }

            return NextResponse.json({ consultation: snapshot.docs[0].data() });
        }

        // Get all consultations for shop
        const snapshot = await consultationsRef
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const consultations = snapshot.docs.map((doc) => doc.data());

        return NextResponse.json({ consultations });
    } catch (error) {
        console.error("Error fetching beauty consultations:", error);
        return NextResponse.json(
            { error: "Failed to fetch consultations" },
            { status: 500 }
        );
    }
}

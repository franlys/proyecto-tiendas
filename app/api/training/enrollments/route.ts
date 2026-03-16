import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, isEvolutionConfigured, getInstanceName } from "@/lib/evolution";
import { formatPhoneForWhatsApp } from "@/lib/utils";

// GET /api/training/enrollments?shopId=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const snap = await db
            .collection("shops").doc(shopId)
            .collection("trainingEnrollments")
            .orderBy("createdAt", "desc")
            .get();

        const enrollments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ enrollments });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/training/enrollments
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { shopId, ...data } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });
    if (!data.customerName || !data.customerPhone) {
        return NextResponse.json({ error: "customerName and customerPhone are required" }, { status: 400 });
    }
    if (!data.packageId || !data.preferredDays?.length || !data.startDate || !data.preferredTime) {
        return NextResponse.json(
            { error: "packageId, preferredDays, startDate, and preferredTime are required" },
            { status: 400 }
        );
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const now = new Date().toISOString();
        const enrollment = { ...data, shopId, status: "pending", createdAt: now, updatedAt: now };
        const ref = await db.collection("shops").doc(shopId).collection("trainingEnrollments").add(enrollment);

        // Send automatic WhatsApp confirmation if Evolution API is configured
        if (isEvolutionConfigured() && data.customerPhone) {
            try {
                const shopDoc = await db.collection("shops").doc(shopId).get();
                const shopSlug = shopDoc.exists ? (shopDoc.data()?.slug || shopId) : shopId;
                const instanceName = getInstanceName(shopSlug);
                const formattedPhone = formatPhoneForWhatsApp(data.customerPhone);
                const packageName = data.packageName || "entrenamiento";
                const message = `Hola ${data.customerName} 👋\n\n📋 Hemos recibido tu inscripción al plan *${packageName}*.\n\nEn breve nos ponemos en contacto contigo para confirmar los detalles.\n\n¡Gracias por tu interés! 💪`;
                await sendTextMessage(instanceName, formattedPhone, message);
            } catch (waError) {
                // Don't fail the enrollment if WhatsApp fails
                console.error("[Enrollments] WhatsApp notification error:", waError);
            }
        }

        return NextResponse.json({ enrollment: { id: ref.id, ...enrollment } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

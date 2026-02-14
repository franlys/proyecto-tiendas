import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

type AudienceSegment = "all" | "wholesale" | "inactive" | "birthday" | "new" | "vip";

/**
 * GET /api/marketing/audience
 * Get phone numbers based on audience segment
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");
        const segment = (searchParams.get("segment") || "all") as AudienceSegment;
        const countOnly = searchParams.get("countOnly") === "true";

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        const customersRef = db.collection("shops").doc(shopId).collection("customers");
        let query: FirebaseFirestore.Query = customersRef;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Apply filters based on segment
        switch (segment) {
            case "wholesale":
                query = query.where("tags", "array-contains", "wholesale");
                break;

            case "inactive":
                // Customers without orders in last 30 days
                query = query.where("lastOrderAt", "<", thirtyDaysAgo);
                break;

            case "new":
                // Customers registered in the last 7 days
                query = query.where("createdAt", ">=", sevenDaysAgo);
                break;

            case "vip":
                // VIP tag or high total spent
                query = query.where("tags", "array-contains", "vip");
                break;

            case "birthday":
                // Note: Would need birthMonth field on customers
                // For now just return all with registrationState completed
                query = query.where("registrationState", "==", "completed");
                break;

            case "all":
            default:
                // Return all customers with valid phone
                break;
        }

        const snapshot = await query.get();

        // Filter out customers without valid phone numbers
        const customers = snapshot.docs
            .map(doc => doc.data())
            .filter(c => c.phone && c.phone.length >= 10);

        if (countOnly) {
            return NextResponse.json({
                count: customers.length,
                segment,
            });
        }

        // Return phone numbers only
        const phones = customers.map(c => c.phone);

        return NextResponse.json({
            phones,
            count: phones.length,
            segment,
        });

    } catch (error: any) {
        console.error("[Marketing] Audience error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch audience" },
            { status: 500 }
        );
    }
}

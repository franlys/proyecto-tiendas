/**
 * Admin API to set shop templateType
 * POST /api/admin/set-template
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shopId, templateType } = body;

        if (!shopId || !templateType) {
            return NextResponse.json(
                { error: "shopId and templateType are required" },
                { status: 400 }
            );
        }

        // Validate templateType
        const validTemplates = ["standard", "premium-drop-v1", "street-drop-v1"];
        if (!validTemplates.includes(templateType)) {
            return NextResponse.json(
                { error: `Invalid templateType. Must be one of: ${validTemplates.join(", ")}` },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database connection error" },
                { status: 500 }
            );
        }

        // Update the shop
        await db.collection("shops").doc(shopId).update({
            templateType,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: `Template updated to ${templateType} for shop ${shopId}`,
        });
    } catch (error) {
        console.error("Set template error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

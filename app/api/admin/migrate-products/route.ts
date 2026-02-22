import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Migration endpoint to find orphaned products stored under document IDs
 * instead of slugs and migrate them to the correct path.
 *
 * GET: List all shops and their products subcollections
 * POST: Migrate products from source shop document to target slug
 */

export async function GET(request: NextRequest) {
    const db = adminDb();
    if (!db) {
        return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    try {
        // Get all shop documents
        const shopsSnapshot = await db.collection("shops").get();

        const shopData = await Promise.all(
            shopsSnapshot.docs.map(async (shopDoc) => {
                const data = shopDoc.data();

                // Count products in this shop's subcollection
                const productsSnapshot = await db
                    .collection("shops")
                    .doc(shopDoc.id)
                    .collection("products")
                    .get();

                // Count services in this shop's subcollection
                const servicesSnapshot = await db
                    .collection("shops")
                    .doc(shopDoc.id)
                    .collection("services")
                    .get();

                return {
                    documentId: shopDoc.id,
                    slug: data.slug || "NO_SLUG",
                    name: data.name || "Unknown",
                    productsCount: productsSnapshot.size,
                    servicesCount: servicesSnapshot.size,
                    // Flag if the document ID matches the slug (correct) or not (needs migration)
                    needsMigration: data.slug && shopDoc.id !== data.slug && productsSnapshot.size > 0,
                };
            })
        );

        // Group by those that need migration
        const needsMigration = shopData.filter(s => s.needsMigration);
        const correct = shopData.filter(s => !s.needsMigration);

        return NextResponse.json({
            summary: {
                totalShops: shopData.length,
                needsMigrationCount: needsMigration.length,
                correctCount: correct.length,
            },
            needsMigration,
            correct,
        });
    } catch (error) {
        console.error("Error scanning shops:", error);
        return NextResponse.json({
            error: "Failed to scan shops",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const db = adminDb();
    if (!db) {
        return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { sourceDocId, targetSlug, dryRun = true } = body;

        if (!sourceDocId || !targetSlug) {
            return NextResponse.json({
                error: "Missing required fields: sourceDocId, targetSlug"
            }, { status: 400 });
        }

        // Get products from source document
        const sourceProductsRef = db
            .collection("shops")
            .doc(sourceDocId)
            .collection("products");

        const sourceProductsSnapshot = await sourceProductsRef.get();

        if (sourceProductsSnapshot.empty) {
            return NextResponse.json({
                message: "No products found in source location",
                sourceDocId,
            });
        }

        const products = sourceProductsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        if (dryRun) {
            return NextResponse.json({
                message: "DRY RUN - Products that would be migrated:",
                sourceDocId,
                targetSlug,
                productsCount: products.length,
                products: products.map(p => ({ id: p.id, name: (p as any).name })),
            });
        }

        // Perform actual migration
        const batch = db.batch();
        const targetProductsRef = db
            .collection("shops")
            .doc(targetSlug)
            .collection("products");

        let migratedCount = 0;

        for (const product of sourceProductsSnapshot.docs) {
            const data = product.data();

            // Create in target location
            const newDocRef = targetProductsRef.doc(product.id);
            batch.set(newDocRef, data);

            // Delete from source location
            batch.delete(product.ref);

            migratedCount++;
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: `Migrated ${migratedCount} products from ${sourceDocId} to ${targetSlug}`,
            migratedCount,
        });

    } catch (error) {
        console.error("Error during migration:", error);
        return NextResponse.json({
            error: "Migration failed",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

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

        // 1. Check ROOT products collection (alternative architecture)
        let rootProducts: any[] = [];
        try {
            const rootProductsSnapshot = await db.collection("products").get();
            rootProducts = rootProductsSnapshot.docs.map(d => ({
                id: d.id,
                name: d.data().name,
                category: d.data().category,
                shopId: d.data().shopId,
            }));
        } catch (e) {
            // Root products collection doesn't exist
        }

        // 2. Check all possible subcollection paths under ALL documents in shops collection
        // This includes virtual documents (documents that don't exist but have subcollections)
        const allShopPaths = new Set<string>();

        // Add all real shop document IDs
        shopsSnapshot.docs.forEach(doc => {
            allShopPaths.add(doc.id);
            const slug = doc.data().slug;
            if (slug) allShopPaths.add(slug);
        });

        // Also check for common slug patterns that might have been used
        const knownSlugs = ["miosotis-nails", "sweet-cravings", "surprise-gifts"];
        knownSlugs.forEach(slug => allShopPaths.add(slug));

        // Check each path for products/services
        const pathResults = await Promise.all(
            Array.from(allShopPaths).map(async (path) => {
                let products: any[] = [];
                let services: any[] = [];

                try {
                    const productsSnap = await db.collection("shops").doc(path).collection("products").get();
                    products = productsSnap.docs.map(d => ({
                        id: d.id,
                        name: d.data().name,
                        category: d.data().category,
                        price: d.data().price,
                    }));
                } catch (e) { /* ignore */ }

                try {
                    const servicesSnap = await db.collection("shops").doc(path).collection("services").get();
                    services = servicesSnap.docs.map(d => ({
                        id: d.id,
                        name: d.data().name,
                    }));
                } catch (e) { /* ignore */ }

                return {
                    path,
                    productsCount: products.length,
                    servicesCount: services.length,
                    products,
                    services,
                };
            })
        );

        // Filter to only show paths that have data
        const pathsWithData = pathResults.filter(p => p.productsCount > 0 || p.servicesCount > 0);

        // Summary
        const totalProducts = pathResults.reduce((acc, p) => acc + p.productsCount, 0) + rootProducts.length;
        const totalServices = pathResults.reduce((acc, p) => acc + p.servicesCount, 0);

        return NextResponse.json({
            summary: {
                totalShops: shopsSnapshot.size,
                totalProducts,
                totalServices,
                pathsChecked: allShopPaths.size,
            },
            // Root level products (if any)
            rootProducts: rootProducts.length > 0 ? rootProducts : undefined,
            // Paths that have data
            pathsWithData,
            // All shop documents for reference
            shopDocuments: shopsSnapshot.docs.map(d => ({
                documentId: d.id,
                slug: d.data().slug,
                name: d.data().name,
            })),
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

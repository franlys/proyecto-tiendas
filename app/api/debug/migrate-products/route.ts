/**
 * API endpoint para diagnosticar y migrar productos
 *
 * El problema: Los productos pueden estar guardados en:
 * - shops/{slug}/products (ruta antigua)
 * - shops/{id}/products (ruta actual)
 *
 * Este endpoint:
 * - GET: Diagnostica dónde están los productos de cada tienda
 * - POST: Migra productos de la ruta slug a la ruta id
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface ShopDiagnosis {
    shopId: string;
    shopSlug: string;
    shopName: string;
    idEqualsSlug: boolean;
    productsAtIdPath: number;
    productsAtSlugPath: number;
    servicesAtIdPath: number;
    servicesAtSlugPath: number;
    bookingServicesAtIdPath: number;
    bookingServicesAtSlugPath: number;
    needsMigration: boolean;
    migrationDetails: string;
}

/**
 * GET - Diagnose product/service locations for all shops
 */
export async function GET() {
    try {
        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const shopsSnapshot = await db.collection("shops").get();
        const diagnoses: ShopDiagnosis[] = [];

        for (const doc of shopsSnapshot.docs) {
            const data = doc.data();
            const shopId = doc.id;
            const shopSlug = data.slug || shopId;
            const shopName = data.name || shopId;

            const diagnosis: ShopDiagnosis = {
                shopId,
                shopSlug,
                shopName,
                idEqualsSlug: shopId === shopSlug,
                productsAtIdPath: 0,
                productsAtSlugPath: 0,
                servicesAtIdPath: 0,
                servicesAtSlugPath: 0,
                bookingServicesAtIdPath: 0,
                bookingServicesAtSlugPath: 0,
                needsMigration: false,
                migrationDetails: "",
            };

            // Check products at ID path
            const productsIdSnap = await db.collection("shops").doc(shopId).collection("products").count().get();
            diagnosis.productsAtIdPath = productsIdSnap.data().count;

            // Check products at SLUG path (if different from ID)
            if (shopId !== shopSlug) {
                const productsSlugSnap = await db.collection("shops").doc(shopSlug).collection("products").count().get();
                diagnosis.productsAtSlugPath = productsSlugSnap.data().count;
            }

            // Check services at ID path
            const servicesIdSnap = await db.collection("shops").doc(shopId).collection("services").count().get();
            diagnosis.servicesAtIdPath = servicesIdSnap.data().count;

            // Check services at SLUG path
            if (shopId !== shopSlug) {
                const servicesSlugSnap = await db.collection("shops").doc(shopSlug).collection("services").count().get();
                diagnosis.servicesAtSlugPath = servicesSlugSnap.data().count;
            }

            // Check bookingServices at ID path
            const bookingIdSnap = await db.collection("shops").doc(shopId).collection("bookingServices").count().get();
            diagnosis.bookingServicesAtIdPath = bookingIdSnap.data().count;

            // Check bookingServices at SLUG path
            if (shopId !== shopSlug) {
                const bookingSlugSnap = await db.collection("shops").doc(shopSlug).collection("bookingServices").count().get();
                diagnosis.bookingServicesAtSlugPath = bookingSlugSnap.data().count;
            }

            // Determine if migration is needed
            const migrationNeeded: string[] = [];
            if (diagnosis.productsAtSlugPath > 0 && shopId !== shopSlug) {
                migrationNeeded.push(`${diagnosis.productsAtSlugPath} productos en ruta slug`);
            }
            if (diagnosis.servicesAtSlugPath > 0 && shopId !== shopSlug) {
                migrationNeeded.push(`${diagnosis.servicesAtSlugPath} servicios en ruta slug`);
            }
            if (diagnosis.bookingServicesAtSlugPath > 0 && shopId !== shopSlug) {
                migrationNeeded.push(`${diagnosis.bookingServicesAtSlugPath} bookingServices en ruta slug`);
            }

            diagnosis.needsMigration = migrationNeeded.length > 0;
            diagnosis.migrationDetails = migrationNeeded.length > 0
                ? migrationNeeded.join(", ")
                : "No migration needed";

            diagnoses.push(diagnosis);
        }

        const summary = {
            totalShops: diagnoses.length,
            shopsWithIdEqualSlug: diagnoses.filter(d => d.idEqualsSlug).length,
            shopsWithDifferentIdSlug: diagnoses.filter(d => !d.idEqualsSlug).length,
            shopsNeedingMigration: diagnoses.filter(d => d.needsMigration).length,
            totalProductsAtIdPath: diagnoses.reduce((acc, d) => acc + d.productsAtIdPath, 0),
            totalProductsAtSlugPath: diagnoses.reduce((acc, d) => acc + d.productsAtSlugPath, 0),
        };

        return NextResponse.json({
            success: true,
            summary,
            diagnoses,
            note: "Use POST to this endpoint to migrate products from slug paths to id paths"
        });
    } catch (error: any) {
        console.error("Error diagnosing shops:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST - Migrate products/services from slug paths to id paths
 */
export async function POST(request: NextRequest) {
    try {
        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const { shopIds, dryRun = true } = body;

        const shopsSnapshot = await db.collection("shops").get();
        const results: any[] = [];

        for (const doc of shopsSnapshot.docs) {
            const data = doc.data();
            const shopId = doc.id;
            const shopSlug = data.slug || shopId;
            const shopName = data.name || shopId;

            // Skip if explicitly filtering by shopIds
            if (shopIds && !shopIds.includes(shopId) && !shopIds.includes(shopSlug)) {
                continue;
            }

            // Skip if id equals slug (no migration needed)
            if (shopId === shopSlug) {
                results.push({
                    shopId,
                    shopSlug,
                    shopName,
                    status: "skipped",
                    reason: "ID equals slug - no migration needed"
                });
                continue;
            }

            const shopResult: any = {
                shopId,
                shopSlug,
                shopName,
                status: "success",
                migratedProducts: 0,
                migratedServices: 0,
                migratedBookingServices: 0,
                actions: []
            };

            try {
                // 1. Migrate Products from slug path to id path
                const productsAtSlug = await db.collection("shops").doc(shopSlug).collection("products").get();

                for (const productDoc of productsAtSlug.docs) {
                    const productData = productDoc.data();

                    if (dryRun) {
                        shopResult.actions.push({
                            type: "product",
                            action: "would-migrate",
                            from: `shops/${shopSlug}/products/${productDoc.id}`,
                            to: `shops/${shopId}/products/${productDoc.id}`,
                            name: productData.name
                        });
                    } else {
                        // Copy to new location
                        await db.collection("shops").doc(shopId).collection("products").doc(productDoc.id).set({
                            ...productData,
                            migratedAt: FieldValue.serverTimestamp(),
                            migratedFrom: `shops/${shopSlug}/products/${productDoc.id}`
                        });

                        // Delete from old location
                        await db.collection("shops").doc(shopSlug).collection("products").doc(productDoc.id).delete();

                        shopResult.actions.push({
                            type: "product",
                            action: "migrated",
                            from: `shops/${shopSlug}/products/${productDoc.id}`,
                            to: `shops/${shopId}/products/${productDoc.id}`,
                            name: productData.name
                        });
                    }
                    shopResult.migratedProducts++;
                }

                // 2. Migrate Services from slug path to id path
                const servicesAtSlug = await db.collection("shops").doc(shopSlug).collection("services").get();

                for (const serviceDoc of servicesAtSlug.docs) {
                    const serviceData = serviceDoc.data();

                    if (dryRun) {
                        shopResult.actions.push({
                            type: "service",
                            action: "would-migrate",
                            from: `shops/${shopSlug}/services/${serviceDoc.id}`,
                            to: `shops/${shopId}/services/${serviceDoc.id}`,
                            name: serviceData.name
                        });
                    } else {
                        await db.collection("shops").doc(shopId).collection("services").doc(serviceDoc.id).set({
                            ...serviceData,
                            migratedAt: FieldValue.serverTimestamp(),
                            migratedFrom: `shops/${shopSlug}/services/${serviceDoc.id}`
                        });

                        await db.collection("shops").doc(shopSlug).collection("services").doc(serviceDoc.id).delete();

                        shopResult.actions.push({
                            type: "service",
                            action: "migrated",
                            from: `shops/${shopSlug}/services/${serviceDoc.id}`,
                            to: `shops/${shopId}/services/${serviceDoc.id}`,
                            name: serviceData.name
                        });
                    }
                    shopResult.migratedServices++;
                }

                // 3. Migrate BookingServices from slug path to id path
                const bookingAtSlug = await db.collection("shops").doc(shopSlug).collection("bookingServices").get();

                for (const bookingDoc of bookingAtSlug.docs) {
                    const bookingData = bookingDoc.data();

                    if (dryRun) {
                        shopResult.actions.push({
                            type: "bookingService",
                            action: "would-migrate",
                            from: `shops/${shopSlug}/bookingServices/${bookingDoc.id}`,
                            to: `shops/${shopId}/bookingServices/${bookingDoc.id}`,
                            name: bookingData.name
                        });
                    } else {
                        await db.collection("shops").doc(shopId).collection("bookingServices").doc(bookingDoc.id).set({
                            ...bookingData,
                            migratedAt: FieldValue.serverTimestamp(),
                            migratedFrom: `shops/${shopSlug}/bookingServices/${bookingDoc.id}`
                        });

                        await db.collection("shops").doc(shopSlug).collection("bookingServices").doc(bookingDoc.id).delete();

                        shopResult.actions.push({
                            type: "bookingService",
                            action: "migrated",
                            from: `shops/${shopSlug}/bookingServices/${bookingDoc.id}`,
                            to: `shops/${shopId}/bookingServices/${bookingDoc.id}`,
                            name: bookingData.name
                        });
                    }
                    shopResult.migratedBookingServices++;
                }

            } catch (shopError: any) {
                shopResult.status = "error";
                shopResult.error = shopError.message;
            }

            results.push(shopResult);
        }

        const summary = {
            mode: dryRun ? "DRY RUN (no changes made)" : "MIGRATION EXECUTED",
            totalShopsProcessed: results.length,
            shopsWithMigrations: results.filter(r => r.migratedProducts > 0 || r.migratedServices > 0 || r.migratedBookingServices > 0).length,
            totalProductsMigrated: results.reduce((acc, r) => acc + (r.migratedProducts || 0), 0),
            totalServicesMigrated: results.reduce((acc, r) => acc + (r.migratedServices || 0), 0),
            totalBookingServicesMigrated: results.reduce((acc, r) => acc + (r.migratedBookingServices || 0), 0),
            errors: results.filter(r => r.status === "error").length,
        };

        return NextResponse.json({
            success: true,
            summary,
            results,
            nextStep: dryRun
                ? "If results look correct, run POST again with { \"dryRun\": false } to execute migration"
                : "Migration complete! Products/services are now at correct paths"
        });
    } catch (error: any) {
        console.error("Error migrating products:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

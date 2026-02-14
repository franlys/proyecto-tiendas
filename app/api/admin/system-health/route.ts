import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isEvolutionConfigured, getEvolutionBaseUrl } from "@/lib/evolution";

interface HealthCheck {
    name: string;
    status: "ok" | "warning" | "error";
    message: string;
    details?: any;
    latency?: number;
}

interface SystemHealth {
    timestamp: string;
    overall: "healthy" | "degraded" | "critical";
    checks: HealthCheck[];
    summary: {
        total: number;
        ok: number;
        warnings: number;
        errors: number;
    };
}

/**
 * GET /api/admin/system-health
 *
 * System health check endpoint for Super Admin
 * Returns status of all critical systems
 */
export async function GET(request: NextRequest) {
    const checks: HealthCheck[] = [];

    // 1. Check Environment Variables
    const envCheck = checkEnvironmentVariables();
    checks.push(envCheck);

    // 2. Check Firestore Connection
    const firestoreCheck = await checkFirestoreConnection();
    checks.push(firestoreCheck);

    // 3. Check Evolution API (WhatsApp)
    const evolutionCheck = await checkEvolutionAPI();
    checks.push(evolutionCheck);

    // 4. Check Firebase Storage Config
    const storageCheck = checkFirebaseStorageConfig();
    checks.push(storageCheck);

    // 5. Get Shop Statistics
    const shopStats = await getShopStatistics();
    checks.push(shopStats);

    // 6. Check Recent Orders Activity
    const ordersCheck = await checkRecentOrdersActivity();
    checks.push(ordersCheck);

    // 7. Check Cron Jobs Configuration
    const cronCheck = checkCronJobsConfig();
    checks.push(cronCheck);

    // Calculate summary
    const summary = {
        total: checks.length,
        ok: checks.filter(c => c.status === "ok").length,
        warnings: checks.filter(c => c.status === "warning").length,
        errors: checks.filter(c => c.status === "error").length,
    };

    // Determine overall status
    let overall: SystemHealth["overall"] = "healthy";
    if (summary.errors > 0) {
        overall = "critical";
    } else if (summary.warnings > 0) {
        overall = "degraded";
    }

    const health: SystemHealth = {
        timestamp: new Date().toISOString(),
        overall,
        checks,
        summary,
    };

    return NextResponse.json(health);
}

// ========== Individual Health Checks ==========

function checkEnvironmentVariables(): HealthCheck {
    const required = [
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "FIREBASE_ADMIN_CLIENT_EMAIL",
        "FIREBASE_ADMIN_PRIVATE_KEY",
    ];

    const optional = [
        "EVOLUTION_API_URL",
        "EVOLUTION_API_KEY",
        "CRON_SECRET",
    ];

    const missing: string[] = [];
    const missingOptional: string[] = [];

    required.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    optional.forEach(key => {
        if (!process.env[key]) {
            missingOptional.push(key);
        }
    });

    if (missing.length > 0) {
        return {
            name: "Environment Variables",
            status: "error",
            message: `Missing required: ${missing.join(", ")}`,
            details: { missing, missingOptional },
        };
    }

    if (missingOptional.length > 0) {
        return {
            name: "Environment Variables",
            status: "warning",
            message: `All required present. Missing optional: ${missingOptional.join(", ")}`,
            details: { missing: [], missingOptional },
        };
    }

    return {
        name: "Environment Variables",
        status: "ok",
        message: "All environment variables configured",
        details: { required: required.length, optional: optional.length },
    };
}

async function checkFirestoreConnection(): Promise<HealthCheck> {
    const start = Date.now();

    try {
        const db = adminDb();
        if (!db) {
            return {
                name: "Firestore Database",
                status: "error",
                message: "Failed to initialize Admin SDK",
            };
        }

        // Try to read a simple document
        const testRef = db.collection("_health_check").doc("test");
        await testRef.set({ lastCheck: new Date().toISOString() }, { merge: true });
        const doc = await testRef.get();

        const latency = Date.now() - start;

        if (doc.exists) {
            return {
                name: "Firestore Database",
                status: latency > 2000 ? "warning" : "ok",
                message: latency > 2000 ? `Connected but slow (${latency}ms)` : "Connected successfully",
                latency,
                details: {
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    databaseId: "default",
                },
            };
        }

        return {
            name: "Firestore Database",
            status: "warning",
            message: "Connected but health check document not found",
            latency,
        };
    } catch (error: any) {
        return {
            name: "Firestore Database",
            status: "error",
            message: error.message || "Connection failed",
            latency: Date.now() - start,
            details: { error: error.code || error.name },
        };
    }
}

async function checkEvolutionAPI(): Promise<HealthCheck> {
    if (!isEvolutionConfigured()) {
        return {
            name: "Evolution API (WhatsApp)",
            status: "warning",
            message: "Not configured - WhatsApp features disabled",
            details: {
                configured: false,
                hasUrl: !!process.env.EVOLUTION_API_URL,
                hasKey: !!process.env.EVOLUTION_API_KEY,
            },
        };
    }

    const start = Date.now();

    try {
        const baseUrl = getEvolutionBaseUrl();
        const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
            method: "GET",
            headers: {
                "apikey": process.env.EVOLUTION_API_KEY || "",
            },
        });

        const latency = Date.now() - start;

        if (response.ok) {
            const instances = await response.json();
            const activeInstances = Array.isArray(instances)
                ? instances.filter((i: any) => i.instance?.state === "open").length
                : 0;

            return {
                name: "Evolution API (WhatsApp)",
                status: "ok",
                message: `Connected - ${activeInstances} active instance(s)`,
                latency,
                details: {
                    configured: true,
                    totalInstances: Array.isArray(instances) ? instances.length : 0,
                    activeInstances,
                },
            };
        }

        return {
            name: "Evolution API (WhatsApp)",
            status: "error",
            message: `API returned ${response.status}`,
            latency,
        };
    } catch (error: any) {
        return {
            name: "Evolution API (WhatsApp)",
            status: "error",
            message: error.message || "Connection failed",
            latency: Date.now() - start,
        };
    }
}

function checkFirebaseStorageConfig(): HealthCheck {
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!storageBucket) {
        return {
            name: "Firebase Storage",
            status: "warning",
            message: "Storage bucket not configured - Image uploads may fail",
        };
    }

    return {
        name: "Firebase Storage",
        status: "ok",
        message: "Storage bucket configured",
        details: { bucket: storageBucket },
    };
}

async function getShopStatistics(): Promise<HealthCheck> {
    try {
        const db = adminDb();
        if (!db) {
            return {
                name: "Shop Statistics",
                status: "error",
                message: "Cannot connect to database",
            };
        }

        const shopsSnapshot = await db.collection("shops").get();
        const totalShops = shopsSnapshot.size;

        // Count shops with various features
        let withWhatsApp = 0;
        let withProducts = 0;
        let withBookings = 0;

        shopsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.contact?.phone) withWhatsApp++;
            if (data.features?.products || data.enabledFeatures?.products) withProducts++;
            if (data.features?.bookings || data.enabledFeatures?.bookings) withBookings++;
        });

        return {
            name: "Shop Statistics",
            status: totalShops > 0 ? "ok" : "warning",
            message: totalShops > 0 ? `${totalShops} shop(s) registered` : "No shops registered yet",
            details: {
                totalShops,
                withWhatsApp,
                withProducts,
                withBookings,
            },
        };
    } catch (error: any) {
        return {
            name: "Shop Statistics",
            status: "error",
            message: error.message || "Failed to get statistics",
        };
    }
}

async function checkRecentOrdersActivity(): Promise<HealthCheck> {
    try {
        const db = adminDb();
        if (!db) {
            return {
                name: "Orders Activity",
                status: "error",
                message: "Cannot connect to database",
            };
        }

        // Get orders from last 24 hours
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        // Check across all shops (we need to query each shop's orders subcollection)
        const shopsSnapshot = await db.collection("shops").limit(10).get();

        let totalOrders24h = 0;
        let pendingOrders = 0;

        for (const shopDoc of shopsSnapshot.docs) {
            try {
                const ordersSnapshot = await db
                    .collection("shops")
                    .doc(shopDoc.id)
                    .collection("orders")
                    .where("createdAt", ">=", yesterday)
                    .get();

                totalOrders24h += ordersSnapshot.size;

                ordersSnapshot.docs.forEach(doc => {
                    if (doc.data().status === "pending") {
                        pendingOrders++;
                    }
                });
            } catch {
                // Shop might not have orders collection
            }
        }

        return {
            name: "Orders Activity",
            status: "ok",
            message: `${totalOrders24h} order(s) in last 24h`,
            details: {
                last24Hours: totalOrders24h,
                pending: pendingOrders,
            },
        };
    } catch (error: any) {
        return {
            name: "Orders Activity",
            status: "warning",
            message: "Could not retrieve order statistics",
        };
    }
}

function checkCronJobsConfig(): HealthCheck {
    // Check if CRON_SECRET is set (required for secure cron endpoints)
    const hasCronSecret = !!process.env.CRON_SECRET;

    if (!hasCronSecret) {
        return {
            name: "Cron Jobs",
            status: "warning",
            message: "CRON_SECRET not set - Cron jobs are not secured",
            details: {
                configured: false,
                jobs: [
                    "/api/cron/order-escalation",
                    "/api/cron/booking-reminders",
                ],
            },
        };
    }

    return {
        name: "Cron Jobs",
        status: "ok",
        message: "Cron jobs configured and secured",
        details: {
            configured: true,
            jobs: [
                "/api/cron/order-escalation",
                "/api/cron/booking-reminders",
            ],
        },
    };
}

/**
 * API endpoint para probar todas las tiendas existentes
 *
 * GET /api/debug/test-all-shops - Lista todas las tiendas
 * POST /api/debug/test-all-shops - Ejecuta las pruebas
 *
 * Datos del cliente de prueba:
 * - Nombre: Franlys Gonzalez Tejeda
 * - Teléfono: 809-232-8741
 * - Email: franlysgonzaleztejeda@gmail.com
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Business types that primarily use bookings
const BOOKING_BUSINESS_TYPES = [
    "beauty", "salon", "barberia", "spa", "unas", "maquillaje",
    "clinica_dental", "consultorio_medico", "optica", "laboratorio",
    "gimnasio", "estudio_yoga", "salon_eventos", "fotografia",
    "consultoria", "despacho_contable", "tutoria", "escuela_idiomas",
    "entrenador_personal"
];

// Customer data for tests
const TEST_CUSTOMER = {
    name: "Franlys Gonzalez Tejeda",
    phone: "8092328741",
    email: "franlysgonzaleztejeda@gmail.com",
    address: "Calle Principal #123, Santo Domingo"
};

interface ShopData {
    id: string;
    name: string;
    slug: string;
    businessType?: string;
    businessTypes?: string[];
    isActive: boolean;
    productsCount?: number;
    servicesCount?: number;
}

/**
 * GET - List all shops with their types and counts
 */
export async function GET() {
    try {
        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const shopsSnapshot = await db.collection("shops").get();
        const shops: ShopData[] = [];

        for (const doc of shopsSnapshot.docs) {
            const data = doc.data();

            // Get counts
            const productsSnap = await db.collection("shops").doc(doc.id).collection("products").count().get();
            const servicesSnap = await db.collection("shops").doc(doc.id).collection("services").count().get();

            shops.push({
                id: doc.id,
                name: data.name || doc.id,
                slug: data.slug || doc.id,
                businessType: data.businessType,
                businessTypes: data.businessTypes,
                isActive: data.isActive !== false,
                productsCount: productsSnap.data().count,
                servicesCount: servicesSnap.data().count,
            });
        }

        return NextResponse.json({
            success: true,
            count: shops.length,
            activeCount: shops.filter(s => s.isActive).length,
            shops,
            testCustomer: TEST_CUSTOMER
        });
    } catch (error: any) {
        console.error("Error listing shops:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST - Execute tests on all active shops
 */
export async function POST(request: NextRequest) {
    try {
        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const { shopIds } = body; // Optional: specific shop IDs to test

        const shopsSnapshot = await db.collection("shops").get();
        const results: any[] = [];

        for (const doc of shopsSnapshot.docs) {
            const data = doc.data();
            const shop: ShopData = {
                id: doc.id,
                name: data.name || doc.id,
                slug: data.slug || doc.id,
                businessType: data.businessType,
                businessTypes: data.businessTypes,
                isActive: data.isActive !== false,
            };

            // Skip if not active or not in specified list
            if (!shop.isActive) {
                results.push({
                    shopId: shop.id,
                    shopName: shop.name,
                    status: "skipped",
                    reason: "Tienda inactiva"
                });
                continue;
            }

            if (shopIds && !shopIds.includes(shop.id)) {
                continue;
            }

            const shopResult: any = {
                shopId: shop.id,
                shopName: shop.name,
                businessType: shop.businessTypes?.[0] || shop.businessType || "otro",
                status: "success",
                actions: []
            };

            try {
                const primaryType = shop.businessTypes?.[0] || shop.businessType || "otro";
                const usesBookings = BOOKING_BUSINESS_TYPES.includes(primaryType);

                // 1. Add test product
                const testProduct = {
                    name: "Producto de Prueba - TEST",
                    description: "Producto de prueba creado automáticamente para verificar el sistema",
                    price: 100,
                    stock: 10,
                    category: "test",
                    image: "",
                    isActive: true,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                };

                const productRef = await db.collection("shops").doc(shop.id).collection("products").add(testProduct);
                shopResult.actions.push({
                    type: "product",
                    id: productRef.id,
                    message: "Producto de prueba creado"
                });

                // 2. Create booking or order based on business type
                if (usesBookings) {
                    // Check for existing services
                    const servicesSnap = await db.collection("shops").doc(shop.id).collection("services").limit(1).get();

                    let serviceId: string;
                    let serviceName: string;
                    let servicePrice: number;
                    let serviceDuration: number;

                    if (servicesSnap.empty) {
                        // Create test service
                        const testService = {
                            name: "Servicio de Prueba - TEST",
                            description: "Servicio de prueba creado automáticamente",
                            price: 150,
                            duration: 30,
                            category: "test",
                            isActive: true,
                            createdAt: FieldValue.serverTimestamp(),
                        };
                        const serviceRef = await db.collection("shops").doc(shop.id).collection("services").add(testService);
                        serviceId = serviceRef.id;
                        serviceName = "Servicio de Prueba - TEST";
                        servicePrice = 150;
                        serviceDuration = 30;

                        shopResult.actions.push({
                            type: "service",
                            id: serviceId,
                            message: "Servicio de prueba creado"
                        });
                    } else {
                        const existingService = servicesSnap.docs[0];
                        const serviceData = existingService.data();
                        serviceId = existingService.id;
                        serviceName = serviceData.name || "Servicio";
                        servicePrice = serviceData.price || 0;
                        serviceDuration = serviceData.duration || 60;
                    }

                    // Create booking for tomorrow
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dateStr = tomorrow.toISOString().split("T")[0];

                    const endMinutes = 10 * 60 + serviceDuration;
                    const endHour = Math.floor(endMinutes / 60);
                    const endMin = endMinutes % 60;
                    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

                    const booking = {
                        customerName: TEST_CUSTOMER.name,
                        customerPhone: TEST_CUSTOMER.phone,
                        customerEmail: TEST_CUSTOMER.email,
                        serviceId,
                        serviceName,
                        serviceDuration,
                        servicePrice,
                        date: dateStr,
                        time: "10:00",
                        endTime,
                        status: "confirmed",
                        source: "test-script",
                        createdAt: FieldValue.serverTimestamp(),
                    };

                    const bookingRef = await db.collection("shops").doc(shop.id).collection("bookings").add(booking);
                    shopResult.actions.push({
                        type: "booking",
                        id: bookingRef.id,
                        date: dateStr,
                        time: "10:00",
                        service: serviceName,
                        message: "Cita de prueba creada"
                    });
                }

                // Always create an order (most business types can have orders)
                // Get next order number
                const counterRef = db.collection("shops").doc(shop.id).collection("counters").doc("orders");
                const counterSnap = await counterRef.get();
                let nextNumber = 1;

                if (counterSnap.exists) {
                    nextNumber = (counterSnap.data()?.current || 0) + 1;
                }

                await counterRef.set({ current: nextNumber }, { merge: true });

                const prefix = shop.slug.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
                const orderNumber = `${prefix}-${String(nextNumber).padStart(4, "0")}`;

                const order = {
                    orderNumber,
                    customerName: TEST_CUSTOMER.name,
                    customerPhone: TEST_CUSTOMER.phone,
                    customerEmail: TEST_CUSTOMER.email,
                    customerAddress: TEST_CUSTOMER.address,
                    items: [{
                        productId: productRef.id,
                        productName: "Producto de Prueba - TEST",
                        quantity: 1,
                        unitPrice: 100,
                        total: 100,
                        notes: ""
                    }],
                    subtotal: 100,
                    tax: 0,
                    total: 100,
                    status: "pending",
                    paymentStatus: "pending",
                    deliveryType: "entrega",
                    source: "test-script",
                    createdAt: FieldValue.serverTimestamp(),
                };

                const orderRef = await db.collection("shops").doc(shop.id).collection("orders").add(order);
                shopResult.actions.push({
                    type: "order",
                    id: orderRef.id,
                    orderNumber,
                    message: "Pedido de prueba creado"
                });

            } catch (shopError: any) {
                shopResult.status = "error";
                shopResult.error = shopError.message;
            }

            results.push(shopResult);
        }

        const successful = results.filter(r => r.status === "success").length;
        const failed = results.filter(r => r.status === "error").length;
        const skipped = results.filter(r => r.status === "skipped").length;

        return NextResponse.json({
            success: true,
            summary: {
                total: results.length,
                successful,
                failed,
                skipped
            },
            testCustomer: TEST_CUSTOMER,
            results
        });
    } catch (error: any) {
        console.error("Error running tests:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

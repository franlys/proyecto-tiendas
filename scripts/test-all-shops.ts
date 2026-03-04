/**
 * Script para probar todas las tiendas existentes
 * - Lista todas las tiendas
 * - Agrega un producto de prueba a cada una
 * - Crea un pedido o cita según el tipo de negocio
 *
 * Datos del cliente de prueba:
 * - Nombre: Franlys Gonzalez Tejeda
 * - Teléfono: 809-232-8741
 * - Email: franlysgonzaleztejeda@gmail.com
 *
 * Ejecutar: npx tsx scripts/test-all-shops.ts
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Initialize Firebase Admin
function initAdmin() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        console.error("❌ Missing Firebase Admin credentials");
        process.exit(1);
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
    });
}

// Business types that use bookings vs orders
const BOOKING_BUSINESS_TYPES = [
    "beauty", "salon", "barberia", "spa", "unas", "maquillaje",
    "clinica_dental", "consultorio_medico", "optica", "laboratorio",
    "gimnasio", "estudio_yoga", "salon_eventos", "fotografia",
    "consultoria", "despacho_contable", "tutoria", "escuela_idiomas",
    "entrenador_personal"
];

const ORDER_BUSINESS_TYPES = [
    "retail", "tienda_ropa", "tienda_celulares", "papeleria", "ferreteria",
    "joyeria", "floreria", "jugueteria", "sex_shop", "farmacia",
    "restaurante", "cafeteria", "bar", "pasteleria", "food_truck", "meal_prep",
    "muebleria", "electrodomesticos", "refaccionaria", "taller_mecanico"
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
}

async function main() {
    console.log("🚀 Iniciando pruebas de todas las tiendas...\n");

    const app = initAdmin();
    // Use 'default' database ID (not '(default)')
    const db = admin.firestore(app);
    db.settings({ databaseId: "default" });

    // 1. Get all shops
    console.log("📋 Obteniendo lista de tiendas...\n");
    const shopsSnapshot = await db.collection("shops").get();

    const shops: ShopData[] = [];
    shopsSnapshot.forEach(doc => {
        const data = doc.data();
        shops.push({
            id: doc.id,
            name: data.name || doc.id,
            slug: data.slug || doc.id,
            businessType: data.businessType,
            businessTypes: data.businessTypes,
            isActive: data.isActive !== false
        });
    });

    console.log(`✅ Encontradas ${shops.length} tiendas:\n`);

    // Display all shops
    for (const shop of shops) {
        const types = shop.businessTypes?.join(", ") || shop.businessType || "otro";
        const status = shop.isActive ? "🟢 Activa" : "🔴 Inactiva";
        console.log(`  ${status} ${shop.name} (${shop.slug})`);
        console.log(`     Tipo(s): ${types}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // 2. For each active shop, add product and create order/booking
    for (const shop of shops.filter(s => s.isActive)) {
        console.log(`\n🏪 Procesando: ${shop.name} (${shop.slug})`);
        console.log("-".repeat(40));

        const primaryType = shop.businessTypes?.[0] || shop.businessType || "otro";

        // Determine if it's a booking or order business
        const usesBookings = BOOKING_BUSINESS_TYPES.includes(primaryType);
        const usesOrders = ORDER_BUSINESS_TYPES.includes(primaryType) || !usesBookings;

        // 2a. Add test product
        const testProduct = {
            name: "Producto de Prueba - TEST",
            description: "Este es un producto de prueba creado automáticamente",
            price: 100,
            stock: 10,
            category: "test",
            image: "",
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const productRef = await db.collection("shops").doc(shop.id).collection("products").add(testProduct);
        console.log(`  ✅ Producto de prueba creado: ${productRef.id}`);

        // 2b. Create order or booking
        if (usesBookings) {
            // Check if shop has services
            const servicesSnapshot = await db.collection("shops").doc(shop.id).collection("services").limit(1).get();

            if (servicesSnapshot.empty) {
                // Create a test service first
                const testService = {
                    name: "Servicio de Prueba - TEST",
                    description: "Servicio de prueba creado automáticamente",
                    price: 150,
                    duration: 30,
                    category: "test",
                    isActive: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                const serviceRef = await db.collection("shops").doc(shop.id).collection("services").add(testService);
                console.log(`  ✅ Servicio de prueba creado: ${serviceRef.id}`);

                // Create booking with test service
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split("T")[0];

                const booking = {
                    customerName: TEST_CUSTOMER.name,
                    customerPhone: TEST_CUSTOMER.phone,
                    customerEmail: TEST_CUSTOMER.email,
                    serviceId: serviceRef.id,
                    serviceName: "Servicio de Prueba - TEST",
                    serviceDuration: 30,
                    servicePrice: 150,
                    date: dateStr,
                    time: "10:00",
                    endTime: "10:30",
                    status: "confirmed",
                    source: "test-script",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                const bookingRef = await db.collection("shops").doc(shop.id).collection("bookings").add(booking);
                console.log(`  ✅ Cita de prueba creada: ${bookingRef.id} para ${dateStr} 10:00`);
            } else {
                // Use existing service
                const existingService = servicesSnapshot.docs[0];
                const serviceData = existingService.data();

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateStr = tomorrow.toISOString().split("T")[0];

                const booking = {
                    customerName: TEST_CUSTOMER.name,
                    customerPhone: TEST_CUSTOMER.phone,
                    customerEmail: TEST_CUSTOMER.email,
                    serviceId: existingService.id,
                    serviceName: serviceData.name || "Servicio",
                    serviceDuration: serviceData.duration || 60,
                    servicePrice: serviceData.price || 0,
                    date: dateStr,
                    time: "14:00",
                    endTime: "15:00",
                    status: "confirmed",
                    source: "test-script",
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                const bookingRef = await db.collection("shops").doc(shop.id).collection("bookings").add(booking);
                console.log(`  ✅ Cita de prueba creada: ${bookingRef.id} para ${dateStr} 14:00`);
                console.log(`     Servicio: ${serviceData.name}`);
            }
        }

        if (usesOrders) {
            // Get next order number
            const counterRef = db.collection("shops").doc(shop.id).collection("counters").doc("orders");
            const counterSnap = await counterRef.get();
            let nextNumber = 1;

            if (counterSnap.exists) {
                nextNumber = (counterSnap.data()?.current || 0) + 1;
            }

            await counterRef.set({ current: nextNumber }, { merge: true });

            const orderNumber = `${shop.slug.substring(0, 3).toUpperCase()}-${String(nextNumber).padStart(4, "0")}`;

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
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            const orderRef = await db.collection("shops").doc(shop.id).collection("orders").add(order);
            console.log(`  ✅ Pedido de prueba creado: ${orderRef.id}`);
            console.log(`     Número: ${orderNumber}`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n✨ ¡Pruebas completadas!");
    console.log(`\nResumen:`);
    console.log(`  - Tiendas procesadas: ${shops.filter(s => s.isActive).length}`);
    console.log(`  - Cliente de prueba: ${TEST_CUSTOMER.name}`);
    console.log(`  - Email: ${TEST_CUSTOMER.email}`);
    console.log(`  - Teléfono: ${TEST_CUSTOMER.phone}`);

    process.exit(0);
}

main().catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
});

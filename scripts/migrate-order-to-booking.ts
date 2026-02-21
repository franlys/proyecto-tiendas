/**
 * Script to migrate an appointment order to a proper booking
 * Run with: npx ts-node scripts/migrate-order-to-booking.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin
const initAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin credentials");
    process.exit(1);
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
};

async function migrateOrderToBooking() {
  const app = initAdmin();
  const db = getFirestore(app, "default");

  const shopId = "miosotis-nails";

  console.log(`\n🔍 Looking for appointment orders in ${shopId}...`);

  // Find orders with appointmentDate (these are actually bookings)
  const ordersSnap = await db.collection("shops").doc(shopId).collection("orders")
    .where("appointmentDate", "!=", null)
    .get();

  if (ordersSnap.empty) {
    console.log("No appointment orders found.");
    return;
  }

  console.log(`Found ${ordersSnap.size} appointment order(s) to migrate.\n`);

  for (const orderDoc of ordersSnap.docs) {
    const order = orderDoc.data();
    console.log(`📦 Order: ${order.orderNumber}`);
    console.log(`   Total: $${order.total}`);

    // Convert appointmentDate to ISO string
    let dateStr = "";
    if (order.appointmentDate) {
      const d = order.appointmentDate.toDate ? order.appointmentDate.toDate() : new Date(order.appointmentDate);
      dateStr = d.toISOString().split("T")[0];
      console.log(`   Date: ${dateStr}`);
    }
    console.log(`   Time: ${order.appointmentTime}`);

    // Get service names from items
    const serviceName = order.items?.map((i: any) => i.productName).join(", ") || "Servicios varios";
    console.log(`   Services: ${serviceName}`);

    // Create booking data
    const bookingData = {
      shopId,
      customerName: order.customerName || "Cliente WhatsApp",
      customerPhone: order.customerPhone || "pending",
      serviceId: "migrated-from-order",
      serviceName,
      serviceDuration: 110, // From the original: 1h 50min
      servicePrice: order.total || 0,
      date: dateStr,
      time: order.appointmentTime || "09:00",
      endTime: "",
      status: "pending",
      reminderSentAt: null,
      reminderMessageId: null,
      customerResponse: null,
      customerRespondedAt: null,
      assignedStaffId: null,
      assignedStaffName: null,
      notes: `Migrado de pedido ${order.orderNumber}\n${order.notes || ""}`,
      internalNotes: null,
      referenceCode: order.orderNumber?.replace("ORD-", "") || orderDoc.id.slice(0, 5).toUpperCase(),
      source: "migrated-from-order",
      createdAt: order.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate end time
    const [hours, mins] = bookingData.time.split(":").map(Number);
    const endMinutes = hours * 60 + mins + bookingData.serviceDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    bookingData.endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    console.log(`\n   ➡️ Creating booking for ${dateStr} at ${bookingData.time}...`);

    // Create booking
    const bookingRef = await db.collection("shops").doc(shopId).collection("bookings").add(bookingData);
    console.log(`   ✅ Booking created: ${bookingRef.id}`);

    // Delete the old order
    console.log(`   🗑️ Deleting old order ${orderDoc.id}...`);
    await orderDoc.ref.delete();
    console.log(`   ✅ Order deleted.`);
  }

  console.log("\n✅ Migration complete!");
}

migrateOrderToBooking().catch(console.error);

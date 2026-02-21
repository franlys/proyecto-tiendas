/**
 * Script to check bookings in Firestore
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const initAdmin = () => {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! }),
  });
};

async function checkBookings() {
  const app = initAdmin();
  const db = getFirestore(app, "default");

  const shopId = "miosotis-nails";

  console.log(`\n🔍 Checking bookings for ${shopId}...\n`);

  // Get ALL bookings
  const allBookings = await db.collection("shops").doc(shopId).collection("bookings").get();

  console.log(`Total bookings: ${allBookings.size}\n`);

  for (const doc of allBookings.docs) {
    const b = doc.data();
    console.log(`📅 Booking ID: ${doc.id}`);
    console.log(`   Date: ${b.date}`);
    console.log(`   Time: ${b.time}`);
    console.log(`   Status: ${b.status}`);
    console.log(`   Customer: ${b.customerName} (${b.customerPhone})`);
    console.log(`   Services: ${b.serviceName}`);
    console.log(`   Price: $${b.servicePrice}`);
    console.log(`   Source: ${b.source}`);
    console.log(`   Ref: ${b.referenceCode}`);
    console.log("");
  }

  // Also check orders to make sure none have appointmentDate
  console.log(`\n🔍 Checking remaining orders with appointmentDate...\n`);
  const ordersWithAppointment = await db.collection("shops").doc(shopId).collection("orders")
    .where("appointmentDate", "!=", null)
    .get();

  console.log(`Orders with appointmentDate: ${ordersWithAppointment.size}`);
}

checkBookings().catch(console.error);

import { adminDb } from "@/lib/firebase-admin";
import { Customer } from "@/lib/types/customer.types";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION_NAME = "customers";

// Helper to get DB instance safely
const getDb = () => {
    const db = adminDb();
    if (!db) throw new Error("Firebase Admin not initialized");
    return db;
}

/**
 * Creates a new customer for a specific shop
 */
export async function createCustomer(
    shopId: string,
    data: Partial<Customer> & { phone: string }
): Promise<Customer> {
    const db = getDb();
    const collectionRef = db.collection(`shops/${shopId}/${COLLECTION_NAME}`);

    // Create auto-generated ID
    const docRef = collectionRef.doc();

    const now = new Date().toISOString();

    const newCustomer: Customer = {
        ...data,
        id: docRef.id,
        // Phone is in data, but ensure it's set if spread overrides or if needed for clarity
        // phone: data.phone, 
        name: data.name || "",
        email: data.email || undefined,
        source: "whatsapp",
        registrationState: data.registrationState || "pending_name",
        totalOrders: 0,
        totalSpent: 0,
        createdAt: now,
        updatedAt: now,
    };

    await docRef.set(newCustomer);

    return newCustomer;
}

/**
 * Gets a customer by phone number
 */
export async function getCustomerByPhone(
    shopId: string,
    phone: string
): Promise<Customer | null> {
    const db = getDb();
    const snapshot = await db
        .collection(`shops/${shopId}/${COLLECTION_NAME}`)
        .where("phone", "==", phone)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as Customer;
}

/**
 * Updates a customer
 */
export async function updateCustomer(
    shopId: string,
    customerId: string,
    data: Partial<Customer>
): Promise<void> {
    const db = getDb();
    const docRef = db.doc(`shops/${shopId}/${COLLECTION_NAME}/${customerId}`);

    await docRef.update({
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

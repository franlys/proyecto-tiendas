import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    Timestamp,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BeautyConsultation } from "@/lib/types/beauty-consultation.types";

const COLLECTION_NAME = "beautyConsultations";

/**
 * Save a new beauty consultation
 */
export async function saveBeautyConsultation(
    shopId: string,
    consultation: Partial<BeautyConsultation>
): Promise<string> {
    const consultationsRef = collection(db, "shops", shopId, COLLECTION_NAME);
    const docRef = doc(consultationsRef);

    const data = {
        ...consultation,
        id: docRef.id,
        shopId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, data);
    return docRef.id;
}

/**
 * Get consultation by ID
 */
export async function getBeautyConsultation(
    shopId: string,
    consultationId: string
): Promise<BeautyConsultation | null> {
    const docRef = doc(db, "shops", shopId, COLLECTION_NAME, consultationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    const data = docSnap.data();
    return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as BeautyConsultation;
}

/**
 * Get consultation by booking ID
 */
export async function getConsultationByBookingId(
    shopId: string,
    bookingId: string
): Promise<BeautyConsultation | null> {
    const consultationsRef = collection(db, "shops", shopId, COLLECTION_NAME);
    const q = query(
        consultationsRef,
        where("bookingId", "==", bookingId),
        limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as BeautyConsultation;
}

/**
 * Get all consultations for a shop
 */
export async function getShopConsultations(
    shopId: string,
    limitCount: number = 50
): Promise<BeautyConsultation[]> {
    const consultationsRef = collection(db, "shops", shopId, COLLECTION_NAME);
    const q = query(
        consultationsRef,
        orderBy("createdAt", "desc"),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as BeautyConsultation;
    });
}

/**
 * Get consultations for upcoming bookings
 */
export async function getUpcomingConsultations(
    shopId: string,
    daysAhead: number = 7
): Promise<BeautyConsultation[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    // We need to get bookings first and then match consultations
    // For now, return recent consultations
    return getShopConsultations(shopId, 20);
}

/**
 * Update an existing consultation
 */
export async function updateBeautyConsultation(
    shopId: string,
    consultationId: string,
    updates: Partial<BeautyConsultation>
): Promise<void> {
    const docRef = doc(db, "shops", shopId, COLLECTION_NAME, consultationId);

    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a consultation
 */
export async function deleteBeautyConsultation(
    shopId: string,
    consultationId: string
): Promise<void> {
    const docRef = doc(db, "shops", shopId, COLLECTION_NAME, consultationId);
    await deleteDoc(docRef);
}

/**
 * Add notes from the artist to the consultation
 */
export async function addArtistNotes(
    shopId: string,
    consultationId: string,
    notes: string,
    artistId: string
): Promise<void> {
    const docRef = doc(db, "shops", shopId, COLLECTION_NAME, consultationId);

    await updateDoc(docRef, {
        artistNotes: notes,
        artistId,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Mark consultation as reviewed
 */
export async function markConsultationReviewed(
    shopId: string,
    consultationId: string,
    reviewedBy: string
): Promise<void> {
    const docRef = doc(db, "shops", shopId, COLLECTION_NAME, consultationId);

    await updateDoc(docRef, {
        reviewedAt: serverTimestamp(),
        reviewedBy,
        updatedAt: serverTimestamp(),
    });
}

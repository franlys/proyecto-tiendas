import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const snap = await getDocs(collection(db, 'shops'));
        let targetShopId = '';
        snap.forEach(doc => {
            if (doc.data().slug === 'sculpt-love-method') {
                targetShopId = doc.id;
            }
        });

        if (!targetShopId) return NextResponse.json({ success: false, error: 'shop not found' });

        const ordersSnap = await getDocs(collection(db, 'shops', targetShopId, 'orders'));
        const orders: any[] = [];
        ordersSnap.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                status: data.status,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                total: data.total
            });
        });

        return NextResponse.json({ success: true, targetShopId, orders });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

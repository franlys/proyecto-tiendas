
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

async function checkConfig() {
    console.log('🔍 Checking Miosotis Shop Config...');
    const doc = await db.collection('shops').doc('miosotis-nails').get();

    if (!doc.exists) {
        console.log('❌ Shop not found.');
        return;
    }

    const data = doc.data();
    console.log('--------------------------------------------------');
    console.log(`Name: ${data.name}`);
    console.log(`Slug: ${data.slug}`);
    console.log(`Custom Domain (DB): ${data.customDomain || '(Not set)'}`);
    console.log(`Computed Website: ${data.customDomain || process.env.NEXT_PUBLIC_APP_URL + '/' + data.slug}`);
    console.log(`Owner Phone (DB): ${data.ownerNotificationPhone || '(Not set)'}`);
    console.log(`Contact Phone: ${data.contact?.phone || '(Not set)'}`);
    console.log('--------------------------------------------------');

    // Check Notification Phones list (from whatsapp-order.handler logic)
    // It combines ownerNotificationPhone + staff with notify=true

    let phones = [];
    if (data.ownerNotificationPhone) phones.push({ phone: data.ownerNotificationPhone, role: 'owner' });

    // Check staff
    const staffSnap = await db.collection('shops').doc('miosotis-nails').collection('staff').get();
    staffSnap.forEach(doc => {
        const s = doc.data();
        if (s.phone && s.notify) phones.push({ phone: s.phone, role: 'staff', name: s.name });
    });

    console.log('📋 Valid Notification Phones (Who the bot will ignore/obey):');
    if (phones.length === 0) {
        console.log('   (List is empty! Bot will treat everyone as a customer)');
    } else {
        phones.forEach(p => console.log(`   - ${p.phone} (${p.role})`));
    }
}

checkConfig();

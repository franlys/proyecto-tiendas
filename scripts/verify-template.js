const fs = require('fs');

async function testQuery() {
    try {
        const { getFirestore } = require('firebase-admin/firestore');
        const { initializeApp, cert } = require('firebase-admin/app');

        initializeApp();
        const db = getFirestore();

        const snapshot = await db.collection("shops").where("slug", "==", "sculpt-love-method").get();

        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            console.log('Shop Data ID:', snapshot.docs[0].id);
            console.log('Template Type:', data.templateType);
        } else {
            console.log("Not found.");
        }
    } catch (error) {
        console.error("Query failed", error);
    }
}

testQuery();

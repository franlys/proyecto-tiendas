const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

async function checkDebugLogs() {
    console.log("🔍 Checking Emergency Webhook Logs (webhook_debug_logs) for '_v2' instance...");

    try {
        // Absolute path based on user context
        const credPath = "c:\\Users\\elmae\\proyecto-tiendas\\firebase-credentials.json";
        let serviceAccount;

        if (fs.existsSync(credPath)) {
            console.log("Loading credentials from:", credPath);
            const fileContent = fs.readFileSync(credPath, 'utf8');
            serviceAccount = JSON.parse(fileContent);
        } else {
            console.error(`❌ Credentials Error: File not found at ${credPath}`);
            return;
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (e) {
        console.error("❌ Credentials Error:", e.message);
        return;
    }

    const db = admin.firestore();

    try {
        const snapshot = await db.collection("webhook_debug_logs").get();

        if (snapshot.empty) {
            console.log("\n❌ NO LOGS FOUND in 'webhook_debug_logs'.");
        } else {
            console.log(`\n✅ FOUND ${snapshot.size} TOTAL LOGS.`);

            let recentLogs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                recentLogs.push({ id: doc.id, ...data });
            });

            // Filter for v2
            const v2Logs = recentLogs.filter(l => l.instance && l.instance.includes("_v2"));

            // Sort to show newest first
            v2Logs.sort((a, b) => {
                const tA = new Date(a.timestamp || 0).getTime();
                const tB = new Date(b.timestamp || 0).getTime();
                return tB - tA;
            });

            if (v2Logs.length === 0) {
                console.log(`\n❌ NO LOGS found for 'shop_surprise_gifts_v2'.`);
                console.log("   (Latest 3 logs for other instances:)");
                recentLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                recentLogs.slice(0, 3).forEach(l => console.log(`   - [${l.timestamp}] ${l.instance}`));
            } else {
                console.log(`\n🔎 FOUND ${v2Logs.length} LOGS for instance 'shop_surprise_gifts_v2'. Showing LAST 5:`);

                v2Logs.slice(0, 5).forEach(log => {
                    console.log(`\n📄 [${log.timestamp}] Event: ${log.event}`);
                    console.log(`   Type: ${log.type || "N/A"}`);
                    console.log(`   Payload Preview: ${JSON.stringify(log.payload || "").substring(0, 300)}...`);
                });
            }
        }
    } catch (error) {
        console.error("⚠️ Error reading logs:", error.message);
    }
}

checkDebugLogs();

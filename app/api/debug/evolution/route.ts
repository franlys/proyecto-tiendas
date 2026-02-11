import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
    const apiKey = process.env.EVOLUTION_API_KEY;
    const baseUrl = process.env.EVOLUTION_API_URL;

    if (!apiKey || !baseUrl) {
        return NextResponse.json({ error: "Missing Evolution Env Vars" }, { status: 500 });
    }

    try {
        // 1. Fetch all instances
        const instancesUrl = `${baseUrl}/instance/fetchInstances`;
        console.log("Fetching instances from:", instancesUrl);

        const response = await axios.get(instancesUrl, {
            headers: {
                "apikey": apiKey
            }
        });

        const instances = response.data;
        const diagnostics = [];

        // 2. For each instance, fetch its details (webhook etc)
        // Note: The fetchInstances endpoint usually returns an array of objects
        // We'll iterate and try to get more info if possible, or just return what we have.

        // If response.data is an array of objects with 'instance' field
        const instanceList = Array.isArray(instances) ? instances : [];

        for (const inst of instanceList) {
            const name = inst.instance?.instanceName || inst.name || "unknown";

            // Try to get detailed connection status
            let status = "unknown";
            try {
                const statusRes = await axios.get(`${baseUrl}/instance/connectionState/${name}`, {
                    headers: { "apikey": apiKey }
                });
                status = statusRes.data?.instance?.state || "unknown";
            } catch (e) {
                status = "error_fetching";
            }

            // Try to get webhook config
            // Some Evolution versions use /webhook/find/{instance}
            let webhook = "unknown";
            try {
                const webhookRes = await axios.get(`${baseUrl}/webhook/find/${name}`, {
                    headers: { "apikey": apiKey }
                });
                webhook = webhookRes.data || "no_webhook_data";
            } catch (e) {
                webhook = "error_fetching_webhook";
            }

            diagnostics.push({
                name,
                status,
                owner: inst.instance?.owner || "unknown",
                webhook_config: webhook
            });
        }

        // 3. FETCH DB LOGS (New addition)
        let logs: any[] = [];
        try {
            const { adminDb } = await import("@/lib/firebase-admin");
            const db = adminDb();
            if (db) {
                const logsSnap = await db.collection("webhook_debug_logs")
                    .orderBy("timestamp", "desc")
                    .limit(10)
                    .get();

                logs = logsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    payloadJSON: JSON.parse(doc.data().payload || "{}") // Attempt to parse for cleaner view
                }));
            }
        } catch (dbError: any) {
            logs.push({ error: "Failed to read DB logs", details: dbError.message });
        }

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            baseUrl,
            count: diagnostics.length,
            diagnostics,
            recent_webhook_logs: logs
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to fetch evolution data",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}


import * as fs from "fs";
import * as path from "path";
import axios from "axios";

// 1. Load Env
try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        envConfig.split("\n").forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, "");
                process.env[key] = value;
            }
        });
        console.log("Loaded .env.local");
    } else {
        console.log(".env.local not found");
    }
} catch (e) {
    console.log("Error loading .env.local", e);
}

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

// Target instance from logs
const INSTANCE_NAME = "shop_surprise_gifts";

async function main() {
    let logOutput = "";
    const log = (msg: string) => {
        console.log(msg);
        logOutput += msg + "\n";
    };

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
        log("Missing configuration");
        fs.writeFileSync("debug_delete_log.txt", logOutput, "utf8");
        return;
    }

    try {
        log(`Attempting to DELETE instance: ${INSTANCE_NAME}...`);

        // Try LOGOUT first (cleaner)
        try {
            log("Trying Logout first...");
            const logoutRes = await axios.delete(`${EVOLUTION_URL}/instance/logout/${INSTANCE_NAME}`, {
                headers: { apikey: EVOLUTION_KEY },
            });
            log(`Logout Status: ${logoutRes.status}`);
            log(`Logout Data: ${JSON.stringify(logoutRes.data)}`);
        } catch (e: any) {
            log(`Logout Failed (expected if already closed): ${e.message}`);
            if (e.response) log(`Logout Response: ${JSON.stringify(e.response.data)}`);
        }

        // Then DELETE
        log("Trying Delete...");
        const response = await axios.delete(`${EVOLUTION_URL}/instance/delete/${INSTANCE_NAME}`, {
            headers: { apikey: EVOLUTION_KEY },
        });

        log(`Delete Status: ${response.status}`);
        log(`Delete Data: ${JSON.stringify(response.data)}`);

    } catch (error: any) {
        log(`Delete Error: ${error.message}`);
        if (error.response) {
            log(`Delete Response Status: ${error.response.status}`);
            log(`Delete Response Data: ${JSON.stringify(error.response.data)}`);
        }
    } finally {
        fs.writeFileSync("debug_delete_log.txt", logOutput, "utf8");
        log("Log written to debug_delete_log.txt");
    }
}

main();

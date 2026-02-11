
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

console.log("URL:", EVOLUTION_URL);
console.log("KEY:", EVOLUTION_KEY ? "Found" : "Missing");

async function main() {
    let logOutput = "";
    const log = (msg: string) => {
        console.log(msg);
        logOutput += msg + "\n";
    };

    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
        log("Missing configuration");
        fs.writeFileSync("debug_evolution_log.txt", logOutput, "utf8");
        return;
    }

    try {
        log("Fetching instances...");
        const response = await axios.get(`${EVOLUTION_URL}/instance/fetchInstances`, {
            headers: { apikey: EVOLUTION_KEY },
        });

        log(`Status: ${response.status}`);
        log(`Data Type: ${typeof response.data}`);
        log(`Is Array? ${Array.isArray(response.data)}`);
        // Log deep details but safe for JSON
        log(`Data Preview: ${JSON.stringify(response.data, null, 2)}`);

    } catch (error: any) {
        log(`Error: ${error.message}`);
        if (error.response) {
            log(`Response Status: ${error.response.status}`);
            log(`Response Headers: ${JSON.stringify(error.response.headers)}`);
            log(`Response Data: ${JSON.stringify(error.response.data)}`); // This will show HTML if it is HTML
        }
    } finally {
        fs.writeFileSync("debug_evolution_log.txt", logOutput, "utf8");
        log("Log written to debug_evolution_log.txt");
    }
}

main();

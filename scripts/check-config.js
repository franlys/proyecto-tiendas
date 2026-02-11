const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
        console.log('Loaded .env.local');
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

// Init Firebase
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, '\n');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

const db = admin.firestore();

async function checkConfig() {
    const shopId = "surprise-gifts";
    let output = "";
    output += `Checking config for shop: ${shopId}\n`;

    try {
        const configRef = db.collection('shops').doc(shopId).collection('whatsapp_bot').doc('config');
        const doc = await configRef.get();

        if (doc.exists) {
            const data = doc.data();
            output += '--- Config Details ---\n';
            output += `Enabled: ${data.enabled}\n`;
            output += `Cooldown: ${data.cooldownMinutes}\n`;
            output += `Business Hours: ${data.businessHoursEnabled}\n`;
            output += `Welcome Msg: ${data.welcomeMessage ? "Set" : "Missing"}\n`;
            output += '----------------------\n';
        } else {
            output += 'No config document found!\n';
        }

        fs.writeFileSync('config-debug.log', output);
        console.log("Config written to config-debug.log");
    } catch (error) {
        console.error('Error fetching config:', error);
        fs.writeFileSync('config-debug.log', `Error: ${error.message}`);
    }
}

checkConfig();

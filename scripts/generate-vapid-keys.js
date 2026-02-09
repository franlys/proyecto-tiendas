/**
 * Script to generate VAPID keys for Push Notifications
 *
 * Run this script once to generate your VAPID keys:
 *   node scripts/generate-vapid-keys.js
 *
 * Then add the keys to your environment variables.
 */

const webpush = require("web-push");

console.log("\n=== Generador de Claves VAPID para Push Notifications ===\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("Agrega estas variables de entorno a tu proyecto:\n");

console.log("# Public key (agregar a .env.local y Vercel)");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);

console.log("# Private key (SOLO agregar a Vercel, NO commitear)");
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);

console.log("# Subject - tu email o URL");
console.log("VAPID_SUBJECT=mailto:tu-email@ejemplo.com\n");

console.log("=== Instrucciones ===");
console.log("1. Copia las claves de arriba");
console.log("2. En Vercel: Settings > Environment Variables");
console.log("3. Agrega las 3 variables (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)");
console.log("4. Para desarrollo local, agrega solo NEXT_PUBLIC_VAPID_PUBLIC_KEY a .env.local");
console.log("\nNOTA: NUNCA commitees VAPID_PRIVATE_KEY a git!\n");

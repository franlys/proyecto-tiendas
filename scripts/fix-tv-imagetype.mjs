import { readFileSync } from "fs";
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
  process.env[key] = val;
}

const admin = require("firebase-admin");
const pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: pk }) });
const db = admin.firestore();
db.settings({ databaseId: "default" });

const shopId = "shop-1773081239760";
const docRef = db.collection("shops").doc(shopId).collection("settings").doc("mainCategories");
const snap = await docRef.get();
const items = snap.data()?.items || [];

const fixed = items.map(cat =>
  cat.id === "televisores" ? { ...cat, imageType: "product" } : cat
);

await docRef.update({ items: fixed });
console.log("✅ TV cambiado a imageType: product");
process.exit(0);

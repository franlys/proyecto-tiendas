/**
 * Asigna mainCategory a productos según su categoría existente.
 * Uso: node scripts/assign-main-category.mjs <shopId>
 */

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
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const admin = require("firebase-admin");
const pk = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: pk,
  }),
});
const db = admin.firestore();
db.settings({ databaseId: "default" });

const shopId = process.argv[2];
if (!shopId) { console.error("Uso: node assign-main-category.mjs <shopId>"); process.exit(1); }

// ── Mapeo: categoría del producto → mainCategory ──────────────────────────────
// Ajustá esto según las categorías que usás en tus productos
const CATEGORY_MAP = {
  // smartphones / celulares
  "smartphones": "smartphones",
  "smartphone": "smartphones",
  "celulares": "smartphones",
  "celular": "smartphones",
  "iphone": "smartphones",
  "android": "smartphones",
  "telefono": "smartphones",
  "telefonos": "smartphones",
  "móvil": "smartphones",
  "movil": "smartphones",
  // marcas de celulares
  "samsung": "smartphones",
  "apple": "smartphones",
  "xiaomi": "smartphones",
  "zte": "smartphones",
  "itel": "smartphones",
  "tecno": "smartphones",
  "motorola": "smartphones",
  "huawei": "smartphones",
  "oppo": "smartphones",
  "realme": "smartphones",
  "infinix": "smartphones",
  "oneplus": "smartphones",
  "honor": "smartphones",

  // televisores
  "televisores": "televisores",
  "televisor": "televisores",
  "tv": "televisores",
  "smart tv": "televisores",
  "smarttv": "televisores",

  // tablets
  "tablets": "tablets",
  "tablet": "tablets",
  "ipad": "tablets",

  // smartwatches
  "smartwatches": "smartwatches",
  "smartwatch": "smartwatches",
  "relojes": "smartwatches",
  "reloj": "smartwatches",
  "wearable": "smartwatches",

  // aires
  "aires": "aires-acondicionados",
  "aire": "aires-acondicionados",
  "aire acondicionado": "aires-acondicionados",
  "aires acondicionados": "aires-acondicionados",
  "a/c": "aires-acondicionados",
  "ac": "aires-acondicionados",

  // laptops
  "laptops": "laptops",
  "laptop": "laptops",
  "computadoras": "laptops",
  "computadora": "laptops",
  "portatil": "laptops",
  "portátil": "laptops",
  "notebooks": "laptops",
  "notebook": "laptops",
};

const snap = await db.collection("shops").doc(shopId).collection("products").get();
console.log(`\n📦 ${snap.size} productos encontrados en shops/${shopId}/products\n`);

const batch = db.batch();
let updated = 0;
let skipped = 0;

snap.forEach((doc) => {
  const data = doc.data();
  const rawCat = (data.category || data.subcategory || "").toLowerCase().trim();
  const rawName = (data.name || "").toLowerCase();

  // Intentar mapear por categoría directa
  let mainCat = CATEGORY_MAP[rawCat];

  // Si no hay categoría, intentar por nombre del producto
  if (!mainCat) {
    for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
      if (rawName.includes(keyword)) { mainCat = cat; break; }
    }
  }

  if (mainCat) {
    console.log(`  ✓ "${data.name}" [${rawCat}] → ${mainCat}`);
    batch.update(doc.ref, { mainCategory: mainCat });
    updated++;
  } else {
    console.log(`  - "${data.name}" [${rawCat}] → sin asignar`);
    skipped++;
  }
});

if (updated > 0) {
  await batch.commit();
  console.log(`\n✅ ${updated} productos actualizados, ${skipped} sin categoría asignada`);
} else {
  console.log("\n⚠️  No se actualizó ningún producto. Revisá el mapeo de categorías.");
}
process.exit(0);

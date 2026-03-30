/**
 * Script: upload-category-images.mjs
 * Sube imágenes de categorías a Firebase Storage y actualiza Firestore.
 * Uso: node scripts/upload-category-images.mjs <shopId>
 */

import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Cargar .env.local manualmente ────────────────────────────────────────────
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Quitar comillas externas
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

// ── Inicializar Firebase Admin ────────────────────────────────────────────────
const admin = require("firebase-admin");
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
const privateKey = rawKey.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
db.settings({ databaseId: "default" });
const bucket = admin.storage().bucket();

// ── Mapeo de archivos → categoría ────────────────────────────────────────────
const IMAGES_DIR =
  "C:\\Users\\elmae\\OneDrive - Universidad APEC - Académico\\Escritorio\\productos";

const IMAGE_MAP = [
  { file: "smartphone.png",           categoryId: "smartphones",          imageType: "product"    },
  { file: "tv.png",                   categoryId: "televisores",           imageType: "atmosphere" },
  { file: "reloj.avif",               categoryId: "smartwatches",          imageType: "product"    },
  { file: "aire acondicionado.png",   categoryId: "aires-acondicionados",  imageType: "product"    },
  { file: "laptos.png",               categoryId: "laptops",               imageType: "product"    },
];

const MIME = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
  ".webp": "image/webp",
};

// ── Subir imágenes ────────────────────────────────────────────────────────────
async function uploadImage(file, categoryId) {
  const localPath = join(IMAGES_DIR, file);
  if (!existsSync(localPath)) {
    console.error(`  ✗ No encontrado: ${localPath}`);
    return null;
  }

  const ext = extname(file).toLowerCase();
  const mimeType = MIME[ext] || "application/octet-stream";
  const destination = `category-images/${categoryId}${ext}`;

  console.log(`  ↑ Subiendo ${file} → ${destination}`);

  await bucket.upload(localPath, {
    destination,
    metadata: { contentType: mimeType },
    public: true,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
  console.log(`  ✓ URL: ${publicUrl}`);
  return publicUrl;
}

// ── Actualizar Firestore ──────────────────────────────────────────────────────
async function updateFirestore(shopId, results) {
  const DEFAULT_CATEGORIES = [
    { id: "smartphones",        name: "Smartphones",    description: "iPhone, Samsung, Xiaomi y los últimos modelos",         imageType: "product",    enabled: true, order: 0 },
    { id: "televisores",        name: "Televisores",    description: "Smart TV 4K, OLED y QLED para tu hogar",                imageType: "atmosphere", enabled: true, order: 1 },
    { id: "tablets",            name: "Tablets",        description: "iPad, Galaxy Tab y más para trabajar y crear",          imageType: "product",    enabled: true, order: 2 },
    { id: "smartwatches",       name: "Smartwatches",   description: "Wearables y relojes inteligentes de alta gama",         imageType: "product",    enabled: true, order: 3 },
    { id: "aires-acondicionados", name: "Aires A/C",    description: "Climatización inteligente para cada espacio",           imageType: "product",    enabled: true, order: 4 },
    { id: "laptops",            name: "Laptops",        description: "Computadoras portátiles de alto rendimiento",           imageType: "product",    enabled: true, order: 5 },
  ];

  // Aplicar URLs subidas
  const categories = DEFAULT_CATEGORIES.map((cat) => {
    const result = results.find((r) => r.categoryId === cat.id);
    return result ? { ...cat, image: result.url, imageType: result.imageType } : cat;
  });

  const docRef = db.collection("shops").doc(shopId).collection("settings").doc("mainCategories");
  await docRef.set({ items: categories }, { merge: true });
  console.log(`\n✅ Firestore actualizado: shops/${shopId}/settings/mainCategories`);
  console.log("   Categorías guardadas:", categories.map((c) => `${c.id}${c.image ? " ✓" : " (sin imagen)"}`).join(", "));
}

// ── Main ──────────────────────────────────────────────────────────────────────
const shopId = process.argv[2];
if (!shopId) {
  console.error("Uso: node scripts/upload-category-images.mjs <shopId>");
  process.exit(1);
}

console.log(`\n🚀 Subiendo imágenes para shopId: ${shopId}\n`);

const results = [];
for (const { file, categoryId, imageType } of IMAGE_MAP) {
  const url = await uploadImage(file, categoryId);
  if (url) results.push({ categoryId, url, imageType });
}

console.log(`\n📦 ${results.length}/${IMAGE_MAP.length} imágenes subidas`);

if (results.length > 0) {
  await updateFirestore(shopId, results);
}

process.exit(0);

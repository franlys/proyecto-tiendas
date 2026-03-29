// ─── MAIN CATEGORY TYPES ─────────────────────────────────────────────────────
// Stored in: shops/{shopId}/settings/mainCategories → { items: MainCategory[] }

export interface MainCategory {
  id: string;        // URL-safe slug, e.g. "smartphones"
  name: string;      // Display name, e.g. "Smartphones"
  description: string;
  image?: string;    // URL (Firebase Storage, CDN, etc.)
  enabled: boolean;
  order: number;
}

// ─── DEFAULTS (used when Firestore has no config yet) ─────────────────────────
export const DEFAULT_MAIN_CATEGORIES: MainCategory[] = [
  {
    id: "smartphones",
    name: "Smartphones",
    description: "iPhone, Samsung, Xiaomi y los últimos modelos",
    enabled: true,
    order: 0,
  },
  {
    id: "televisores",
    name: "Televisores",
    description: "Smart TV 4K, OLED y QLED para tu hogar",
    enabled: true,
    order: 1,
  },
  {
    id: "tablets",
    name: "Tablets",
    description: "iPad, Galaxy Tab y más para trabajar y crear",
    enabled: true,
    order: 2,
  },
  {
    id: "smartwatches",
    name: "Smartwatches",
    description: "Wearables y relojes inteligentes de alta gama",
    enabled: true,
    order: 3,
  },
  {
    id: "aires-acondicionados",
    name: "Aires A/C",
    description: "Climatización inteligente para cada espacio",
    enabled: true,
    order: 4,
  },
  {
    id: "accesorios",
    name: "Accesorios",
    description: "Audífonos, cargadores, fundas y mucho más",
    enabled: true,
    order: 5,
  },
];

// Palette rotates if there are more than 6 categories
export const MAIN_CATEGORY_GRADIENTS = [
  "from-blue-700/60 to-blue-950",
  "from-violet-700/60 to-violet-950",
  "from-cyan-700/60 to-cyan-950",
  "from-amber-700/60 to-amber-950",
  "from-sky-700/60 to-sky-950",
  "from-emerald-700/60 to-emerald-950",
  "from-rose-700/60 to-rose-950",
  "from-orange-700/60 to-orange-950",
];

export const MAIN_CATEGORY_ACCENTS = [
  "text-blue-300",
  "text-violet-300",
  "text-cyan-300",
  "text-amber-300",
  "text-sky-300",
  "text-emerald-300",
  "text-rose-300",
  "text-orange-300",
];

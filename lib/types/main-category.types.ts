// ─── MAIN CATEGORY TYPES ─────────────────────────────────────────────────────
// Stored in: shops/{shopId}/settings/mainCategories → { items: MainCategory[] }

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  image?: string;
  /**
   * "product" (default): product shot on white/transparent bg.
   *   → object-fit: contain + mix-blend-mode: multiply → white bg disappears.
   * "atmosphere": scenic/environmental photo (e.g. a TV showing a landscape).
   *   → object-fit: cover, no blend mode, just a dark overlay.
   */
  imageType?: "product" | "atmosphere";
  enabled: boolean;
  order: number;
}

// ─── DEFAULTS (used when Firestore has no config yet) ─────────────────────────
export const DEFAULT_MAIN_CATEGORIES: MainCategory[] = [
  {
    id: "smartphones",
    name: "Smartphones",
    description: "iPhone, Samsung, Xiaomi y los últimos modelos",
    imageType: "product",
    enabled: true,
    order: 0,
  },
  {
    id: "televisores",
    name: "Televisores",
    description: "Smart TV 4K, OLED y QLED para tu hogar",
    imageType: "atmosphere",
    enabled: true,
    order: 1,
  },
  {
    id: "tablets",
    name: "Tablets",
    description: "iPad, Galaxy Tab y más para trabajar y crear",
    imageType: "product",
    enabled: true,
    order: 2,
  },
  {
    id: "smartwatches",
    name: "Smartwatches",
    description: "Wearables y relojes inteligentes de alta gama",
    imageType: "product",
    enabled: true,
    order: 3,
  },
  {
    id: "aires-acondicionados",
    name: "Aires A/C",
    description: "Climatización inteligente para cada espacio",
    imageType: "product",
    enabled: true,
    order: 4,
  },
  {
    id: "laptops",
    name: "Laptops",
    description: "Computadoras portátiles de alto rendimiento",
    imageType: "product",
    enabled: true,
    order: 5,
  },
];

// ─── PALETTE ─────────────────────────────────────────────────────────────────
// Medium-saturation colors: bright enough that mix-blend-mode: multiply
// removes white backgrounds while keeping product colors recognizable.
export const MAIN_CATEGORY_SOLID_BG = [
  "#1e3a5f",   // deep blue      — smartphones
  "#2d1b69",   // deep violet    — televisores
  "#0c3b4a",   // deep cyan      — tablets
  "#3d2600",   // deep amber     — smartwatches
  "#0a2d3d",   // deep sky       — aires
  "#0d2d1e",   // deep emerald   — laptops
  "#3d0d1e",   // deep rose      — extra
  "#2d1500",   // deep orange    — extra
];

export const MAIN_CATEGORY_GRADIENTS = [
  "from-[#1e3a5f] to-[#0a1628]",
  "from-[#2d1b69] to-[#0d0820]",
  "from-[#0c3b4a] to-[#040f14]",
  "from-[#3d2600] to-[#120b00]",
  "from-[#0a2d3d] to-[#030d12]",
  "from-[#0d2d1e] to-[#030d08]",
  "from-[#3d0d1e] to-[#120308]",
  "from-[#2d1500] to-[#0d0600]",
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

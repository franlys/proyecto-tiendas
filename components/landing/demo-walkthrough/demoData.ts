// Demo data for interactive walkthrough
// Uses the same types as the real system

import type { Service, Product, ServiceCategory, ProductCategory } from "@/lib/constants";

// ============================================
// DEMO SERVICES (for catalog step)
// ============================================
export const DEMO_SERVICES: Service[] = [
  {
    id: "demo-s1",
    name: "Corte de Cabello",
    description: "Corte profesional con lavado y secado",
    price: 350,
    duration: 45,
    category: "cabello" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
  },
  {
    id: "demo-s2",
    name: "Manicure Spa",
    description: "Tratamiento completo con masaje de manos",
    price: 280,
    duration: 50,
    category: "unas" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
  },
  {
    id: "demo-s3",
    name: "Masaje Relajante",
    description: "60 minutos de relajación profunda",
    price: 650,
    duration: 60,
    category: "spa" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
  },
  {
    id: "demo-s4",
    name: "Limpieza Facial",
    description: "Limpieza profunda e hidratación",
    price: 420,
    duration: 45,
    category: "facial" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop",
  },
  {
    id: "demo-s5",
    name: "Tinte Completo",
    description: "Color uniforme con productos premium",
    price: 850,
    duration: 90,
    category: "cabello" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=400&fit=crop",
  },
  {
    id: "demo-s6",
    name: "Pedicure Express",
    description: "Tratamiento rápido de pies",
    price: 220,
    duration: 30,
    category: "unas" as ServiceCategory,
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=400&fit=crop",
  },
];

// ============================================
// DEMO PRODUCTS (for catalog step)
// ============================================
export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-p1",
    name: "Shampoo Hidratante",
    description: "Hidratación profunda para cabello seco",
    price: 280,
    stock: 15,
    lowStockThreshold: 5,
    category: "cabello" as ProductCategory,
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
    featured: true,
  },
  {
    id: "demo-p2",
    name: "Crema Facial Vitamina C",
    description: "Iluminadora y antioxidante",
    price: 580,
    promoPrice: 450,
    stock: 8,
    lowStockThreshold: 3,
    category: "skincare" as ProductCategory,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400&h=400&fit=crop",
    featured: true,
  },
  {
    id: "demo-p3",
    name: "Kit Esmaltes Gel",
    description: "Set de 6 colores tendencia",
    price: 650,
    stock: 4,
    lowStockThreshold: 2,
    category: "unas" as ProductCategory,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
  },
  {
    id: "demo-p4",
    name: "Aceite de Argán",
    description: "Aceite nutritivo para puntas",
    price: 320,
    stock: 12,
    lowStockThreshold: 4,
    category: "cabello" as ProductCategory,
    image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&h=400&fit=crop",
  },
  {
    id: "demo-p5-variant",
    name: "Tratamiento Capilar",
    description: "Diferentes intensidades disponibles",
    price: 450,
    stock: 10,
    lowStockThreshold: 3,
    category: "cabello" as ProductCategory,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop",
    variants: [
      { id: "v1", name: "Básico", description: "Hidratación ligera", price: 450, stock: 4 },
      { id: "v2", name: "Premium", description: "Reparación intensiva", price: 680, stock: 3 },
      { id: "v3", name: "VIP", description: "Tratamiento completo", price: 950, stock: 3 },
    ],
  },
];

// ============================================
// DEMO CLIENTS (for CRM step)
// ============================================
export interface DemoClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  visitCount: number;
  isVIP: boolean;
  lastVisit: string;
  notes?: string;
  loyaltyStamps: number;
}

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: "c1",
    name: "María García",
    phone: "+52 55 1234 5678",
    email: "maria@email.com",
    totalSpent: 8500,
    visitCount: 12,
    isVIP: true,
    lastVisit: "Hace 3 días",
    notes: "Prefiere tinte sin amoniaco. Alérgica al níquel.",
    loyaltyStamps: 8,
  },
  {
    id: "c2",
    name: "Ana López",
    phone: "+52 55 2345 6789",
    totalSpent: 4200,
    visitCount: 6,
    isVIP: false,
    lastVisit: "Hace 1 semana",
    loyaltyStamps: 4,
  },
  {
    id: "c3",
    name: "Carmen Ruiz",
    phone: "+52 55 3456 7890",
    email: "carmen.r@email.com",
    totalSpent: 12300,
    visitCount: 18,
    isVIP: true,
    lastVisit: "Ayer",
    notes: "Cliente frecuente. Le gusta el café con leche de almendra.",
    loyaltyStamps: 10,
  },
  {
    id: "c4",
    name: "Laura Martínez",
    phone: "+52 55 4567 8901",
    totalSpent: 2100,
    visitCount: 3,
    isVIP: false,
    lastVisit: "Hace 2 semanas",
    loyaltyStamps: 2,
  },
  {
    id: "c5",
    name: "Sofía Hernández",
    phone: "+52 55 5678 9012",
    totalSpent: 6800,
    visitCount: 9,
    isVIP: true,
    lastVisit: "Hace 5 días",
    notes: "Siempre pide turno con Ana.",
    loyaltyStamps: 7,
  },
];

// ============================================
// DEMO ORDERS (for Kanban step)
// ============================================
export type OrderStatus = "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";

export interface DemoOrder {
  id: string;
  code: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  isPaid: boolean;
  createdAt: string;
}

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "o1",
    code: "NEX-001",
    customerName: "María García",
    items: [
      { name: "Corte de Cabello", quantity: 1, price: 350 },
      { name: "Manicure Spa", quantity: 1, price: 280 },
    ],
    total: 630,
    status: "pending",
    isPaid: false,
    createdAt: "Hace 5 min",
  },
  {
    id: "o2",
    code: "NEX-002",
    customerName: "Ana López",
    items: [
      { name: "Shampoo Hidratante", quantity: 2, price: 560 },
    ],
    total: 560,
    status: "confirmed",
    isPaid: true,
    createdAt: "Hace 20 min",
  },
  {
    id: "o3",
    code: "NEX-003",
    customerName: "Carmen Ruiz",
    items: [
      { name: "Masaje Relajante", quantity: 1, price: 650 },
      { name: "Limpieza Facial", quantity: 1, price: 420 },
    ],
    total: 1070,
    status: "preparing",
    isPaid: true,
    createdAt: "Hace 1 hora",
  },
  {
    id: "o4",
    code: "NEX-004",
    customerName: "Laura Martínez",
    items: [
      { name: "Kit Esmaltes Gel", quantity: 1, price: 650 },
    ],
    total: 650,
    status: "dispatched",
    isPaid: true,
    createdAt: "Hace 2 horas",
  },
  {
    id: "o5",
    code: "NEX-005",
    customerName: "Sofía Hernández",
    items: [
      { name: "Tinte Completo", quantity: 1, price: 850 },
    ],
    total: 850,
    status: "pending",
    isPaid: false,
    createdAt: "Hace 10 min",
  },
];

// ============================================
// DEMO CAMPAIGNS (for Marketing step)
// ============================================
export interface DemoCampaign {
  id: string;
  name: string;
  message: string;
  segment: string;
  status: "draft" | "sending" | "completed" | "paused";
  sentCount: number;
  totalCount: number;
  createdAt: string;
}

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    id: "camp1",
    name: "Promo Fin de Semana",
    message: "¡Este fin de semana 20% OFF en todos los servicios! Reserva ya tu cita.",
    segment: "Todos los clientes",
    status: "completed",
    sentCount: 156,
    totalCount: 156,
    createdAt: "Hace 3 días",
  },
  {
    id: "camp2",
    name: "Clientes VIP - Nuevo Tratamiento",
    message: "Hola! Como cliente VIP te invitamos a probar nuestro nuevo tratamiento de keratina con 30% de descuento exclusivo.",
    segment: "Clientes VIP",
    status: "sending",
    sentCount: 12,
    totalCount: 28,
    createdAt: "Ahora",
  },
  {
    id: "camp3",
    name: "Recuperación de Clientes",
    message: "¡Te extrañamos! Vuelve y recibe un servicio gratis en tu próxima visita.",
    segment: "Inactivos +30 días",
    status: "draft",
    sentCount: 0,
    totalCount: 45,
    createdAt: "Borrador",
  },
];

// ============================================
// DEMO STATS (for Dashboard step)
// ============================================
export interface DemoStats {
  todaySales: number;
  todayOrders: number;
  avgTicket: number;
  topService: string;
  weeklyData: { day: string; sales: number }[];
  comparisonPercent: number;
}

export const DEMO_STATS: DemoStats = {
  todaySales: 12450,
  todayOrders: 24,
  avgTicket: 518,
  topService: "Corte + Tinte",
  weeklyData: [
    { day: "Lun", sales: 8500 },
    { day: "Mar", sales: 9200 },
    { day: "Mié", sales: 7800 },
    { day: "Jue", sales: 11200 },
    { day: "Vie", sales: 14500 },
    { day: "Sáb", sales: 16800 },
    { day: "Dom", sales: 5200 },
  ],
  comparisonPercent: 12.5,
};

// ============================================
// DEMO INVENTORY ITEMS (for Inventory step)
// ============================================
export interface DemoInventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  price: number;
  cost: number;
  image: string;
}

export const DEMO_INVENTORY: DemoInventoryItem[] = [
  {
    id: "inv1",
    name: "Shampoo Pro 500ml",
    category: "Cabello",
    stock: 24,
    lowStockThreshold: 5,
    price: 280,
    cost: 150,
    image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=100&h=100&fit=crop",
  },
  {
    id: "inv2",
    name: "Tinte L'Oreal #7.1",
    category: "Coloración",
    stock: 3,
    lowStockThreshold: 5,
    price: 180,
    cost: 95,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop",
  },
  {
    id: "inv3",
    name: "Gel Fijador 250ml",
    category: "Styling",
    stock: 18,
    lowStockThreshold: 8,
    price: 150,
    cost: 70,
    image: "https://images.unsplash.com/photo-1597854710266-9b0c96bab731?w=100&h=100&fit=crop",
  },
  {
    id: "inv4",
    name: "Aceite Argán 100ml",
    category: "Tratamientos",
    stock: 12,
    lowStockThreshold: 4,
    price: 320,
    cost: 180,
    image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=100&h=100&fit=crop",
  },
  {
    id: "inv5",
    name: "Mascarilla Keratina",
    category: "Tratamientos",
    stock: 2,
    lowStockThreshold: 3,
    price: 450,
    cost: 250,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=100&h=100&fit=crop",
  },
];

// ============================================
// DEMO PROMO TEMPLATES
// ============================================
export const DEMO_PROMO_TEMPLATES = [
  { id: 1, title: "2x1 HOY", gradient: "from-rose-500 to-orange-400" },
  { id: 2, title: "50% OFF", gradient: "from-purple-500 to-pink-500" },
  { id: 3, title: "NUEVO", gradient: "from-cyan-500 to-blue-500" },
  { id: 4, title: "FLASH", gradient: "from-amber-500 to-red-500" },
];

// ============================================
// DEMO THEME PRESETS (for Settings step)
// ============================================
export const DEMO_THEME_PRESETS = [
  { id: 1, name: "Electric Cyan", primary: "#06B6D4", accent: "#D4AF37" },
  { id: 2, name: "Rose Gold", primary: "#F43F5E", accent: "#D4AF37" },
  { id: 3, name: "Royal Purple", primary: "#8B5CF6", accent: "#F59E0B" },
  { id: 4, name: "Emerald", primary: "#10B981", accent: "#F97316" },
  { id: 5, name: "Sunset", primary: "#F97316", accent: "#EC4899" },
  { id: 6, name: "Ocean", primary: "#0EA5E9", accent: "#14B8A6" },
];

export const DEMO_BACKGROUND_EFFECTS = [
  { id: "clean", name: "Clean", preview: "bg-gradient-to-br from-slate-900 to-slate-800" },
  { id: "galaxy", name: "Galaxy", preview: "bg-gradient-to-br from-purple-900 to-indigo-900" },
  { id: "aurora", name: "Aurora", preview: "bg-gradient-to-br from-green-900 to-cyan-900" },
  { id: "particles", name: "Particles", preview: "bg-gradient-to-br from-blue-900 to-slate-900" },
];

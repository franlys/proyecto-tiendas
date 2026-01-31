import type { DemoStep } from "./DemoProvider";

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "shop-frontend",
    title: "Catálogo Digital Profesional",
    subtitle: "Tu vitrina 24/7",
    description: "Muestra tus servicios y productos con fotos de alta calidad. Categorías organizadas, precios actualizables al instante.",
    features: [
      "Fotos y descripciones profesionales",
      "Categorías personalizables",
      "Precios actualizables al instante",
      "Filtros intuitivos para clientes"
    ],
    accentColor: "cyan",
    mockupType: "phone"
  },
  {
    id: "cart-whatsapp",
    title: "Reservas Directas por WhatsApp",
    subtitle: "Sin complicaciones",
    description: "Tu cliente selecciona servicios y con un click te llega todo el pedido formateado a tu WhatsApp Business.",
    features: [
      "Carrito visual intuitivo",
      "Mensaje pre-formateado automático",
      "Fecha y hora incluidas",
      "Sin comisiones por reserva"
    ],
    accentColor: "green",
    mockupType: "phone"
  },
  {
    id: "dashboard",
    title: "Dashboard con Métricas",
    subtitle: "Datos en tiempo real",
    description: "Visualiza ventas del día, ticket promedio, servicio más vendido. Panel elegante desde cualquier dispositivo.",
    features: [
      "Ventas diarias, semanales y mensuales",
      "Top servicios y productos",
      "Cierre de caja con un click",
      "Gráficas interactivas"
    ],
    accentColor: "purple",
    mockupType: "desktop"
  },
  {
    id: "inventory",
    title: "Control de Inventario",
    subtitle: "Nunca te quedes sin stock",
    description: "Mantén el control de tus productos físicos. Alertas de stock bajo, historial de movimientos.",
    features: [
      "Variantes por producto (tallas, colores)",
      "Alertas automáticas de stock bajo",
      "Historial de entradas y salidas",
      "Reportes de más vendidos"
    ],
    accentColor: "teal",
    mockupType: "desktop"
  },
  {
    id: "crm",
    title: "CRM con Historial de Clientes",
    subtitle: "Conoce a tus clientes",
    description: "Historial de visitas, preferencias, notas privadas y programa de lealtad integrado.",
    features: [
      "Historial completo de cada cliente",
      "Notas privadas (gustos, alergias)",
      "Tarjeta de fidelidad digital",
      "Segmentación VIP automática"
    ],
    accentColor: "blue",
    mockupType: "desktop"
  },
  {
    id: "orders-kanban",
    title: "Tablero Kanban de Pedidos",
    subtitle: "Gestión visual",
    description: "Visualiza todos tus pedidos en columnas. Mueve pedidos entre estados y notifica clientes por WhatsApp.",
    features: [
      "Vista Kanban intuitiva",
      "Estados personalizables",
      "Notificaciones WhatsApp",
      "Historial de cambios"
    ],
    accentColor: "amber",
    mockupType: "desktop"
  },
  {
    id: "marketing",
    title: "Campañas de Marketing",
    subtitle: "Alcanza a tus clientes",
    description: "Envía campañas masivas por WhatsApp. Segmenta audiencias y programa envíos.",
    features: [
      "Segmentación de audiencias",
      "Envío masivo por WhatsApp",
      "Templates personalizables",
      "Sistema anti-ban integrado"
    ],
    accentColor: "pink",
    mockupType: "desktop"
  },
  {
    id: "promo-generator",
    title: "Generador de Promociones",
    subtitle: "Stories en segundos",
    description: "Crea imágenes profesionales para Instagram Stories en segundos. Sin Canva, sin Photoshop.",
    features: [
      "Templates profesionales",
      "Formato Stories (9:16)",
      "Comparte directo a WhatsApp",
      "Personaliza colores y textos"
    ],
    accentColor: "rose",
    mockupType: "phone"
  },
  {
    id: "settings",
    title: "Personalización Visual",
    subtitle: "Tu marca, tu estilo",
    description: "Elige tu paleta de colores, fondos animados y configura tu tienda a tu gusto.",
    features: [
      "12+ temas de colores",
      "8 efectos de fondo animados",
      "Videos y fotos personalizados",
      "Logo y nombre de tienda"
    ],
    accentColor: "orange",
    mockupType: "desktop"
  }
];

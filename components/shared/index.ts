export { ThemeProvider, useTheme, useShop } from "./theme-context";
export { CartProvider, useCart } from "./cart-context";
export { LoyaltyCard } from "./loyalty-card";
export {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  ScaleIn,
} from "./scroll-reveal";
export {
  ShopConfigProvider,
  useShopConfig,
  COLOR_THEMES,
  COLOR_PRESETS,
  DEMO_VIDEOS,
  DEMO_IMAGES,
  type ColorTheme,
  type BackgroundType,
  type ShopVisualConfig,
} from "./shop-config-context";
export {
  OrdersProvider,
  useOrders,
  type Order,
  type OrderItem,
} from "./orders-context";
export {
  ClientsProvider,
  useClients,
  type Client,
  type ClientNote,
} from "./clients-context";
export {
  AuthProvider,
  useAuth,
  type User,
  type UserRole,
  type ShopSessionConfig,
} from "./auth-context";
export {
  ShopsProvider,
  useShops,
  DEFAULT_FEATURES,
  type ManagedShop,
  type SubscriptionStatus,
  type ShopCategory,
  type FeatureId,
} from "./shops-context";
export { InventoryProvider, useInventory } from "./inventory-context";
export {
  MediaUploader,
  type MediaType,
  type UploadPreset,
} from "./media-uploader";
// Phase 13: Retail & Wholesale
export { WholesaleProvider, useWholesale } from "./wholesale-context";
export {
  RepairProvider,
  useRepair,
  REPAIR_STATUS_CONFIG,
  type RepairTicket,
  type RepairStatus,
} from "./repair-context";
// Phase 16: Sales Orders
export {
  SalesOrdersProvider,
  useSalesOrders,
  ORDER_STATUS_CONFIG,
  type SalesOrder,
  type SalesOrderItem,
  type OrderStatus,
} from "./sales-orders-context";
// Phase 17: Marketing
export {
  MarketingProvider,
  useMarketing,
  AUDIENCE_SEGMENTS,
  CAMPAIGN_STATUS_CONFIG,
  type Campaign,
  type AudienceSegment,
  type CampaignStatus,
} from "./marketing-context";
// Phase 18: Staff & RBAC
export {
  StaffProvider,
  useStaff,
  RoleBadge,
  STAFF_ROLES,
  ROLE_PERMISSIONS,
  ROUTE_PERMISSIONS,
  type StaffMember,
  type StaffRole,
  type Permission,
} from "./staff-context";
export {
  RoleBasedLink,
  RoleBasedElement,
  RoleBasedRouteGuard,
} from "./role-based-link";
// Phase 20: Scrollytelling / Immersive UI
export { UIProvider, useUI, type SectionId } from "./ui-context";
export { SectionObserver } from "./section-observer";
// Phase 24: Agency White-Label
export {
  AgencyProvider,
  useAgency,
  type AgencyConfig,
} from "./agency-context";
// Background Gallery for Shop Configuration
export { BackgroundGallery } from "./background-gallery";
// Real-time Notifications
export {
  NotificationsProvider,
  useNotifications,
  useNotificationsOptional,
  type AppNotification,
} from "./notifications-context";

export { SmoothScroll } from "./smooth-scroll";
export { ScrollProgress } from "./scroll-progress";
export { VisualFeedbackProvider, useVisualFeedback } from "./visual-feedback-context";
export { CursorProvider, useCursor } from "./cursor-context";

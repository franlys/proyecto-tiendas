"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect
} from "react";
import { localToken } from "@/lib/utils/safe-storage";
import type { Service, Product, ProductVariant } from "@/lib/constants";
import type { SelectedExtra } from "@/lib/types/product-extra.types";

// Cart item types
export type CartItemType = "service" | "product";

export interface ServiceCartItem extends Service {
  itemType: "service";
  quantity: 1; // Services don't stack
}

export interface ProductCartItem {
  itemType: "product";
  id: string; // Product ID
  variantId?: string; // Optional Variant ID

  name: string;
  variantName?: string; // "Original", "OLED", etc.

  price: number; // Unit price (Product or Variant price)
  promoPrice?: number;
  image: string;
  quantity: number;

  // Extras/Addons support
  selectedExtras?: SelectedExtra[];
  extrasTotal?: number; // Pre-calculated total of extras

  // Customization notes (for meal prep, special instructions, etc.)
  notes?: string;
}

export type CartItem = ServiceCartItem | ProductCartItem;

// Notification for cart feedback
export interface CartNotification {
  id: number;
  message: string;
  type: "add" | "remove" | "update";
}

interface CartContextValue {
  items: CartItem[];
  services: ServiceCartItem[];
  products: ProductCartItem[];
  addService: (service: Service) => void;
  addProduct: (product: Product, quantity?: number, variant?: ProductVariant, extras?: SelectedExtra[], notes?: string) => void;
  removeItem: (id: string, variantId?: string, extrasKey?: string) => void;
  updateProductQuantity: (productId: string, quantity: number, variantId?: string) => void;

  // Variant specifics
  updateVariantQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeVariant: (productId: string, variantId: string) => void;
  getVariantQuantity: (productId: string, variantId: string) => number;

  // Item notes for customization
  updateItemNotes: (productId: string, notes: string, variantId?: string) => void;

  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getProductQuantity: (productId: string) => number; // Total quantity of product (all variants)
  totalItems: number;
  totalPrice: number;
  totalDuration: number; // For services

  // Phase 26: Restaurant Table Management
  tableId: string | null;
  setTableId: (id: string | null) => void;

  // Cart notifications for visual feedback
  notifications: CartNotification[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children, shopId, templateType }: CartProviderProps & { shopId?: string; templateType?: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CartNotification[]>([]);
  const notificationIdRef = { current: 0 };

  // Add notification helper
  const addNotification = useCallback((message: string, type: "add" | "remove" | "update") => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [...prev.slice(-3), { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Load from local storage on mount or when shopId changes
  useEffect(() => {
    if (!shopId) return;

    const key = `shop-cart-${shopId}`;
    const saved = localToken.get(key);

    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    } else {
      // If no cart found for this shop, ensure we start empty
      // (Important if just switching from another shop)
      setItems([]);
    }
  }, [shopId]);

  // Save to local storage
  useEffect(() => {
    if (!shopId) return;
    const key = `shop-cart-${shopId}`;
    localToken.set(key, JSON.stringify(items));
  }, [items, shopId]);

  // Add service to cart
  const addService = useCallback((service: Service) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.id === service.id && item.itemType === "service"
      );
      if (existing) {
        return prev; // Already in cart
      }
      const serviceItem: ServiceCartItem = {
        ...service,
        itemType: "service",
        quantity: 1,
      };
      return [...prev, serviceItem];
    });
  }, []);

  // Helper to generate a unique key for cart item (product + variant + extras combo)
  const getExtrasKey = (extras?: SelectedExtra[]) => {
    if (!extras || extras.length === 0) return "";
    return extras
      .map(e => `${e.extraId}:${e.quantity}`)
      .sort()
      .join("|");
  };

  // Calculate extras total
  const calculateExtrasTotal = (extras?: SelectedExtra[]) => {
    if (!extras || extras.length === 0) return 0;
    return extras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
  };

  // Add product to cart (with quantity, variant, extras, and notes)
  const addProduct = useCallback((product: Product, quantity: number = 1, variant?: ProductVariant, extras?: SelectedExtra[], notes?: string) => {
    // Trigger notification
    const itemName = variant ? `${product.name} (${variant.name})` : product.name;
    addNotification(`${itemName} añadido al carrito`, "add");

    setItems((prev) => {
      const extrasKey = getExtrasKey(extras);

      // Find existing item matching ProductID, VariantID, AND same extras combination
      const existingIndex = prev.findIndex(
        (item) =>
          item.itemType === "product" &&
          item.id === product.id &&
          item.variantId === variant?.id &&
          getExtrasKey((item as ProductCartItem).selectedExtras) === extrasKey
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item with same extras
        const updated = [...prev];
        const existing = updated[existingIndex] as ProductCartItem;
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + quantity,
        };
        return updated;
      }

      // Determine price to use
      const unitPrice = variant ? variant.price : product.price;
      const unitPromo = variant ? undefined : product.promoPrice;
      const extrasTotal = calculateExtrasTotal(extras);

      // Add new product
      const productItem: ProductCartItem = {
        itemType: "product",
        id: product.id,
        variantId: variant?.id,
        name: product.name,
        variantName: variant?.name,
        price: unitPrice,
        promoPrice: unitPromo,
        image: product.image,
        quantity,
        selectedExtras: extras,
        extrasTotal,
        notes,
      };
      return [...prev, productItem];
    });
  }, [addNotification]);

  // Update item notes for customization
  const updateItemNotes = useCallback((productId: string, notes: string, variantId?: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.itemType !== "product") return item;
        if (item.id === productId && item.variantId === variantId) {
          return { ...item, notes };
        }
        return item;
      })
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((id: string, variantId?: string) => {
    setItems((prev) => prev.filter((item) => {
      if (item.id !== id) return true;
      if (item.itemType === "product" && item.variantId !== variantId) return true;
      return false;
    }));
  }, []);

  // Update product quantity (Legacy support for simple products)
  const updateProductQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.itemType !== "product") return item;
          if (item.id === productId && item.variantId === variantId) {
            return { ...item, quantity };
          }
          return item;
        })
      );
    },
    [removeItem]
  );

  // New specific helpers
  const updateVariantQuantity = (pid: string, vid: string, qty: number) => updateProductQuantity(pid, qty, vid);
  const removeVariant = (pid: string, vid: string) => removeItem(pid, vid);


  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const getProductQuantity = useCallback(
    (productId: string) => {
      // Returns total quantity across all variants for a product
      return items
        .filter(i => i.id === productId && i.itemType === "product")
        .reduce((sum, i) => sum + i.quantity, 0);
    },
    [items]
  );

  const getVariantQuantity = useCallback(
    (productId: string, variantId: string) => {
      const item = items.find(i => i.id === productId && i.itemType === "product" && (i as ProductCartItem).variantId === variantId);
      return item?.quantity || 0;
    },
    [items]
  );

  // Separate services and products
  const services = items.filter(
    (item): item is ServiceCartItem => item.itemType === "service"
  );
  const products = items.filter(
    (item): item is ProductCartItem => item.itemType === "product"
  );

  // Totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    if (item.itemType === "product") {
      const basePrice = item.promoPrice || item.price;
      const extrasPrice = item.extrasTotal || 0;
      // (basePrice + extras) * quantity
      return sum + (basePrice + extrasPrice) * item.quantity;
    }
    return sum + item.price * item.quantity;
  }, 0);

  const totalDuration = services.reduce(
    (sum, service) => sum + (service.duration || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        services,
        products,
        addService,
        addProduct,
        removeItem,
        updateProductQuantity,
        updateVariantQuantity,
        removeVariant,
        getVariantQuantity,
        updateItemNotes,
        clearCart,
        isInCart,
        getProductQuantity, // Total generic
        totalItems,
        totalPrice,
        totalDuration,
        tableId,
        setTableId,
        notifications,
      }}
    >
      {children}
      {/* Cart Notifications UI */}
      <CartNotifications notifications={notifications} templateType={templateType} />
    </CartContext.Provider>
  );
}

// Cart Notifications Component - Adapts to shop template
// Note: This component receives templateType as prop from CartProvider
function CartNotifications({
  notifications,
  templateType
}: {
  notifications: CartNotification[];
  templateType?: string;
}) {
  if (notifications.length === 0) return null;

  // Determine styles based on template
  const isStreetDrop = templateType === "street-drop-v1";
  const isPremiumDrop = templateType === "premium-drop-v1";

  const getNotificationStyles = () => {
    if (isStreetDrop) {
      return "bg-black border-2 border-[#FF0033] text-white rounded-none shadow-[4px_4px_0px_rgba(255,0,51,1)]";
    }
    if (isPremiumDrop) {
      return "bg-black/95 border border-amber-500/50 text-white rounded-lg shadow-lg shadow-amber-500/20";
    }
    // Standard - uses glass effect with primary color accent
    return "glass-panel text-white rounded-xl shadow-lg border border-white/10";
  };

  const getIconColor = (type: "add" | "remove" | "update") => {
    if (isStreetDrop) {
      return type === "add" ? "text-[#FF0033]" : "text-white";
    }
    if (isPremiumDrop) {
      return type === "add" ? "text-amber-400" : "text-red-400";
    }
    return type === "add" ? "text-primary" : "text-red-400";
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 animate-in slide-in-from-right-5 fade-in duration-300 flex items-center gap-3 max-w-sm ${getNotificationStyles()}`}
        >
          {notification.type === "add" && (
            <span className={`text-lg font-bold ${getIconColor("add")}`}>
              {isStreetDrop ? "+" : "✓"}
            </span>
          )}
          {notification.type === "remove" && (
            <span className={`text-lg ${getIconColor("remove")}`}>✕</span>
          )}
          <span className={`text-sm font-medium ${isStreetDrop ? "uppercase tracking-wider" : ""}`}>
            {notification.message}
          </span>
        </div>
      ))}
    </div>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

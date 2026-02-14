"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect
} from "react";
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
}

export type CartItem = ServiceCartItem | ProductCartItem;

interface CartContextValue {
  items: CartItem[];
  services: ServiceCartItem[];
  products: ProductCartItem[];
  addService: (service: Service) => void;
  addProduct: (product: Product, quantity?: number, variant?: ProductVariant, extras?: SelectedExtra[]) => void;
  removeItem: (id: string, variantId?: string, extrasKey?: string) => void;
  updateProductQuantity: (productId: string, quantity: number, variantId?: string) => void;

  // Variant specifics
  updateVariantQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeVariant: (productId: string, variantId: string) => void;
  getVariantQuantity: (productId: string, variantId: string) => number;

  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getProductQuantity: (productId: string) => number; // Total quantity of product (all variants)
  totalItems: number;
  totalPrice: number;
  totalDuration: number; // For services

  // Phase 26: Restaurant Table Management
  tableId: string | null;
  setTableId: (id: string | null) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children, shopId }: CartProviderProps & { shopId?: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState<string | null>(null);

  // Load from local storage on mount or when shopId changes
  useEffect(() => {
    if (!shopId) return;

    const key = `shop-cart-${shopId}`;
    const saved = localStorage.getItem(key);

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
    localStorage.setItem(key, JSON.stringify(items));
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

  // Add product to cart (with quantity, variant, and extras)
  const addProduct = useCallback((product: Product, quantity: number = 1, variant?: ProductVariant, extras?: SelectedExtra[]) => {
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
      };
      return [...prev, productItem];
    });
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
        clearCart,
        isInCart,
        getProductQuantity, // Total generic
        totalItems,
        totalPrice,
        totalDuration,
        tableId,
        setTableId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

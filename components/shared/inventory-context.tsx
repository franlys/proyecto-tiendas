"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { MOCK_PRODUCTS, type Product } from "@/lib/constants";

interface InventoryContextType {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (id: string, quantity: number, variantId?: string) => void;
  decrementStock: (id: string, quantity: number) => boolean;
  getLowStockProducts: () => Product[];
  saveProduct: (product: Product) => Product;
  isLoading: boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
  shopId: string;
}

const getStorageKey = (shopId: string) => `inventory-${shopId}`;

export function InventoryProvider({ children, shopId }: InventoryProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products from localStorage or use mock data
  useEffect(() => {
    const storageKey = getStorageKey(shopId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setProducts(JSON.parse(stored));
      } else {
        // Initialize with mock data
        const mockProducts = MOCK_PRODUCTS[shopId] || [];
        setProducts(mockProducts);
        localStorage.setItem(storageKey, JSON.stringify(mockProducts));
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      setProducts(MOCK_PRODUCTS[shopId] || []);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  // Save to localStorage when products change
  useEffect(() => {
    if (!isLoading && products.length >= 0) {
      const storageKey = getStorageKey(shopId);
      localStorage.setItem(storageKey, JSON.stringify(products));
    }
  }, [products, isLoading, shopId]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const addProduct = useCallback((product: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...product,
      id: `p-${Date.now()}`,
    };
    setProducts((prev) => [...prev, newProduct]);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateStock = useCallback((id: string, quantity: number, variantId?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        if (variantId && p.variants) {
          // Update variant stock
          const newVariants = p.variants.map((v) =>
            v.id === variantId ? { ...v, stock: Math.max(0, quantity) } : v
          );
          return { ...p, variants: newVariants };
        }

        // Update base stock
        return { ...p, stock: Math.max(0, quantity) };
      })
    );
  }, []);

  const decrementStock = useCallback(
    (id: string, quantity: number): boolean => {
      const product = products.find((p) => p.id === id);
      if (!product || product.stock < quantity) {
        return false;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, stock: p.stock - quantity } : p
        )
      );
      return true;
    },
    [products]
  );

  const getLowStockProducts = useCallback(() => {
    return products.filter((p) => p.stock <= p.lowStockThreshold);
  }, [products]);

  const saveProduct = useCallback((product: Product): Product => {
    const existingProduct = products.find((p) => p.id === product.id);

    if (existingProduct) {
      // Update existing product
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      return product;
    } else {
      // Create new product with generated ID if empty
      const newProduct: Product = {
        ...product,
        id: product.id || `p-${Date.now()}`,
      };
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    }
  }, [products]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        getProduct,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        decrementStock,
        getLowStockProducts,
        saveProduct,
        isLoading,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}

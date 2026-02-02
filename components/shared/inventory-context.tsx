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
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const debugLog = (msg: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Inventory] ${msg}`, ...args);
  }
};

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

  // Helper to get Firestore ref
  const getCollectionRef = useCallback(() => {
    // We store products in a subcollection: shops/{shopId}/products
    return collection(db, "shops", shopId, "products");
  }, [shopId]);

  // Load products from Firestore
  useEffect(() => {
    async function loadInventory() {
      if (!shopId) return;

      setIsLoading(true);
      try {
        debugLog(`INVENTORY: Loading for shop ${shopId}...`);

        // 1. Try Firestore
        const q = query(getCollectionRef(), orderBy("name"));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const cloudProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];

          setProducts(cloudProducts);
          // Update local cache
          localStorage.setItem(getStorageKey(shopId), JSON.stringify(cloudProducts));
          debugLog(`INVENTORY: Loaded ${cloudProducts.length} items from Cloud ☁️`);
        } else {
          // 2. Fallback to LocalStorage (Offline or First Run)
          debugLog("INVENTORY: Cloud empty, checking local storage...");
          const stored = localStorage.getItem(getStorageKey(shopId));

          if (stored) {
            const localProducts = JSON.parse(stored);
            setProducts(localProducts);
            debugLog("INVENTORY: Loaded from LocalStorage 💾");

            // OPTIONAL: Sync local to cloud?
            // Not doing automatically to avoid overwriting if just empty query
          } else {
            // 3. Fallback to Mocks (First run ever)
            debugLog("INVENTORY: No data found, seeding mocks.");
            const mockProducts = MOCK_PRODUCTS[shopId] || [];
            setProducts(mockProducts);
          }
        }
      } catch (error) {
        console.error("Error loading inventory:", error);
        // Fallback to local on error
        const stored = localStorage.getItem(getStorageKey(shopId));
        if (stored) setProducts(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    }

    loadInventory();
  }, [shopId, getCollectionRef]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newProduct: Product = { ...product, id: tempId };

    setProducts((prev) => [...prev, newProduct]);

    try {
      // Write to Cloud
      // If we want auto-ID from firestore:
      const colRef = getCollectionRef();
      const docRef = await addDoc(colRef, product);

      // Update with real ID
      const finalProduct = { ...product, id: docRef.id };
      setProducts(prev => prev.map(p => p.id === tempId ? finalProduct : p));

      // Update Cache
      const current = [...products, finalProduct]; // Approximation
      localStorage.setItem(getStorageKey(shopId), JSON.stringify(current));
    } catch (e) {
      console.error("Error adding product to cloud:", e);
      // Revert or flag error? For now, keep local optimistic version but alert
      // In a real app we'd show a toast "Failed to save online"
    }
  }, [getCollectionRef, products, shopId]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    // Optimistic
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      const docRef = doc(db, "shops", shopId, "products", id);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error updating product in cloud:", e);
    }
  }, [shopId]);

  const deleteProduct = useCallback(async (id: string) => {
    // Optimistic
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const docRef = doc(db, "shops", shopId, "products", id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting product in cloud:", e);
    }
  }, [shopId]);

  const updateStock = useCallback((id: string, quantity: number, variantId?: string) => {
    // NOTE: Does not sync to cloud immediately to avoid spamming writes on every click?
    // Ideally we should denounce or just write. Let's write for simplicity.
    const product = products.find(p => p.id === id);
    if (!product) return;

    let updates: Partial<Product> = {};

    if (variantId && product.variants) {
      const newVariants = product.variants.map((v) =>
        v.id === variantId ? { ...v, stock: Math.max(0, quantity) } : v
      );
      updates = { variants: newVariants };
    } else {
      updates = { stock: Math.max(0, quantity) };
    }

    updateProduct(id, updates);
  }, [products, updateProduct]);

  const decrementStock = useCallback(
    (id: string, quantity: number): boolean => {
      const product = products.find((p) => p.id === id);
      if (!product || product.stock < quantity) {
        return false;
      }

      const newStock = product.stock - quantity;
      updateProduct(id, { stock: newStock });
      return true;
    },
    [products, updateProduct]
  );

  const getLowStockProducts = useCallback(() => {
    return products.filter((p) => p.stock <= p.lowStockThreshold);
  }, [products]);

  const saveProduct = useCallback((product: Product): Product => {
    // Adapter for Admin Form
    if (products.some(p => p.id === product.id)) {
      updateProduct(product.id, product);
      return product;
    } else {
      // Since addProduct is async/void, we just fire it. 
      // The ID logic here is tricky because addProduct generates ID.
      // For this legacy signature, we might need adjustments.
      // But assuming the user passes a product *without* ID for creation...
      const { id, ...data } = product;
      if (!id || id.startsWith("temp-")) {
        addProduct(data as Product);
      } else {
        // Has ID but not found in state? Weird case. Treat as update.
        updateProduct(id, data);
      }
      return product;
    }
  }, [products, updateProduct, addProduct]);

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

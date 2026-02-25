"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { MOCK_PRODUCTS, type Product } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { localToken } from "@/lib/utils/safe-storage";
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
          const cloudProducts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Ensure variants is always an array (Firestore might not return it if empty/undefined)
              variants: data.variants || [],
            } as Product;
          });

          setProducts(cloudProducts);
          // Update local cache
          localToken.set(getStorageKey(shopId), JSON.stringify(cloudProducts));
          debugLog(`INVENTORY: Loaded ${cloudProducts.length} items from Cloud ☁️`);
        } else {
          // 2. Fallback to LocalStorage (Offline or First Run)
          debugLog("INVENTORY: Cloud empty, checking local storage...");
          const stored = localToken.get(getStorageKey(shopId));

          if (stored) {
            const localProducts = JSON.parse(stored).map((p: Product) => ({
              ...p,
              variants: p.variants || [], // Ensure variants is always an array
            }));
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
        const stored = localToken.get(getStorageKey(shopId));
        if (stored) {
          const localProducts = JSON.parse(stored).map((p: Product) => ({
            ...p,
            variants: p.variants || [], // Ensure variants is always an array
          }));
          setProducts(localProducts);
        }
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

  // Helper to deeply clean undefined values from objects (Firestore doesn't accept undefined)
  const cleanForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => cleanForFirestore(item));
    }
    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, cleanForFirestore(v)])
      );
    }
    return obj;
  };

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newProduct: Product = { ...product, id: tempId };

    setProducts((prev) => [...prev, newProduct]);

    try {
      // Write to Cloud
      const colRef = getCollectionRef();
      // Deep clean undefined values to avoid Firestore error
      const cleanProduct = cleanForFirestore(product);
      console.log("[Inventory] Saving product to Firestore:", cleanProduct);
      console.log("[Inventory] Collection path:", `shops/${shopId}/products`);
      const docRef = await addDoc(colRef, cleanProduct);

      // Update with real ID
      const finalProduct = { ...product, id: docRef.id };
      setProducts(prev => prev.map(p => p.id === tempId ? finalProduct : p));

      // Update Cache
      const current = [...products, finalProduct]; // Approximation
      localToken.set(getStorageKey(shopId), JSON.stringify(current));

      toast.success("Producto guardado", {
        description: `"${product.name}" se guardó correctamente en la nube.`,
      });
    } catch (e) {
      console.error("Error adding product to cloud:", e);
      // IMPORTANT: Revert the optimistic update since it failed
      setProducts(prev => prev.filter(p => p.id !== tempId));

      toast.error("Error al guardar producto", {
        description: `No se pudo guardar "${product.name}" en la nube. Verifica tu conexión e intenta de nuevo.`,
        duration: 10000,
      });
    }
  }, [getCollectionRef, products, shopId]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    // Store original for rollback
    const originalProduct = products.find(p => p.id === id);

    // Optimistic
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      const docRef = doc(db, "shops", shopId, "products", id);
      // Deep clean undefined values to avoid Firestore error
      const cleanUpdates = cleanForFirestore(updates);
      console.log("[Inventory] Updating product in Firestore:", id, cleanUpdates);
      await updateDoc(docRef, cleanUpdates);

      // Only show toast for significant updates (not stock changes)
      if (updates.name || updates.price || updates.category) {
        toast.success("Producto actualizado");
      }
    } catch (e) {
      console.error("Error updating product in cloud:", e);
      // Rollback
      if (originalProduct) {
        setProducts(prev => prev.map(p => p.id === id ? originalProduct : p));
      }
      toast.error("Error al actualizar", {
        description: "No se pudo guardar los cambios. Intenta de nuevo.",
        duration: 8000,
      });
    }
  }, [shopId, products]);

  const deleteProduct = useCallback(async (id: string) => {
    // Store for rollback
    const deletedProduct = products.find(p => p.id === id);

    // Optimistic
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const docRef = doc(db, "shops", shopId, "products", id);
      await deleteDoc(docRef);
      toast.success("Producto eliminado");
    } catch (e) {
      console.error("Error deleting product in cloud:", e);
      // Rollback
      if (deletedProduct) {
        setProducts(prev => [...prev, deletedProduct]);
      }
      toast.error("Error al eliminar", {
        description: "No se pudo eliminar el producto. Intenta de nuevo.",
        duration: 8000,
      });
    }
  }, [shopId, products]);

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
    return products.filter((p) => {
      // Ensure numeric comparison (Firestore may store as strings)
      const threshold = Number(p.lowStockThreshold) || 5; // Default 5 if not set

      // If product has variants, check total stock across all variants
      if (p.variants && p.variants.length > 0) {
        const totalVariantStock = p.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
        return totalVariantStock <= threshold;
      }

      // Otherwise check main stock
      const stock = Number(p.stock) || 0;
      return stock <= threshold;
    });
  }, [products]);

  const saveProduct = useCallback((product: Product): Product => {
    // Adapter for Admin Form
    // Check if product exists in current state (means we're updating)
    if (products.some(p => p.id === product.id)) {
      updateProduct(product.id, product);
      return product;
    } else {
      // New product - check for temporary IDs (new- or temp- prefix)
      const { id, ...data } = product;
      const isTemporaryId = !id || id.startsWith("temp-") || id.startsWith("new-");

      if (isTemporaryId) {
        // Create new product in Firestore
        addProduct(data as Omit<Product, "id">);
        debugLog("Creating new product:", data);
      } else {
        // Has a real-looking ID but not found in state - treat as new anyway
        // This can happen if state is out of sync
        addProduct(data as Omit<Product, "id">);
        debugLog("Creating product (ID not in state):", data);
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

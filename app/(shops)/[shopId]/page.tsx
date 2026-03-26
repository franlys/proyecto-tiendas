"use client";

import { useState, useMemo, useEffect } from "react";
import { useShop, useCart } from "@/components/shared";
import {
  MOCK_SERVICES,
  MOCK_PRODUCTS,
  type ServiceCategory,
  type Service,
  type Product,
} from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import {
  TrainingPackage,
  FREQUENCY_LABELS,
  BILLING_CYCLE_LABELS
} from "@/lib/types/training-package.types";
import { resolveTemplate } from "@/lib/templates/component-registry";
import { TechPremiumV2Home } from "@/components/shop/templates/tech-premium-v2-home";

type TabType = "servicios" | "productos";

export default function ShopHomePage() {
  const shop = useShop();
  const { setTableId, tableId } = useCart();
  const searchParams = useSearchParams();

  // State for Real Data
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load Data (Real or Mock)
  useEffect(() => {
    async function loadShopData() {
      console.log("🏪 [CATALOG] Shop object:", {
        id: shop?.id,
        slug: shop?.slug,
        name: shop?.name,
        businessType: shop?.businessType,
      });

      if (!shop?.id || !shop?.slug) {
        console.warn("⚠️ [CATALOG] Shop ID or Slug is missing!", { id: shop?.id, slug: shop?.slug });
        return;
      }

      setLoadingData(true);

      // 1. Check if it's a Demo Shop (keep using Mocks for demos)
      const isDemo = shop.id.startsWith("demo-") || shop.id.startsWith("legacy-");

      if (isDemo) {
        setServices(MOCK_SERVICES[shop.slug] || []);
        setProducts(MOCK_PRODUCTS[shop.slug] || []);
        setLoadingData(false);
        return;
      }

      // 2. Fetch Real Data from Firestore
      // IMPORTANT: Historically, products/services might have been saved under shop.slug OR shop.id
      // We check both paths and merge the results to guarantee we find the data.
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, getDocs } = await import("firebase/firestore");

        const shopPathId = shop.id;
        const shopPathSlug = shop.slug;
        const pathsToTry = shopPathId === shopPathSlug ? [shopPathId] : [shopPathId, shopPathSlug];

        const seenIds = new Set<string>();
        const servicesData: Service[] = [];
        let productsData: Product[] = [];

        for (const path of pathsToTry) {
          // Fetch Services from BOTH collections and merge
          const servicesLegacyRef = collection(db, "shops", path, "services");
          const servicesNewRef = collection(db, "shops", path, "bookingServices");

          const [legacySnap, newSnap] = await Promise.all([
            getDocs(servicesLegacyRef),
            getDocs(servicesNewRef),
          ]);

          const addService = (doc: any) => {
            if (seenIds.has(doc.id)) return;
            seenIds.add(doc.id);
            const data = doc.data();
            // Only include active services
            if (data.isActive !== false) {
              servicesData.push({ id: doc.id, ...data } as Service);
            }
          };

          legacySnap.docs.forEach(addService);
          newSnap.docs.forEach(addService);

          // Fetch Training Packages
          try {
            const trainingRef = collection(db, "shops", path, "training-packages");
            const trainingSnap = await getDocs(trainingRef);

            trainingSnap.docs.forEach(docSnap => {
              if (seenIds.has(docSnap.id)) return;
              seenIds.add(docSnap.id);

              const data = docSnap.data() as TrainingPackage;
              if (data.isActive !== false) {
                servicesData.push({
                  id: docSnap.id,
                  name: data.name,
                  description: `${data.description || ""}${data.description ? ". " : ""}${FREQUENCY_LABELS[data.sessionsPerWeek]} / ${BILLING_CYCLE_LABELS[data.billingCycle]}`,
                  price: data.price,
                  duration: data.sessionDuration,
                  category: "entrenamiento",
                  image: data.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac0050?w=400&h=400&fit=crop",
                } as Service);
              }
            });
          } catch (err) {
            console.error("Error loading training packages:", err);
          }

          // Fetch Products
          const productsRef = collection(db, "shops", path, "products");
          const productsSnap = await getDocs(productsRef);

          productsSnap.docs.forEach(doc => {
            if (seenIds.has(doc.id)) return;
            seenIds.add(doc.id);
            productsData.push({ id: doc.id, ...doc.data() } as Product);
          });
        }

        setServices(servicesData);
        setProducts(productsData);

        console.log("✅ [DEBUG] Real Data Fetched:", {
          pathsTried: pathsToTry,
          servicesCount: servicesData.length,
          productsCount: productsData.length,
        });

      } catch (error) {
        console.error("❌ [DEBUG] Error loading shop data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadShopData();
  }, [shop?.id, shop?.slug]);
  // 2. Render appropriate template based on settings
  const Layout = resolveTemplate(shop?.templateType);

  // tech-premium-v2 has a dedicated homepage with feature cards
  if (shop?.templateType === "tech-premium-v2") {
    return <TechPremiumV2Home shop={shop as any} />;
  }

  return (
    <Layout
      shop={shop as any}
      products={products}
      services={services}
      loadingData={loadingData}
    />
  );
}

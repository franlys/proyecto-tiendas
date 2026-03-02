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
import { StandardShopLayout } from "@/components/shop/templates/standard-shop-layout";
import { PremiumDropLayout } from "@/components/shop/templates/premium-drop-layout";
import { StreetDropLayout } from "@/components/shop/templates/street-drop-layout";
import { CosmicDropLayout } from "@/components/shop/templates/cosmic-drop-layout";

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
      // IMPORTANT: Products/Services are stored using SLUG as the path (shops/{slug}/products)
      // because that's how the inventory system saves them
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, getDocs } = await import("firebase/firestore");

        // Fetch Services from BOTH collections and merge
        // Services can be in 'services' (legacy) or 'bookingServices' (new)
        // ALways use the real document ID for the database path
        const shopPath = shop.id;
        const servicesLegacyRef = collection(db, "shops", shopPath, "services");
        const servicesNewRef = collection(db, "shops", shopPath, "bookingServices");

        const [legacySnap, newSnap] = await Promise.all([
          getDocs(servicesLegacyRef),
          getDocs(servicesNewRef),
        ]);

        // Merge services, avoiding duplicates by ID
        const seenIds = new Set<string>();
        const servicesData: Service[] = [];

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
          // Training packages use the REAL ID for the collection path
          const trainingRef = collection(db, "shops", shopPath, "training-packages");
          const trainingSnap = await getDocs(trainingRef);

          trainingSnap.docs.forEach(docSnap => {
            const data = docSnap.data() as TrainingPackage;
            if (data.isActive !== false) {
              // Map TrainingPackage to Service
              servicesData.push({
                id: docSnap.id,
                name: data.name,
                description: `${data.description || ""}${data.description ? ". " : ""}${FREQUENCY_LABELS[data.sessionsPerWeek]} / ${BILLING_CYCLE_LABELS[data.billingCycle]}`,
                price: data.price,
                duration: data.sessionDuration,
                category: "entrenamiento",
                image: data.image || "https://images.unsplash.com/photo-1517836357463-d25dfeac0050?w=400&h=400&fit=crop", // GYM default fallback
              } as Service);
            }
          });
        } catch (err) {
          console.error("Error loading training packages:", err);
        }

        setServices(servicesData);

        // Fetch Products
        const productsRef = collection(db, "shops", shopPath, "products");
        const productsSnap = await getDocs(productsRef);
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        console.log("✅ [DEBUG] Real Data Fetched:", {
          shopPath,
          servicesCount: servicesData.length,
          productsCount: productsData.length,
          servicesFromLegacy: legacySnap.size,
          servicesFromNew: newSnap.size,
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
  // Pass the loaded catalog to the respective layout component
  const templateRoot = () => {
    console.log("🎨 [TEMPLATE] Current templateType:", shop?.templateType, "| Shop:", shop?.name);
    switch (shop?.templateType) {
      case "premium-drop-v1":
        return (
          <PremiumDropLayout
            shop={shop as any}
            products={products}
            services={services}
            loadingData={loadingData}
          />
        );
      case "street-drop-v1":
        return (
          <StreetDropLayout
            shop={shop as any}
            products={products}
            services={services}
            loadingData={loadingData}
          />
        );
      case "cosmic-drop-v1":
        return (
          <CosmicDropLayout
            shop={shop as any}
            products={products}
            services={services}
            loadingData={loadingData}
          />
        );
      case "standard":
      default:
        return (
          <StandardShopLayout
            shop={shop as any}
            products={products}
            services={services}
            loadingData={loadingData}
          />
        );
    }
  };

  return templateRoot();
}

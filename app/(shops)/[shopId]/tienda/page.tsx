"use client";

import { useState, useEffect } from "react";
import { useShop, useCart } from "@/components/shared";
import {
  MOCK_SERVICES,
  MOCK_PRODUCTS,
  type Service,
  type Product,
} from "@/lib/constants";
import { useSearchParams } from "next/navigation";
import {
  TrainingPackage,
  FREQUENCY_LABELS,
  BILLING_CYCLE_LABELS,
} from "@/lib/types/training-package.types";
import { TechPremiumV2Layout } from "@/components/shop/templates/tech-premium-v2-layout";

export default function ShopTiendaPage() {
  const shop = useShop();
  const { setTableId } = useCart();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    if (tableParam) setTableId(tableParam);
  }, [searchParams, setTableId]);

  useEffect(() => {
    async function loadShopData() {
      if (!shop?.id || !shop?.slug) return;
      setLoadingData(true);

      const isDemo = shop.id.startsWith("demo-") || shop.id.startsWith("legacy-");
      if (isDemo) {
        setServices(MOCK_SERVICES[shop.slug] || []);
        setProducts(MOCK_PRODUCTS[shop.slug] || []);
        setLoadingData(false);
        return;
      }

      try {
        const { db } = await import("@/lib/firebase");
        const { collection, getDocs } = await import("firebase/firestore");

        const pathsToTry = shop.id === shop.slug ? [shop.id] : [shop.id, shop.slug];
        const seenIds = new Set<string>();
        const servicesData: Service[] = [];
        const productsData: Product[] = [];

        for (const path of pathsToTry) {
          const [legacySnap, newSnap] = await Promise.all([
            getDocs(collection(db, "shops", path, "services")),
            getDocs(collection(db, "shops", path, "bookingServices")),
          ]);

          const addService = (docSnap: any) => {
            if (seenIds.has(docSnap.id)) return;
            seenIds.add(docSnap.id);
            const data = docSnap.data();
            if (data.isActive !== false) servicesData.push({ id: docSnap.id, ...data } as Service);
          };
          legacySnap.docs.forEach(addService);
          newSnap.docs.forEach(addService);

          try {
            const trainingSnap = await getDocs(collection(db, "shops", path, "training-packages"));
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
          } catch {}

          const productsSnap = await getDocs(collection(db, "shops", path, "products"));
          productsSnap.docs.forEach(docSnap => {
            if (seenIds.has(docSnap.id)) return;
            seenIds.add(docSnap.id);
            productsData.push({ id: docSnap.id, ...docSnap.data() } as Product);
          });
        }

        setServices(servicesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading shop data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    loadShopData();
  }, [shop?.id, shop?.slug]);

  return (
    <TechPremiumV2Layout
      shop={shop as any}
      products={products}
      services={services}
      loadingData={loadingData}
      showHomeLink
    />
  );
}

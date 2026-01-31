import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { FirestoreShop, Shop } from "@/types/shop.types";
import type { FeatureId } from "@/types/feature.types";
import { SYSTEM_FEATURES } from "@/types/feature.types";
import { Timestamp } from "firebase/firestore";

const COLLECTION = "shops";

// Convertir Firestore doc a Shop (helper local)
function docToShop(id: string, data: FirestoreShop): Shop {
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    category: data.category,
    businessType: data.businessType,
    isActive: data.isActive,
    theme: data.theme,
    contact: data.contact,
    subscription: data.subscription,
    enabledFeatures: data.enabledFeatures || [],
    limits: data.limits,
    wholesaleEnabled: data.wholesaleEnabled,
    ownerUsername: data.ownerUsername,
    ownerPassword: data.ownerPassword,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : new Date().toISOString(),
  };
}

// Respuesta de features de una shop
export interface ShopFeaturesResponse {
  shopId: string;
  enabledFeatures: FeatureId[];
  allFeatures: typeof SYSTEM_FEATURES;
}

// Obtener features de una shop
export async function getShopFeatures(
  shopId: string
): Promise<ShopFeaturesResponse> {
  const docRef = doc(db, COLLECTION, shopId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = snapshot.data() as FirestoreShop;
  const enabledFeatures = (data.enabledFeatures || []) as FeatureId[];

  return {
    shopId,
    enabledFeatures,
    allFeatures: SYSTEM_FEATURES,
  };
}

// Actualizar todos los features de una shop
export async function updateShopFeatures(
  shopId: string,
  enabledFeatures: FeatureId[]
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  await updateDoc(docRef, {
    enabledFeatures,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Habilitar un feature
export async function enableFeature(
  shopId: string,
  featureId: FeatureId
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = existing.data() as FirestoreShop;
  const features = [...(data.enabledFeatures || [])];

  if (!features.includes(featureId)) {
    features.push(featureId);
  }

  await updateDoc(docRef, {
    enabledFeatures: features,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Deshabilitar un feature
export async function disableFeature(
  shopId: string,
  featureId: FeatureId
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = existing.data() as FirestoreShop;
  const features = (data.enabledFeatures || []).filter(
    (f) => f !== featureId
  );

  await updateDoc(docRef, {
    enabledFeatures: features,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Verificar si una shop tiene acceso a un feature
export async function hasFeature(
  shopId: string,
  featureId: FeatureId
): Promise<boolean> {
  const features = await getShopFeatures(shopId);
  return features.enabledFeatures.includes(featureId);
}

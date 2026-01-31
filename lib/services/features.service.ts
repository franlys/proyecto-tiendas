import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { FirestoreShop, Shop } from "@/types/shop.types";
import type {
  FeatureId,
  ShopFeaturesResponse,
  UpdateShopFeaturesInput,
} from "@/types/feature.types";
import { DEFAULT_PLANS, type PlanId } from "@/types/plan.types";
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
    customFeatures: data.customFeatures || [],
    disabledFeatures: data.disabledFeatures || [],
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
  const planId = (data.subscription?.planId || "basic") as PlanId;
  const plan = DEFAULT_PLANS[planId];

  if (!plan) {
    throw new Error("Plan no válido");
  }

  const planFeatures = plan.features as FeatureId[];
  const customFeatures = (data.customFeatures || []) as FeatureId[];
  const disabledFeatures = (data.disabledFeatures || []) as FeatureId[];

  // Calcular features efectivos
  const effectiveFeatures = [
    ...planFeatures.filter((f) => !disabledFeatures.includes(f)),
    ...customFeatures.filter((f) => !planFeatures.includes(f)),
  ];

  return {
    shopId,
    planId,
    planFeatures,
    customFeatures,
    disabledFeatures,
    effectiveFeatures,
  };
}

// Actualizar features personalizados de una shop
export async function updateShopFeatures(
  shopId: string,
  input: UpdateShopFeaturesInput
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.customFeatures !== undefined) {
    updateData.customFeatures = input.customFeatures;
  }

  if (input.disabledFeatures !== undefined) {
    updateData.disabledFeatures = input.disabledFeatures;
  }

  await updateDoc(docRef, updateData);

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Añadir un feature custom a una shop
export async function addCustomFeature(
  shopId: string,
  featureId: FeatureId
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = existing.data() as FirestoreShop;
  const customFeatures = data.customFeatures || [];

  // No añadir si ya existe
  if (customFeatures.includes(featureId)) {
    return docToShop(existing.id, data);
  }

  // Remover de disabled si estaba ahí
  const disabledFeatures = (data.disabledFeatures || []).filter(
    (f) => f !== featureId
  );

  await updateDoc(docRef, {
    customFeatures: [...customFeatures, featureId],
    disabledFeatures,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Remover un feature custom de una shop
export async function removeCustomFeature(
  shopId: string,
  featureId: FeatureId
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = existing.data() as FirestoreShop;
  const customFeatures = (data.customFeatures || []).filter(
    (f) => f !== featureId
  );

  await updateDoc(docRef, {
    customFeatures,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Deshabilitar un feature del plan para una shop
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
  const disabledFeatures = data.disabledFeatures || [];

  // No añadir si ya existe
  if (disabledFeatures.includes(featureId)) {
    return docToShop(existing.id, data);
  }

  // Remover de custom si estaba ahí
  const customFeatures = (data.customFeatures || []).filter(
    (f) => f !== featureId
  );

  await updateDoc(docRef, {
    disabledFeatures: [...disabledFeatures, featureId],
    customFeatures,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Re-habilitar un feature del plan para una shop
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
  const disabledFeatures = (data.disabledFeatures || []).filter(
    (f) => f !== featureId
  );

  await updateDoc(docRef, {
    disabledFeatures,
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
  return features.effectiveFeatures.includes(featureId);
}

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type {
  Shop,
  FirestoreShop,
  CreateShopInput,
  UpdateShopInput,
  ShopTheme,
  SubscriptionStatus,
} from "@/types";
import type { FeatureId } from "@/types/feature.types";

const COLLECTION = "shops";

// Tema por defecto
const DEFAULT_THEME: ShopTheme = {
  id: "default",
  name: "Linko Default",
  primaryColor: "#06b6d4",
  backgroundColor: "#0f172a",
};

// Features básicos que todas las tiendas nuevas tienen
const DEFAULT_FEATURES: FeatureId[] = [
  "inventory",
  "orders",
  "crm",
  "clientHistory",
];

// Precio mensual por defecto
const DEFAULT_MONTHLY_PRICE = 299;

// Convertir Firestore doc a Shop
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
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString(),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : new Date().toISOString(),
  };
}

// Obtener fecha del próximo mes
function getNextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

// Listar todas las shops
export async function listShops(): Promise<Shop[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    docToShop(doc.id, doc.data() as FirestoreShop)
  );
}

// Obtener shop por ID
export async function getShopById(shopId: string): Promise<Shop | null> {
  const docRef = doc(db, COLLECTION, shopId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToShop(snapshot.id, snapshot.data() as FirestoreShop);
}

// Obtener shop por slug
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const q = query(collection(db, COLLECTION), where("slug", "==", slug));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToShop(doc.id, doc.data() as FirestoreShop);
}

// Verificar si slug existe
export async function slugExists(slug: string): Promise<boolean> {
  const shop = await getShopBySlug(slug);
  return shop !== null;
}

// Crear nueva shop
export async function createShop(input: CreateShopInput): Promise<Shop> {
  // Verificar si el slug ya existe
  if (await slugExists(input.slug)) {
    throw new Error("El slug ya está en uso");
  }

  const shopData: Omit<FirestoreShop, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    name: input.name,
    slug: input.slug,
    description: input.description || "",
    category: input.category,
    businessType:
      input.category === "beauty"
        ? "beauty"
        : input.category === "repair"
          ? "repair"
          : "retail",
    isActive: true,
    theme: {
      ...DEFAULT_THEME,
      id: `theme-${input.slug}`,
      name: `${input.name} Theme`,
    },
    contact: {
      phone: input.phone,
    },
    subscription: {
      status: "trial",
      nextPaymentDate: getNextMonthDate(),
      monthlyPrice: input.monthlyPrice || DEFAULT_MONTHLY_PRICE,
    },
    enabledFeatures: input.enabledFeatures || DEFAULT_FEATURES,
    wholesaleEnabled: input.wholesaleEnabled || false,
    ownerUsername: input.slug,
    ownerPassword: "123456",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), shopData);

  return {
    id: docRef.id,
    ...shopData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Shop;
}

// Actualizar shop
export async function updateShop(
  shopId: string,
  input: UpdateShopInput
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) {
    updateData.category = input.category;
    updateData.businessType =
      input.category === "beauty"
        ? "beauty"
        : input.category === "repair"
          ? "repair"
          : "retail";
  }
  if (input.wholesaleEnabled !== undefined) {
    updateData.wholesaleEnabled = input.wholesaleEnabled;
  }
  if (input.phone !== undefined) {
    updateData["contact.phone"] = input.phone;
  }
  if (input.email !== undefined) {
    updateData["contact.email"] = input.email;
  }
  if (input.address !== undefined) {
    updateData["contact.address"] = input.address;
  }
  if (input.monthlyPrice !== undefined) {
    updateData["subscription.monthlyPrice"] = input.monthlyPrice;
  }
  if (input.theme !== undefined) {
    const existingData = existing.data() as FirestoreShop;
    updateData.theme = { ...existingData.theme, ...input.theme };
  }

  await updateDoc(docRef, updateData);

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Toggle estado activo/inactivo
export async function toggleShopActive(shopId: string): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const data = existing.data() as FirestoreShop;
  await updateDoc(docRef, {
    isActive: !data.isActive,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Eliminar shop
export async function deleteShop(shopId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  await deleteDoc(docRef);
}

// Actualizar credenciales del owner
export async function updateShopCredentials(
  shopId: string,
  username: string,
  password: string
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  await updateDoc(docRef, {
    ownerUsername: username,
    ownerPassword: password,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Actualizar estado de suscripción
export async function updateSubscriptionStatus(
  shopId: string,
  status: SubscriptionStatus
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  await updateDoc(docRef, {
    "subscription.status": status,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Registrar pago (cobro manual)
export async function registerPayment(
  shopId: string,
  notes?: string
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  const updateData: Record<string, unknown> = {
    "subscription.status": "active",
    "subscription.lastPaymentDate": new Date().toISOString(),
    "subscription.nextPaymentDate": getNextMonthDate(),
    updatedAt: serverTimestamp(),
  };

  if (notes) {
    updateData["subscription.notes"] = notes;
  }

  await updateDoc(docRef, updateData);

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}

// Actualizar precio mensual
export async function updateMonthlyPrice(
  shopId: string,
  price: number
): Promise<Shop> {
  const docRef = doc(db, COLLECTION, shopId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Shop no encontrada");
  }

  await updateDoc(docRef, {
    "subscription.monthlyPrice": price,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToShop(updated.id, updated.data() as FirestoreShop);
}


import { db, auth } from "@/lib/firebase";
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
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import type {
  User,
  FirestoreUser,
  CreateUserInput,
  UpdateUserInput,
  ResetPasswordResponse,
} from "@/types/user.types";

const COLLECTION = "users";

// Convertir Firestore doc a User
function docToUser(id: string, data: FirestoreUser): User {
  return {
    id,
    email: data.email,
    name: data.name,
    role: data.role,
    staffRole: data.staffRole,
    shopId: data.shopId,
    isActive: data.isActive,
    phone: data.phone,
    avatar: data.avatar,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : new Date().toISOString(),
    lastLoginAt:
      data.lastLoginAt instanceof Timestamp
        ? data.lastLoginAt.toDate().toISOString()
        : undefined,
  };
}

// Generar contraseña aleatoria
function generateRandomPassword(length: number = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Listar todos los usuarios
export async function listUsers(): Promise<User[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    docToUser(doc.id, doc.data() as FirestoreUser)
  );
}

// Listar usuarios por shop
export async function listUsersByShop(shopId: string): Promise<User[]> {
  const q = query(
    collection(db, COLLECTION),
    where("shopId", "==", shopId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    docToUser(doc.id, doc.data() as FirestoreUser)
  );
}

// Obtener usuario por ID
export async function getUserById(userId: string): Promise<User | null> {
  const docRef = doc(db, COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToUser(snapshot.id, snapshot.data() as FirestoreUser);
}

// Obtener usuario por email
export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(
    collection(db, COLLECTION),
    where("email", "==", email.toLowerCase())
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data() as FirestoreUser);
}

// Crear nuevo usuario
export async function createUser(input: CreateUserInput): Promise<User> {
  // Verificar si el email ya existe
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("El email ya está registrado");
  }

  // Crear usuario en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password
  );

  // Crear documento en Firestore
  const userData: Omit<FirestoreUser, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    email: input.email.toLowerCase(),
    name: input.name,
    role: input.role,
    staffRole: input.staffRole,
    shopId: input.shopId,
    isActive: true,
    phone: input.phone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Usar el UID de Firebase Auth como ID del documento
  const docRef = doc(db, COLLECTION, userCredential.user.uid);
  await addDoc(collection(db, COLLECTION), {
    ...userData,
    authUid: userCredential.user.uid,
  });

  return {
    id: userCredential.user.uid,
    ...userData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as User;
}

// Actualizar usuario
export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<User> {
  const docRef = doc(db, COLLECTION, userId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Usuario no encontrado");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.avatar !== undefined) updateData.avatar = input.avatar;
  if (input.staffRole !== undefined) updateData.staffRole = input.staffRole;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  await updateDoc(docRef, updateData);

  const updated = await getDoc(docRef);
  return docToUser(updated.id, updated.data() as FirestoreUser);
}

// Toggle estado activo/inactivo
export async function toggleUserActive(userId: string): Promise<User> {
  const docRef = doc(db, COLLECTION, userId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Usuario no encontrado");
  }

  const data = existing.data() as FirestoreUser;
  await updateDoc(docRef, {
    isActive: !data.isActive,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(docRef);
  return docToUser(updated.id, updated.data() as FirestoreUser);
}

// Eliminar usuario
export async function deleteUser(userId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, userId);
  const existing = await getDoc(docRef);

  if (!existing.exists()) {
    throw new Error("Usuario no encontrado");
  }

  // TODO: También eliminar de Firebase Auth si es necesario
  await deleteDoc(docRef);
}

// Reset de contraseña - enviar email
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Reset de contraseña - generar nueva contraseña
export async function resetPassword(
  userId: string,
  newPassword?: string,
  sendEmail: boolean = false
): Promise<ResetPasswordResponse> {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const password = newPassword || generateRandomPassword();

  try {
    // Opción 1: Enviar email de reset (usuario debe cambiar)
    if (sendEmail) {
      await sendPasswordResetEmail(auth, user.email);
      return {
        success: true,
        message: `Se ha enviado un email de recuperación a ${user.email}`,
      };
    }

    // Opción 2: Cambiar directamente (requiere Admin SDK en backend)
    // Por ahora, devolvemos la contraseña temporal
    // En producción, esto debería hacerse con Firebase Admin SDK
    return {
      success: true,
      message: "Contraseña temporal generada",
      temporaryPassword: password,
    };
  } catch (error) {
    throw new Error(
      `Error al resetear contraseña: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Actualizar último login
export async function updateLastLogin(userId: string): Promise<void> {
  const docRef = doc(db, COLLECTION, userId);
  await updateDoc(docRef, {
    lastLoginAt: serverTimestamp(),
  });
}

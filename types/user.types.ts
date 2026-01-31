import { Timestamp } from "firebase/firestore";

// Roles del sistema
export type UserRole = "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_STAFF";

// Roles de staff dentro de una tienda
export type StaffRole = "owner" | "manager" | "sales" | "warehouse";

// Usuario en Firestore
export interface FirestoreUser {
  // Identificación
  email: string;
  name: string;

  // Rol y permisos
  role: UserRole;
  staffRole?: StaffRole;

  // Asociación a tienda (para SHOP_OWNER y SHOP_STAFF)
  shopId?: string;

  // Estado
  isActive: boolean;

  // Perfil
  phone?: string;
  avatar?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

// Usuario con ID (para uso en frontend)
export interface User extends Omit<FirestoreUser, "createdAt" | "updatedAt" | "lastLoginAt"> {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Input para crear usuario
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  shopId?: string;
  staffRole?: StaffRole;
  phone?: string;
}

// Input para actualizar usuario
export interface UpdateUserInput {
  name?: string;
  phone?: string;
  avatar?: string;
  staffRole?: StaffRole;
  isActive?: boolean;
}

// Input para reset de contraseña
export interface ResetPasswordInput {
  userId: string;
  newPassword?: string;  // Si no se proporciona, se genera uno aleatorio
  sendEmail?: boolean;   // Si enviar email con la nueva contraseña
}

// Respuesta de API
export interface UserResponse {
  user: User;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  temporaryPassword?: string;  // Solo se devuelve si no se envía email
}

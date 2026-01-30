"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Store,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui";
import { AuthProvider, useAuth } from "@/components/shared";
import { cn } from "@/lib/utils";

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopIdParam = searchParams.get("shop");

  const { staffLogin, isAuthenticated, isStaff, sessionExpired, clearSessionExpired } = useAuth();

  const [shopId, setShopId] = useState(shopIdParam || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);

  // Handle session expired
  useEffect(() => {
    if (sessionExpired) {
      setShowExpiredBanner(true);
      clearSessionExpired();
    }
  }, [sessionExpired, clearSessionExpired]);

  // Redirect if already authenticated as staff
  useEffect(() => {
    if (isAuthenticated && isStaff) {
      router.push("/admin");
    }
  }, [isAuthenticated, isStaff, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shopId.trim()) {
      setError("Ingresa el ID de la tienda");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Ingresa tu usuario y contraseña");
      return;
    }

    setIsLoading(true);

    const success = await staffLogin(shopId.trim(), username.trim(), password);

    if (success) {
      router.push("/admin");
    } else {
      setError("Credenciales incorrectas o tienda no encontrada");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Back to main login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Acceso Admin/Propietario</span>
        </Link>

        {/* Session Expired Banner */}
        {showExpiredBanner && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium text-sm">
                Tu sesión ha expirado
              </p>
              <p className="text-amber-400/70 text-xs mt-1">
                Por seguridad, vuelve a iniciar sesión
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Acceso Empleados
            </h1>
            <p className="text-slate-400 text-sm">
              Ingresa con tus credenciales de trabajo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shop ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ID de Tienda
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  placeholder="ej: estetica-lola"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tu empleador te proporcionará este ID
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tu.usuario"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 text-xs font-medium mb-2">
              Credenciales de prueba:
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>
                <span className="text-slate-500">Tienda:</span> estetica-lola
              </p>
              <p>
                <span className="text-slate-500">Usuario:</span> maria.rodriguez
              </p>
              <p>
                <span className="text-slate-500">Contraseña:</span> 1234
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Tu sesión se mantendrá activa según la configuración de tu tienda
        </p>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <StaffLoginForm />
      </Suspense>
    </AuthProvider>
  );
}

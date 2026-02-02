"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAuth, AuthProvider } from "@/components/shared";
import { Button } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, isAuthenticated, isSuperAdmin, user, isLoading, sessionExpired, clearSessionExpired } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forceLogout, setForceLogout] = useState(false);
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch - solo renderizar después de montar
  useEffect(() => {
    setMounted(true);
  }, []);

  // Phase 23: Show session expired banner
  useEffect(() => {
    if (sessionExpired) {
      setShowExpiredBanner(true);
      clearSessionExpired();
    }
  }, [sessionExpired, clearSessionExpired]);

  // Handle ?logout parameter to force logout
  useEffect(() => {
    if (searchParams.get("logout") === "true" && isAuthenticated && !forceLogout) {
      setForceLogout(true);
      logout();
      // Clean URL
      router.replace("/login");
    }
  }, [searchParams, isAuthenticated, logout, router, forceLogout]);

  // Redirect si ya está autenticado (pero no si estamos haciendo logout)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !forceLogout && !searchParams.get("logout")) {
      if (isSuperAdmin) {
        router.push("/agency");
      } else if (user?.shopId) {
        router.push("/admin");
      }
    }
  }, [isAuthenticated, isSuperAdmin, user, isLoading, router, forceLogout, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const success = await login(username, password);

    if (!success) {
      setError("Credenciales incorrectas");
      setIsSubmitting(false);
    }
  };

  // Mostrar loading hasta que esté montado y auth haya cargado
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-2xl shadow-cyan-500/30 overflow-hidden ring-1 ring-white/20">
              <img src="/logo.png" alt="Linko" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Centro de Control
            </h1>
            <p className="text-slate-400">
              Accede a tu panel de administración
            </p>
          </div>

          {/* Phase 23: Session Expired Banner */}
          {showExpiredBanner && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 font-medium text-sm">Sesión Expirada</p>
                <p className="text-slate-400 text-xs">
                  Tu sesión se cerró por inactividad. Por favor, inicia sesión nuevamente.
                </p>
              </div>
              <button
                onClick={() => setShowExpiredBanner(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Login Card */}
          <div className="glass-panel rounded-2xl p-8 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    const whatsappMessage = encodeURIComponent(
                      `Hola, olvidé mi contraseña para ${username || "mi cuenta"}. ¿Podrían ayudarme a recuperarla?`
                    );
                    window.open(
                      `https://wa.me/5215512345678?text=${whatsappMessage}`,
                      "_blank"
                    );
                  }}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Powered by{" "}
            <span className="text-gradient-primary font-semibold">
              Linko
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}

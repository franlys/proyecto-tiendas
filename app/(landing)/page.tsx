"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  Sparkles,
  Store,
  Calendar,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  Star,
  Users,
  Palette,
  BarChart3,
  Gift,
  Image,
  CheckCircle,
  Smartphone,
  X,
  Phone,
  Mail,
  MapPin,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/components/shared";

// Información de contacto del administrador
const ADMIN_CONTACT = {
  name: "NEXO",
  phone: "+52 1 55 1234 5678",
  whatsapp: "5215512345678",
  email: "contacto@nexoapp.com",
  location: "Ciudad de México, México",
};

// Phase 23: Smart Auth Button - shows different state based on login
function SmartAuthButton() {
  const { isAuthenticated, user, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        Cargando...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    const panelUrl = isSuperAdmin ? "/agency" : "/admin";
    return (
      <Link href={panelUrl}>
        <Button variant="outline" size="sm" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Ir a mi Panel
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/login">
      <Button variant="outline" size="sm">
        <LogIn className="w-4 h-4 mr-2" />
        Acceso Clientes
      </Button>
    </Link>
  );
}

function LandingPageContent({ showContactModal, setShowContactModal }: { showContactModal: boolean; setShowContactModal: (show: boolean) => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-panel">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                NEXO
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                Características
              </a>
              <a href="#demo" className="text-slate-300 hover:text-white transition-colors">
                Demo
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">
                Precios
              </a>
              {/* Phase 23: Smart Auth Button */}
              <SmartAuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-gold text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                La app que tu estética merece
              </span>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Reservas por{" "}
                <span className="text-gradient-primary">WhatsApp</span>,{" "}
                <span className="text-gradient-gold">sin complicaciones</span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Tu catálogo de servicios premium, carrito de compra visual y agenda automática por WhatsApp. Todo en una web instalable como app.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={() => setShowContactModal(true)}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Quiero mi NEXO
                </Button>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Ya soy cliente
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Sin tarjeta de crédito
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Setup en 5 minutos
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Soporte 24/7
                </span>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative bg-slate-800 rounded-[3rem] p-3 shadow-2xl shadow-primary/20">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden w-[280px] h-[560px]">
                    {/* Screen Content Preview */}
                    <div className="h-full bg-gradient-to-b from-primary/10 to-transparent p-6 flex flex-col">
                      {/* Mini Header */}
                      <div className="glass-panel rounded-xl px-4 py-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-orange-400" />
                          <div>
                            <p className="text-white text-sm font-bold">Estética Lola</p>
                            <p className="text-slate-400 text-xs">Centro de belleza</p>
                          </div>
                        </div>
                      </div>

                      {/* Service Cards Preview */}
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="rounded-xl bg-surface overflow-hidden"
                          >
                            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800" />
                            <div className="p-2">
                              <div className="h-2 w-16 bg-white/20 rounded mb-1" />
                              <div className="h-2 w-10 bg-gold/40 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mini Cart */}
                      <div className="glass-panel rounded-xl p-3 mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-white text-xs font-medium">2 servicios</p>
                          <p className="text-gold text-sm font-bold">$850</p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-medium flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          Agendar
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-full" />
                </div>

                {/* Floating Badges */}
                <div className="absolute -right-4 top-20 glass-panel rounded-xl p-3 animate-bounce">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs">
                      <p className="text-white font-medium">WhatsApp</p>
                      <p className="text-slate-400">Directo</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-32 glass-panel rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                      <Star className="w-4 h-4 text-background" />
                    </div>
                    <div className="text-xs">
                      <p className="text-white font-medium">Fidelización</p>
                      <p className="text-slate-400">Automática</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-medium uppercase tracking-wider">
              Características
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              Todo lo que tu negocio{" "}
              <span className="text-gradient-primary">necesita</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Diseñado para estéticas, barberías, spas y negocios de servicios que quieren destacar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Cards */}
            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Agenda por WhatsApp
              </h3>
              <p className="text-slate-400 text-sm">
                Tus clientes seleccionan servicios y con un click, te llega todo listo a WhatsApp.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Catálogo Visual
              </h3>
              <p className="text-slate-400 text-sm">
                Muestra tus servicios con fotos atractivas. Estilo Instagram, pero para tu negocio.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Tarjeta de Fidelidad
              </h3>
              <p className="text-slate-400 text-sm">
                Sistema de sellos digital. Tus clientes acumulan y ganan recompensas automáticamente.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Dashboard Analytics
              </h3>
              <p className="text-slate-400 text-sm">
                Ventas del día, ticket promedio, servicio estrella. Todo en un panel elegante.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Generador de Promos
              </h3>
              <p className="text-slate-400 text-sm">
                Crea imágenes para Instagram Stories en segundos. Sin Canva, sin Photoshop.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                CRM con Notas Secretas
              </h3>
              <p className="text-slate-400 text-sm">
                &quot;Le gusta el café sin azúcar&quot;. Guarda notas privadas de cada cliente.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Temas Personalizables
              </h3>
              <p className="text-slate-400 text-sm">
                Elige tu paleta de colores y fondos animados. Galaxia, Aurora o Minimalista.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                PWA Instalable
              </h3>
              <p className="text-slate-400 text-sm">
                Tus clientes instalan la web como app. Sin App Store, sin aprobaciones.
              </p>
            </div>

            <div className="glass-panel-hover rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Cierre de Caja
              </h3>
              <p className="text-slate-400 text-sm">
                Un botón genera tu reporte del día listo para enviar por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - Guided Tour */}
      <section id="demo" className="py-24 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold text-sm font-medium uppercase tracking-wider">
              Tour Guiado
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
              Conoce <span className="text-gradient-gold">todo lo que puedes hacer</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Descubre paso a paso cómo NEXO transformará la gestión de tu negocio
            </p>
          </div>

          {/* Feature Tour Cards */}
          <div className="space-y-16 max-w-5xl mx-auto">
            {/* 1. Catálogo Digital */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                <div className="text-center">
                  <Store className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-square rounded-lg bg-white/10" />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-cyan-400 text-sm font-medium">01</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Catálogo Digital Profesional
                </h3>
                <p className="text-slate-400 mb-4">
                  Muestra tus servicios y productos con fotos de alta calidad. Tus clientes pueden ver precios, descripciones y agregar al carrito desde su celular.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Fotos y descripciones profesionales
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Categorías organizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Precios actualizables al instante
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. Reservas por WhatsApp */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2 glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <div className="glass-panel rounded-xl p-4 max-w-xs mx-auto">
                    <p className="text-xs text-slate-400 mb-2">Vista previa del mensaje:</p>
                    <p className="text-sm text-white">
                      &quot;Hola! Quiero agendar: Corte + Barba para el Lunes 3pm&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:order-1">
                <span className="text-green-400 text-sm font-medium">02</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Reservas Directas por WhatsApp
                </h3>
                <p className="text-slate-400 mb-4">
                  Sin apps complicadas. Tu cliente selecciona servicios y con un click te llega todo el pedido formateado a tu WhatsApp Business.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Mensaje pre-formateado automático
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Fecha y hora incluidas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Sin comisiones por reserva
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. Dashboard Analytics */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="text-center w-full px-4">
                  <BarChart3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass-panel rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">$12,450</p>
                      <p className="text-xs text-slate-400">Ventas Hoy</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">24</p>
                      <p className="text-xs text-slate-400">Citas</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3">
                      <p className="text-2xl font-bold text-white">$518</p>
                      <p className="text-xs text-slate-400">Ticket Prom.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-purple-400 text-sm font-medium">03</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Dashboard con Métricas en Tiempo Real
                </h3>
                <p className="text-slate-400 mb-4">
                  Visualiza las ventas del día, ticket promedio, servicio más vendido y más. Todo en un panel elegante que puedes ver desde cualquier dispositivo.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Ventas diarias, semanales y mensuales
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Top servicios y productos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Cierre de caja con un click
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. CRM Clientes */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2 glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <div className="text-center w-full px-4">
                  <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <div className="glass-panel rounded-xl p-4 max-w-xs mx-auto text-left">
                    <p className="text-white font-medium">María García</p>
                    <p className="text-xs text-slate-400">12 visitas • Cliente VIP</p>
                    <p className="text-xs text-gold mt-2">★★★★★ 8/10 sellos</p>
                    <p className="text-xs text-slate-500 mt-2 italic">&quot;Le gusta el café sin azúcar&quot;</p>
                  </div>
                </div>
              </div>
              <div className="md:order-1">
                <span className="text-blue-400 text-sm font-medium">04</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  CRM con Historial y Notas Privadas
                </h3>
                <p className="text-slate-400 mb-4">
                  Conoce a tus clientes como nunca. Historial de visitas, preferencias, notas privadas y programa de lealtad integrado.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Historial completo de cada cliente
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Notas privadas (gustos, alergias, etc.)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Tarjeta de fidelidad digital
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. Generador de Promos */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-orange-500/10">
                <div className="text-center">
                  <Gift className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                  <div className="glass-panel rounded-xl p-4 max-w-xs mx-auto bg-gradient-to-br from-rose-500/20 to-orange-500/20">
                    <p className="text-lg font-bold text-white">2x1 en Manicure</p>
                    <p className="text-sm text-slate-300">Solo este fin de semana</p>
                    <p className="text-xs text-gold mt-2">Listo para Instagram Stories</p>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-rose-400 text-sm font-medium">05</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Generador de Promociones para Redes
                </h3>
                <p className="text-slate-400 mb-4">
                  Crea imágenes profesionales para Instagram Stories en segundos. Sin Canva, sin Photoshop. Solo selecciona, personaliza y comparte.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Templates profesionales incluidos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Exporta en formato Stories
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Comparte directo a WhatsApp
                  </li>
                </ul>
              </div>
            </div>

            {/* 6. Categorías de Productos */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2 glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-yellow-500/10">
                <div className="text-center w-full px-4">
                  <Palette className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">Cabello</span>
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs">Uñas</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">Spa</span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Facial</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">Maquillaje</span>
                    <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-xs">Premium</span>
                  </div>
                </div>
              </div>
              <div className="md:order-1">
                <span className="text-amber-400 text-sm font-medium">06</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Categorías Organizadas
                </h3>
                <p className="text-slate-400 mb-4">
                  Organiza tus servicios y productos en categorías personalizables. Tus clientes encuentran lo que buscan en segundos con filtros intuitivos.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Categorías ilimitadas personalizables
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Filtros rápidos para clientes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Ordena por popularidad o precio
                  </li>
                </ul>
              </div>
            </div>

            {/* 7. Variantes y Calidades */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                <div className="text-center w-full px-4">
                  <Star className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                  <div className="glass-panel rounded-xl p-4 max-w-xs mx-auto">
                    <p className="text-white font-medium mb-3">Corte de Cabello</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-300">Básico</span>
                        <span className="text-sm text-gold">$150</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-cyan-500/30">
                        <span className="text-sm text-white">Premium</span>
                        <span className="text-sm text-gold">$250</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-300">VIP + Tratamiento</span>
                        <span className="text-sm text-gold">$400</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-indigo-400 text-sm font-medium">07</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Variantes y Calidades por Producto
                </h3>
                <p className="text-slate-400 mb-4">
                  Un mismo servicio puede tener diferentes niveles de calidad o variantes. El cliente elige la opción que mejor se adapta a su presupuesto.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Múltiples variantes por producto
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Precios diferenciados por calidad
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Descripciones claras de cada opción
                  </li>
                </ul>
              </div>
            </div>

            {/* 8. Inventario y Stock */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2 glass-panel rounded-2xl p-6 aspect-video flex items-center justify-center bg-gradient-to-br from-teal-500/10 to-emerald-500/10">
                <div className="text-center w-full px-4">
                  <TrendingUp className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-panel rounded-lg p-3 text-left">
                      <p className="text-xs text-slate-400">Shampoo Pro</p>
                      <p className="text-lg font-bold text-white">24 <span className="text-xs text-green-400">+5</span></p>
                    </div>
                    <div className="glass-panel rounded-lg p-3 text-left">
                      <p className="text-xs text-slate-400">Tinte L&apos;Oreal</p>
                      <p className="text-lg font-bold text-amber-400">3 <span className="text-xs text-red-400">bajo</span></p>
                    </div>
                    <div className="glass-panel rounded-lg p-3 text-left">
                      <p className="text-xs text-slate-400">Gel Fijador</p>
                      <p className="text-lg font-bold text-white">18</p>
                    </div>
                    <div className="glass-panel rounded-lg p-3 text-left">
                      <p className="text-xs text-slate-400">Aceite Argán</p>
                      <p className="text-lg font-bold text-white">12</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:order-1">
                <span className="text-teal-400 text-sm font-medium">08</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">
                  Control de Inventario
                </h3>
                <p className="text-slate-400 mb-4">
                  Mantén el control de tus productos físicos. Alertas de stock bajo, historial de movimientos y reportes de inventario.
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Alertas automáticas de stock bajo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Historial de entradas y salidas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Reportes de productos más vendidos
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-cyan-600"
              onClick={() => setShowContactModal(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Solicitar mi NEXO
            </Button>
            <p className="text-slate-500 text-sm mt-4">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                Accede aquí
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="glass-panel rounded-3xl p-8 md:p-12 max-w-3xl mx-auto text-center relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-gold/20" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-gold text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                Únete a la comunidad
              </span>

              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para transformar tu negocio?
              </h2>

              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                Únete a cientos de estéticas y barberías que ya usan nuestra plataforma para crecer.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => setShowContactModal(true)}>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Quiero Unirme
                </Button>
                <a href="#demo">
                  <Button variant="outline" size="lg">
                    Ver Tour Guiado
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>

              <p className="text-sm text-slate-500 mt-6">
                Contáctanos y te ayudamos a comenzar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                NEXO
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">
                Características
              </a>
              <a href="#demo" className="hover:text-white transition-colors">
                Tour
              </a>
              <Link href="/login" className="hover:text-white transition-colors">
                Acceso
              </Link>
              <button
                onClick={() => setShowContactModal(true)}
                className="hover:text-white transition-colors"
              >
                Contacto
              </button>
            </div>

            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} NEXO
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-8 animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-2">
                ¡Contáctanos!
              </h3>
              <p className="text-slate-400 text-sm">
                Estamos listos para ayudarte a comenzar
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              {/* WhatsApp - Primary CTA */}
              <a
                href={`https://wa.me/${ADMIN_CONTACT.whatsapp}?text=${encodeURIComponent("¡Hola! Me interesa unirme a NEXO")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">WhatsApp</p>
                  <p className="text-green-400 text-sm">{ADMIN_CONTACT.phone}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-400 ml-auto" />
              </a>

              {/* Phone */}
              <a
                href={`tel:${ADMIN_CONTACT.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Teléfono</p>
                  <p className="text-slate-400 text-sm">{ADMIN_CONTACT.phone}</p>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${ADMIN_CONTACT.email}?subject=${encodeURIComponent("Interesado en NEXO")}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-slate-400 text-sm">{ADMIN_CONTACT.email}</p>
                </div>
              </a>

              {/* Location */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white font-medium">Ubicación</p>
                  <p className="text-slate-400 text-sm">{ADMIN_CONTACT.location}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-slate-500 text-xs mt-6">
              Respuesta en menos de 24 horas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Phase 23: Wrap with AuthProvider for smart button functionality
export default function LandingPage() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <AuthProvider>
      <LandingPageContent
        showContactModal={showContactModal}
        setShowContactModal={setShowContactModal}
      />
    </AuthProvider>
  );
}

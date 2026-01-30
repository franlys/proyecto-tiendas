"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Shield, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Términos y Condiciones
                </h1>
                <p className="text-slate-400 text-sm">
                  Última actualización: Enero 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-invert prose-slate max-w-none">
          {/* Introduction */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              1. Introducción
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Bienvenido a Nexo. Estos términos y condiciones rigen el uso de
              nuestra plataforma de gestión de citas y servicios para negocios. Al utilizar
              nuestros servicios, aceptas cumplir con estos términos.
            </p>
          </section>

          {/* Services */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Nexo ofrece una plataforma SaaS que incluye:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Tienda web personalizable para mostrar servicios y productos
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Sistema de reservas integrado con WhatsApp
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Panel de administración para gestionar el negocio
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                Herramientas de marketing y generación de contenido
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                CRM para gestión de clientes
              </li>
            </ul>
          </section>

          {/* Subscriptions */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-400" />
              3. Suscripciones y Pagos
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">3.1 Facturación:</strong> Los servicios se
                facturan mensualmente. El cobro se realiza al inicio de cada período de
                facturación.
              </p>
              <p>
                <strong className="text-white">3.2 Período de Prueba:</strong> Los nuevos
                usuarios pueden acceder a un período de prueba gratuito según la promoción
                vigente.
              </p>
              <p>
                <strong className="text-white">3.3 Impago:</strong> En caso de impago, el
                acceso al panel de administración será restringido. Sin embargo, la tienda
                pública permanecerá activa para no afectar a tus clientes.
              </p>
              <p>
                <strong className="text-white">3.4 Cancelación:</strong> Puedes cancelar tu
                suscripción en cualquier momento. El servicio continuará hasta el final del
                período pagado.
              </p>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Responsabilidades del Usuario
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">4.1 Contenido:</strong> Eres responsable de
                todo el contenido que publiques en tu tienda, incluyendo imágenes,
                descripciones y precios.
              </p>
              <p>
                <strong className="text-white">4.2 Uso Apropiado:</strong> Te comprometes a
                utilizar la plataforma únicamente para fines legales y de acuerdo con estos
                términos.
              </p>
              <p>
                <strong className="text-white">4.3 Credenciales:</strong> Eres responsable
                de mantener la confidencialidad de tus credenciales de acceso.
              </p>
            </div>
          </section>

          {/* Limitations */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              5. Limitación de Responsabilidad
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Nexo no se hace responsable de interrupciones del servicio
              causadas por factores externos, ni de las transacciones realizadas entre los
              negocios y sus clientes. Actuamos únicamente como proveedor de tecnología.
            </p>
          </section>

          {/* Data */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Propiedad de los Datos
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Los datos de tu negocio y clientes te pertenecen. En caso de cancelación,
              podrás solicitar una exportación de tus datos. Consulta nuestra{" "}
              <Link href="/legal/privacy" className="text-purple-400 hover:underline">
                Política de Privacidad
              </Link>{" "}
              para más información.
            </p>
          </section>

          {/* Changes */}
          <section className="glass-panel rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Modificaciones
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Nos reservamos el derecho de modificar estos términos. Los cambios
              significativos serán notificados con al menos 30 días de anticipación a
              través de email o notificación en la plataforma.
            </p>
          </section>

          {/* Contact */}
          <section className="glass-panel rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Contacto
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Para cualquier consulta sobre estos términos, puedes contactarnos:
            </p>
            <div className="space-y-2 text-slate-300">
              <p>
                <strong className="text-white">Email:</strong>{" "}
                legal@nexoapp.mx
              </p>
              <p>
                <strong className="text-white">WhatsApp:</strong>{" "}
                +52 55 1234 5678
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link href="/legal/privacy">
            <Button variant="outline" size="sm">
              Política de Privacidad
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

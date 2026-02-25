export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-display">Política de Privacidad</h1>
        <p className="text-slate-400">Última actualización: {new Date().toLocaleDateString()}</p>

        <div className="space-y-4 text-slate-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Datos Recopilados</h2>
            <p>Linko recopila información básica de registro (nombre, email) y datos operativos de tu negocio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Uso de la Información</h2>
            <p>Utilizamos tus datos para proporcionar el servicio de reservas y análisis. No compartimos tu información con terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Seguridad</h2>
            <p>Implementamos medidas de seguridad estándar para proteger tus datos en Firebase.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

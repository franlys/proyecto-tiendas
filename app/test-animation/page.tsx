import { LogoAnimation } from "@/components/shop/logo-animation";

export default function TestAnimationPage() {
  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl text-center space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
            Experiencia de Marca <span className="text-red-500">Premium</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Visualización de la transición de entrada estilo Apple para el catálogo personalizado de GS Gonzalez.
          </p>
        </header>

        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 blur-3xl rounded-full" />
          
          <LogoAnimation />
          
          <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <p className="text-sm text-green-400 font-mono">READY_FOR_HANDOFF</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">FPS</p>
              <p className="text-sm text-white font-mono">60_MOTION_EASE</p>
            </div>
          </div>
        </div>

        <footer className="pt-12">
          <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-all hover:scale-105">
            Comenzar Experiencia
          </button>
        </footer>
      </div>
    </main>
  );
}

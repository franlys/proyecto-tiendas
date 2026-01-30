"use client";

import { MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useAgency } from "@/components/shared";

export function SupportWidget() {
    const { config, isLoaded } = useAgency();

    if (!isLoaded) return null;

    const handleContact = () => {
        const message = encodeURIComponent(
            "Hola, necesito ayuda técnica con el panel de administración de Nexo."
        );
        window.open(`https://wa.me/${config.whatsapp}?text=${message}`, "_blank");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                onClick={handleContact}
                className="rounded-full w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] shadow-lg shadow-green-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
                <MessageCircle className="w-8 h-8 text-white" />
            </Button>
            <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-black/80 text-white text-xs py-1 px-3 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none group-hover:opacity-100">
                Soporte {config.name}
            </div>
        </div>
    );
}

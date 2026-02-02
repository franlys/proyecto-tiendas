"use client";

import { useState } from "react";
import { MOCK_SHOPS } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui";
import { Database, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function DatabaseSeeder() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const seedDatabase = async () => {
        if (!confirm("¿Estás seguro? Esto sobrescribirá las tiendas demo en la base de datos si ya existen.")) {
            return;
        }

        setLoading(true);
        setStatus("idle");
        setMessage("Iniciando carga de datos...");

        try {
            const shopsRef = collection(db, "shops");
            let successCount = 0;
            let errorCount = 0;

            // Iterate through MOCK_SHOPS and upload each one
            for (const [id, shopConfig] of Object.entries(MOCK_SHOPS)) {
                try {
                    // Use the key as the document ID (e.g., 'demo-restaurant')
                    await setDoc(doc(shopsRef, id), {
                        ...shopConfig,
                        id: id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        // Ensure essential fields exist for queries
                        subscriptionStatus: shopConfig.subscriptionStatus || "active",
                        isDemo: true,
                    }, { merge: true });

                    successCount++;
                    console.log(`Uploaded shop: ${id}`);
                } catch (err) {
                    console.error(`Error uploading shop ${id}:`, err);
                    errorCount++;
                }
            }

            setStatus("success");
            setMessage(`Proceso completado. ${successCount} tiendas subidas. ${errorCount} errores.`);
            toast.success("Base de datos inicializada correctamente");

        } catch (error) {
            console.error("Critical error seeding database:", error);
            setStatus("error");
            setMessage("Error crítico al conectar con la base de datos.");
            toast.error("Error al inicializar la base de datos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl border border-white/10 mt-8">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-2">Inicializar Base de Datos</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Si la base de datos está vacía, usa este botón para cargar las tiendas de demostración (Demo Restaurant, Boutique, etc.) y los datos iniciales.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={seedDatabase}
                            disabled={loading}
                            className="w-fit bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Subiendo Datos...
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4 mr-2" />
                                    Cargar Tiendas Demo a Firestore
                                </>
                            )}
                        </Button>

                        {message && (
                            <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${status === "success" ? "bg-green-500/10 text-green-400" :
                                    status === "error" ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-300"
                                }`}>
                                {status === "success" && <CheckCircle className="w-4 h-4" />}
                                {status === "error" && <AlertTriangle className="w-4 h-4" />}
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

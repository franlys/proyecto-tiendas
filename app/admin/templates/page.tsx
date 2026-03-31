"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared";
import { useRouter } from "next/navigation";
import { useShops } from "@/components/shared";
import {
    Layers, Eye, EyeOff, Trash2, ShieldAlert, Check, X,
    Plus, ChevronDown, ChevronUp, Star, Lock, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILT_IN_TEMPLATES, TemplateDefinition, TemplateStatus } from "@/lib/templates/registry";
import { adminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateShop } from "@/lib/services/shops.service";

// ─── Helpers ───────────────────────────────────────────────
const STATUS_LABELS: Record<TemplateStatus, string> = {
    active: "Activa",
    hidden: "Oculta",
    deleted: "Eliminada",
};

const CATEGORY_LABELS = {
    standard: "Estándar",
    premium: "Premium",
    custom: "Custom",
};

const STATUS_COLORS: Record<TemplateStatus, string> = {
    active: "bg-green-500/20 text-green-400",
    hidden: "bg-zinc-700/50 text-zinc-400",
    deleted: "bg-red-500/20 text-red-400",
};

// ─── Cargar/guardar plantillas custom desde Firestore ───────
async function loadCustomTemplates(): Promise<TemplateDefinition[]> {
    try {
        const ref = doc(db, "system", "templates");
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data().customTemplates ?? [];
        }
    } catch { /* silencioso */ }
    return [];
}

async function saveCustomTemplates(templates: TemplateDefinition[]) {
    const ref = doc(db, "system", "templates");
    await setDoc(ref, { customTemplates: templates }, { merge: true });
}

// ─── Componente ─────────────────────────────────────────────
export default function TemplatesPage() {
    const { isSuperAdmin, isLoading } = useAuth();
    const router = useRouter();
    const { shops } = useShops();

    const [customTemplates, setCustomTemplates] = useState<TemplateDefinition[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // Estado para confirmación de eliminación
    const [deleteTarget, setDeleteTarget] = useState<TemplateDefinition | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteStep, setDeleteStep] = useState<"hide" | "confirm_delete">("hide");

    // Estado para asignar plantilla a tienda
    const [assignTarget, setAssignTarget] = useState<string | null>(null); // template id
    const [assignShop, setAssignShop] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);

    // Estado para nueva plantilla custom
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        id: "", name: "", description: "", customFor: "", notes: ""
    });

    useEffect(() => {
        if (!isLoading && !isSuperAdmin) router.replace("/admin");
    }, [isLoading, isSuperAdmin, router]);

    useEffect(() => {
        loadCustomTemplates().then(t => {
            setCustomTemplates(t);
            setLoadingTemplates(false);
        });
    }, []);

    if (isLoading || loadingTemplates) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isSuperAdmin) return null;

    const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates].filter(t => t.status !== "deleted");

    // ── Ocultar / mostrar plantilla ──────────────────────────
    const toggleVisibility = async (template: TemplateDefinition) => {
        const isBuiltIn = BUILT_IN_TEMPLATES.some(t => t.id === template.id);
        const newStatus: TemplateStatus = template.status === "active" ? "hidden" : "active";

        if (isBuiltIn) {
            // Para built-in, guardamos override en custom list
            const existing = customTemplates.find(t => t.id === template.id);
            let updated: TemplateDefinition[];
            if (existing) {
                updated = customTemplates.map(t => t.id === template.id ? { ...t, status: newStatus } : t);
            } else {
                updated = [...customTemplates, { ...template, status: newStatus, updatedAt: new Date().toISOString() }];
            }
            setCustomTemplates(updated);
            await saveCustomTemplates(updated);
        } else {
            const updated = customTemplates.map(t =>
                t.id === template.id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
            );
            setCustomTemplates(updated);
            await saveCustomTemplates(updated);
        }
    };

    // ── Eliminar plantilla (solo custom) ────────────────────
    const handleDeleteStart = (template: TemplateDefinition) => {
        setDeleteTarget(template);
        setDeleteStep("hide");
        setDeleteConfirmText("");
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        if (deleteConfirmText !== deleteTarget.name) return;

        if (deleteStep === "hide") {
            // Primero ocultamos
            const updated = customTemplates.map(t =>
                t.id === deleteTarget.id ? { ...t, status: "hidden" as TemplateStatus } : t
            );
            setCustomTemplates(updated);
            await saveCustomTemplates(updated);
            setDeleteStep("confirm_delete");
            setDeleteConfirmText("");
            return;
        }

        // Eliminación permanente
        const updated = customTemplates.filter(t => t.id !== deleteTarget.id);
        setCustomTemplates(updated);
        await saveCustomTemplates(updated);
        setDeleteTarget(null);
        setDeleteConfirmText("");
    };

    // ── Asignar plantilla a tienda ──────────────────────────
    const handleAssign = async () => {
        if (!assignTarget || !assignShop) return;
        setAssignLoading(true);
        try {
            await updateShop(assignShop, { templateType: assignTarget });
            alert(`✅ Plantilla "${assignTarget}" asignada a la tienda`);
            setAssignTarget(null);
            setAssignShop("");
        } catch {
            alert("❌ Error al asignar plantilla");
        } finally {
            setAssignLoading(false);
        }
    };

    // ── Crear nueva plantilla custom ────────────────────────
    const handleCreateTemplate = async () => {
        if (!newTemplate.id || !newTemplate.name) return;
        const template: TemplateDefinition = {
            ...newTemplate,
            category: "custom",
            status: "active",
            createdAt: new Date().toISOString(),
        };
        const updated = [...customTemplates, template];
        setCustomTemplates(updated);
        await saveCustomTemplates(updated);
        setShowNewForm(false);
        setNewTemplate({ id: "", name: "", description: "", customFor: "", notes: "" });
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Layers className="w-7 h-7 text-primary" />
                        Gestión de Plantillas
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Solo el Super Admin puede ver y gestionar las plantillas del sistema.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-xl hover:bg-primary/30 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Plantilla Custom
                </button>
            </div>

            {/* Formulario nueva plantilla */}
            {showNewForm && (
                <div className="p-5 rounded-2xl bg-zinc-900 border border-primary/20 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        Nueva Plantilla Custom
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">ID único (ej: sculpt-v1)</label>
                            <input
                                value={newTemplate.id}
                                onChange={e => setNewTemplate(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s/g, "-") }))}
                                placeholder="sculpt-love-v1"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">Nombre visible</label>
                            <input
                                value={newTemplate.name}
                                onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                                placeholder="Sculpt Love Method"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-zinc-400 mb-1 block">Descripción</label>
                            <input
                                value={newTemplate.description}
                                onChange={e => setNewTemplate(p => ({ ...p, description: e.target.value }))}
                                placeholder="Plantilla personalizada para..."
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">Cliente / Negocio</label>
                            <input
                                value={newTemplate.customFor}
                                onChange={e => setNewTemplate(p => ({ ...p, customFor: e.target.value }))}
                                placeholder="Sculpt Love Method"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 mb-1 block">Notas internas</label>
                            <input
                                value={newTemplate.notes}
                                onChange={e => setNewTemplate(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Diseño por Juan UI/UX, contrato #123"
                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCreateTemplate}
                            disabled={!newTemplate.id || !newTemplate.name}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 disabled:opacity-40"
                        >
                            Crear Plantilla
                        </button>
                        <button
                            onClick={() => setShowNewForm(false)}
                            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de plantillas */}
            <div className="space-y-3">
                {allTemplates.map(template => {
                    // Los built-in pueden tener override de status en customTemplates
                    const override = customTemplates.find(t => t.id === template.id);
                    const effectiveTemplate = override ?? template;
                    const isBuiltIn = BUILT_IN_TEMPLATES.some(t => t.id === template.id);
                    const usedByShops = shops.filter(s => s.templateType === template.id);

                    return (
                        <div
                            key={template.id}
                            className={cn(
                                "p-5 rounded-2xl border transition-all",
                                effectiveTemplate.status === "active"
                                    ? "bg-zinc-900 border-zinc-800"
                                    : "bg-zinc-900/50 border-zinc-800/50 opacity-60"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-white font-bold">{template.name}</h3>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[effectiveTemplate.status])}>
                                            {STATUS_LABELS[effectiveTemplate.status]}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                                            {CATEGORY_LABELS[template.category]}
                                        </span>
                                        {template.isPremium && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                                Premium
                                            </span>
                                        )}
                                        {isBuiltIn && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5" /> Built-in
                                            </span>
                                        )}
                                        {template.customFor && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                                                Para: {template.customFor}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 text-sm mt-1">{template.description}</p>
                                    {template.notes && (
                                        <p className="text-white/40 text-xs mt-1 italic">📝 {template.notes}</p>
                                    )}
                                    <p className="text-white/30 text-xs mt-1">ID: <code className="text-white/40">{template.id}</code></p>

                                    {/* Tiendas que la usan */}
                                    {usedByShops.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {usedByShops.map(s => (
                                                <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                                                    🏪 {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Asignar a tienda */}
                                    <button
                                        onClick={() => setAssignTarget(assignTarget === template.id ? null : template.id)}
                                        className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-primary/20 hover:text-primary transition-colors"
                                        title="Asignar a tienda"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>

                                    {/* Ocultar/Mostrar */}
                                    <button
                                        onClick={() => toggleVisibility(effectiveTemplate)}
                                        className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            effectiveTemplate.status === "active"
                                                ? "bg-zinc-800 text-zinc-300 hover:bg-amber-500/20 hover:text-amber-400"
                                                : "bg-amber-500/20 text-amber-400 hover:bg-zinc-800 hover:text-zinc-300"
                                        )}
                                        title={effectiveTemplate.status === "active" ? "Ocultar plantilla" : "Mostrar plantilla"}
                                    >
                                        {effectiveTemplate.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>

                                    {/* Eliminar (solo custom) */}
                                    {!isBuiltIn && (
                                        <button
                                            onClick={() => handleDeleteStart(effectiveTemplate)}
                                            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                            title="Eliminar plantilla"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Panel asignar a tienda */}
                            {assignTarget === template.id && (
                                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3">
                                    <select
                                        value={assignShop}
                                        onChange={e => setAssignShop(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Seleccionar tienda...</option>
                                        {shops.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.templateType === template.id ? "(actual)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAssign}
                                        disabled={!assignShop || assignLoading}
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 disabled:opacity-40"
                                    >
                                        {assignLoading ? "Guardando..." : "Asignar"}
                                    </button>
                                    <button
                                        onClick={() => { setAssignTarget(null); setAssignShop(""); }}
                                        className="p-2 text-zinc-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal de eliminación con confirmación doble */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">
                                    {deleteStep === "hide" ? "Ocultar plantilla" : "⚠️ Eliminar permanentemente"}
                                </h3>
                                <p className="text-zinc-400 text-xs">
                                    {deleteStep === "hide"
                                        ? "Primero se ocultará. Luego podrás eliminar permanentemente."
                                        : "Esta acción no se puede deshacer."}
                                </p>
                            </div>
                        </div>

                        <p className="text-zinc-300 text-sm">
                            Escribe <strong className="text-white">{deleteTarget.name}</strong> para confirmar:
                        </p>
                        <input
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            placeholder={deleteTarget.name}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteConfirmText !== deleteTarget.name}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-sm font-bold transition-colors",
                                    deleteStep === "confirm_delete"
                                        ? "bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                                        : "bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40"
                                )}
                            >
                                {deleteStep === "hide" ? "Ocultar" : "Eliminar para siempre"}
                            </button>
                            <button
                                onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, CreditCard, Banknote, Save, X } from "lucide-react";
import { Button } from "@/components/ui";
import { ShopBankAccount } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BankAccountsManagerProps {
    accounts: ShopBankAccount[];
    onChange: (accounts: ShopBankAccount[]) => void;
}

export function BankAccountsManager({ accounts = [], onChange }: BankAccountsManagerProps) {
    const [isEditing, setIsEditing] = useState<string | null>(null); // ID of account being edited, or 'new'
    const [editForm, setEditForm] = useState<Partial<ShopBankAccount>>({});

    const handleAddNew = () => {
        setIsEditing("new");
        setEditForm({
            id: crypto.randomUUID(),
            bankName: "",
            accountNumber: "",
            accountType: "ahorros",
            accountHolder: "",
            identification: "",
            instructions: ""
        });
    };

    const handleEdit = (account: ShopBankAccount) => {
        setIsEditing(account.id);
        setEditForm({ ...account });
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta cuenta bancaria?")) {
            onChange(accounts.filter(a => a.id !== id));
        }
    };

    const handleSave = () => {
        if (!editForm.bankName || !editForm.accountNumber || !editForm.accountHolder) {
            alert("Por favor completa los campos obligatorios");
            return;
        }

        const newAccount = editForm as ShopBankAccount;

        if (isEditing === "new") {
            onChange([...accounts, newAccount]);
        } else {
            onChange(accounts.map(a => a.id === isEditing ? newAccount : a));
        }

        setIsEditing(null);
        setEditForm({});
    };

    const handleCancel = () => {
        setIsEditing(null);
        setEditForm({});
    };

    if (isEditing) {
        return (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    {isEditing === "new" ? "Nueva Cuenta Bancaria" : "Editar Cuenta"}
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Banco *</label>
                        <input
                            type="text"
                            value={editForm.bankName}
                            onChange={e => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                            placeholder="Ej: Banco Popular"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Cuenta *</label>
                        <select
                            value={editForm.accountType}
                            onChange={e => setEditForm(prev => ({ ...prev, accountType: e.target.value as "ahorros" | "corriente" }))}
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                        >
                            <option value="ahorros">Ahorros</option>
                            <option value="corriente">Corriente</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Número de Cuenta *</label>
                        <input
                            type="text"
                            value={editForm.accountNumber}
                            onChange={e => setEditForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            placeholder="Ej: 789456123"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Titular de la Cuenta *</label>
                        <input
                            type="text"
                            value={editForm.accountHolder}
                            onChange={e => setEditForm(prev => ({ ...prev, accountHolder: e.target.value }))}
                            placeholder="Nombre del titular"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Cédula / RNC (Opcional)</label>
                        <input
                            type="text"
                            value={editForm.identification}
                            onChange={e => setEditForm(prev => ({ ...prev, identification: e.target.value }))}
                            placeholder="Documento de identidad"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-300 mb-1">Instrucciones Adicionales</label>
                        <textarea
                            value={editForm.instructions}
                            onChange={e => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                            placeholder="Ej: Favor enviar comprobante de pago vía WhatsApp"
                            className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white resize-none"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={handleCancel} className="text-slate-400 hover:text-white">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cuenta
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-3">
                {accounts.map(account => (
                    <div
                        key={account.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{account.bankName}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span className="font-mono">{account.accountNumber}</span>
                                    <span>•</span>
                                    <span className="capitalize">{account.accountType}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{account.accountHolder}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(account)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Editar"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(account.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                        <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                        <p className="text-slate-400 font-medium">No hay cuentas configuradas</p>
                        <p className="text-sm text-slate-500">Agrega información bancaria para tus clientes</p>
                    </div>
                )}
            </div>

            <Button
                onClick={handleAddNew}
                className="w-full py-6 bg-white/5 border border-dashed border-white/20 hover:bg-white/10 hover:border-white/30 text-slate-300 hover:text-white"
            >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Nueva Cuenta
            </Button>
        </div>
    );
}

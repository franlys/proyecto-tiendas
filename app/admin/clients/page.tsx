"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Star,
  Search,
  ArrowLeft,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import {
  SalesOrdersProvider,
  useSalesOrders,
  ClientsProvider,
  useClients,
  AuthProvider,
  useAuth,
  type Client,
} from "@/components/shared";
import { ClientList, ClientDetail } from "@/components/admin";
import { Button } from "@/components/ui";

function CRMContent() {
  const { user } = useAuth();
  // const { orders } = useOrders(); // Removed
  const { clients, addNote, deleteNote, toggleVIP } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVIP, setFilterVIP] = useState(false);

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);
    const matchesVIP = !filterVIP || client.isVIP;
    return matchesSearch && matchesVIP;
  });

  // Update selected client when clients change
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) {
        setSelectedClient(updated);
      }
    }
  }, [clients, selectedClient]);

  // Stats
  const totalClients = clients.length;
  const vipClients = clients.filter((c) => c.isVIP).length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalClients}</p>
              <p className="text-xs text-slate-400">Clientes Totales</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">{vipClients}</p>
              <p className="text-xs text-slate-400">Clientes VIP</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 font-bold">$</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">Revenue Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente por nombre o teléfono..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <button
          onClick={() => setFilterVIP(!filterVIP)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${filterVIP
            ? "bg-gold/20 border-gold/30 text-gold"
            : "bg-white/5 border-white/10 text-slate-400 hover:border-gold/30"
            }`}
        >
          <Star className={`w-4 h-4 ${filterVIP && "fill-current"}`} />
          Solo VIP
        </button>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Client List */}
        <div className={selectedClient ? "lg:col-span-3" : "lg:col-span-5"}>
          <ClientList
            clients={filteredClients}
            onSelectClient={setSelectedClient}
            selectedClientId={selectedClient?.id}
          />
        </div>

        {/* Client Detail */}
        {selectedClient && (
          <div className="lg:col-span-2">
            <ClientDetail
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
              onAddNote={addNote}
              onDeleteNote={deleteNote}
              onToggleVIP={toggleVIP}
            />
          </div>
        )}
      </div>

      {/* Help Text */}
      {clients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm">
            💡 <strong>Tip:</strong> Ve a{" "}
            <Link href={`/${user?.shopId || "tu-tienda"}`} className="text-primary hover:underline">
              tu tienda
            </Link>
            , selecciona servicios y agenda para ver clientes aquí.
          </p>
        </div>
      )}
    </div>
  );
}

function CRMWrapper() {
  const { orders } = useSalesOrders();
  const { user } = useAuth();

  return (
    <ClientsProvider orders={orders} shopId={user?.shopId}>
      <CRMContent />
    </ClientsProvider>
  );
}

export default function AdminClientsPage() {
  const { user } = useAuth();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-white/10 py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    CRM Clientes
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Gestiona tus clientes y notas privadas
                  </p>
                </div>
              </div>

              <nav className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                    Config
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <ClientPageContent />
        </main>
      </div>
    </AuthProvider>
  );
}

function ClientPageContent() {
  const { user } = useAuth();

  // We need to wrap with SalesOrdersProvider here to access shopId from useAuth
  // But useAuth needs AuthProvider which is already wrapping AdminClientsPage

  if (!user?.shopId) {
    return <div className="text-white">Cargando...</div>;
  }

  return (
    <SalesOrdersProvider shopId={user.shopId}>
      <CRMWrapper />
    </SalesOrdersProvider>
  )
}

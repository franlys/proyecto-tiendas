"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Shield,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  X,
  DollarSign,
  ShoppingBag,
  Clock,
  Crown,
  TrendingUp,
  Award,
} from "lucide-react";
import { Button, PhoneInput, type PhoneInputValue } from "@/components/ui";
import {
  StaffProvider,
  useStaff,
  STAFF_ROLES,
  RoleBadge,
  type StaffMember,
  type StaffRole,
} from "@/components/shared/staff-context";
import { cn } from "@/lib/utils";

// New Staff Modal
function StaffModal({
  isOpen,
  onClose,
  editStaff,
}: {
  isOpen: boolean;
  onClose: () => void;
  editStaff?: StaffMember;
}) {
  const { addStaffMember, updateStaffMember } = useStaff();
  const [formData, setFormData] = useState({
    name: editStaff?.name || "",
    email: editStaff?.email || "",
    phone: editStaff?.phone || "",
    role: (editStaff?.role || "sales") as StaffRole,
    assignedAgentId: editStaff?.assignedAgentId || "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editStaff) {
      updateStaffMember(editStaff.id, formData);
    } else {
      addStaffMember({
        ...formData,
        isActive: true,
      });
    }
    onClose();
  };

  // Demo agents for dropdown
  const agents = [
    { id: "", name: "Sin asignar" },
    { id: "agent-ventas-1", name: "📱 Ventas 1 (+52 55 1234 5678)" },
    { id: "agent-ventas-2", name: "📱 Ventas 2 (+52 55 8765 4321)" },
    { id: "agent-soporte", name: "📱 Soporte (+52 55 1111 2222)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {editStaff ? "Editar Empleado" : "Nuevo Empleado"}
            </h2>
            <p className="text-sm text-slate-400">
              {editStaff ? "Modifica los datos del empleado" : "Agrega un nuevo miembro al equipo"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder="juan@tienda.com"
              />
            </div>
            <PhoneInput
              value={formData.phone}
              onChange={(value: PhoneInputValue) => setFormData({ ...formData, phone: value.fullPhone })}
              label="Teléfono"
              variant="dark"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rol *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(STAFF_ROLES) as [StaffRole, typeof STAFF_ROLES.owner][]).map(
                ([key, role]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: key })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      formData.role === key
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{role.icon}</span>
                      <span className="text-white font-medium text-sm">{role.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{role.description}</p>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Assigned Agent */}
          {(formData.role === "sales" || formData.role === "manager") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Asignar Línea WhatsApp
              </label>
              <select
                value={formData.assignedAgentId}
                onChange={(e) => setFormData({ ...formData, assignedAgentId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Las notificaciones de esta línea llegarán a este empleado
              </p>
            </div>
          )}

          <Button type="submit" className="w-full">
            {editStaff ? "Guardar Cambios" : "Agregar Empleado"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Staff Card
function StaffCard({
  member,
  onEdit,
}: {
  member: StaffMember;
  onEdit: () => void;
}) {
  const { deleteStaffMember, toggleStaffStatus, currentUser } = useStaff();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrentUser = currentUser?.id === member.id;
  const canDelete = currentUser?.role === "owner" && !isCurrentUser && member.role !== "owner";
  const canEdit = currentUser?.role === "owner" || currentUser?.role === "manager";

  return (
    <div className={cn(
      "glass-panel rounded-xl p-4 border transition-all",
      member.isActive ? "border-white/10" : "border-red-500/20 opacity-60"
    )}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img
          src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
          alt={member.name}
          className="w-12 h-12 rounded-xl object-cover"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium truncate">{member.name}</p>
            {isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">TÚ</span>
            )}
          </div>
          <RoleBadge role={member.role} />
        </div>

        {/* Menu */}
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-40 glass-panel rounded-xl border border-white/10 py-1 shadow-xl">
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {!isCurrentUser && (
                    <button
                      onClick={() => {
                        toggleStaffStatus(member.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2"
                    >
                      <Power className="w-4 h-4" />
                      {member.isActive ? "Desactivar" : "Activar"}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este empleado?")) {
                          deleteStaffMember(member.id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mail className="w-3 h-3" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="w-3 h-3" />
            <span>{member.phone}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {(member.role === "sales" || member.role === "manager" || member.role === "owner") && (
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">${(member.totalSales / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-slate-500">Ventas</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{member.totalOrders}</p>
            <p className="text-[10px] text-slate-500">Pedidos</p>
          </div>
        </div>
      )}

      {/* Commission (Phase 18 Refinement) */}
      {member.role === "sales" && member.commissionRate && (
        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-slate-400">Comisión ({member.commissionRate}%)</span>
          <span className="text-sm font-bold text-gold">
            ${((member.totalSales * member.commissionRate) / 100).toLocaleString()}
          </span>
        </div>
      )}

      {/* Last Active */}
      {member.lastActiveAt && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          Activo hace {getTimeAgo(member.lastActiveAt)}
        </div>
      )}
    </div>
  );
}

// Helper function
function getTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Top Performers Widget
function TopPerformersWidget() {
  const { getTopPerformers } = useStaff();
  const topPerformers = getTopPerformers(3);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-gold/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Top Vendedores</h3>
          <p className="text-xs text-slate-400">Rendimiento del mes</p>
        </div>
      </div>

      <div className="space-y-3">
        {topPerformers.map((member, idx) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              idx === 0 ? "bg-gold/20 text-gold" :
                idx === 1 ? "bg-slate-400/20 text-slate-400" :
                  "bg-amber-700/20 text-amber-600"
            )}>
              {idx + 1}
            </div>
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{member.name}</p>
              <p className="text-xs text-slate-400">{member.totalOrders} pedidos</p>
            </div>
            <p className="text-green-400 font-bold">${(member.totalSales / 1000).toFixed(1)}k</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffContent() {
  const { staff, currentUser, hasPermission } = useStaff();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<StaffRole | "all">("all");

  const canAddStaff = hasPermission("staff.write");

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(undefined);
  };

  // Stats
  const activeStaff = staff.filter((s) => s.isActive).length;
  const totalSales = staff.reduce((sum, s) => sum + s.totalSales, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Personal</h1>
                  <p className="text-slate-400 text-sm">Gestión de empleados y roles</p>
                </div>
              </div>
            </div>
            {canAddStaff && (
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Empleado
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-panel rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-white">{activeStaff}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Empleados Activos</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">
                    ${(totalSales / 1000).toFixed(0)}k
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Ventas Totales</p>
              </div>
              <div className="glass-panel rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold text-purple-400">
                    {staff.filter((s) => s.role === "owner").length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Administradores</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as StaffRole | "all")}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">Todos los roles</option>
                <option value="owner">👑 Dueños</option>
                <option value="manager">🟣 Gerentes</option>
                <option value="sales">🔵 Vendedores</option>
                <option value="warehouse">🟠 Almacén</option>
              </select>
            </div>

            {/* Staff Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onEdit={() => handleEdit(member)}
                />
              ))}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12 glass-panel rounded-2xl border border-white/10">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Sin empleados</p>
                <p className="text-slate-400 text-sm">
                  {searchTerm || filterRole !== "all"
                    ? "No hay empleados que coincidan con los filtros"
                    : "Agrega tu primer empleado al equipo"}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Performers */}
            <TopPerformersWidget />

            {/* Role Legend */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-400" />
                Permisos por Rol
              </h3>
              <div className="space-y-3">
                {(Object.entries(STAFF_ROLES) as [StaffRole, typeof STAFF_ROLES.owner][]).map(
                  ([key, role]) => (
                    <div key={key} className="p-3 rounded-xl bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{role.icon}</span>
                        <span className="text-white font-medium text-sm">{role.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{role.description}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Current User */}
            {currentUser && (
              <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
                <p className="text-xs text-slate-400 mb-3">Tu sesión actual</p>
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-xl"
                  />
                  <div>
                    <p className="text-white font-medium">{currentUser.name}</p>
                    <RoleBadge role={currentUser.role} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Staff Modal */}
      <StaffModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editStaff={editingStaff}
      />
    </div>
  );
}

export default function StaffPage() {
  return (
    <StaffProvider shopId="default">
      <StaffContent />
    </StaffProvider>
  );
}

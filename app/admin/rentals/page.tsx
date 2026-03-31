"use client";

import { useState, useMemo } from "react";
import {
  Key,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Car,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  DollarSign,
  Eye,
  Play,
  Square,
  RotateCcw,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Rental, RentalStatus } from "@/lib/types/rental.types";
import { formatRentalDates } from "@/lib/types/rental.types";

// Status configuration
const STATUS_CONFIG: Record<RentalStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Key;
}> = {
  pending: {
    label: "Pendiente",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmada",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: CheckCircle2,
  },
  active: {
    label: "En Curso",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: Play,
  },
  completed: {
    label: "Completada",
    color: "text-white/50",
    bgColor: "bg-slate-500/20",
    icon: Square,
  },
  cancelled: {
    label: "Cancelada",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    icon: XCircle,
  },
  no_show: {
    label: "No se presentó",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    icon: AlertCircle,
  },
};

// Mock data
const MOCK_RENTALS: Rental[] = [
  {
    id: "r1",
    shopId: "rentcar-demo",
    vehicleId: "v2",
    rentalNumber: "R-2026-0001",
    vehicleSnapshot: {
      name: "Honda CR-V 2023",
      plate: "XYZ-5678",
      category: "suv",
      thumbnail: "https://images.unsplash.com/photo-1568844293986-8c1c5681b590?w=400",
    },
    customerName: "Juan Pérez",
    customerPhone: "+52 555 123 4567",
    customerEmail: "juan@email.com",
    customerIdNumber: "INE123456",
    customerLicenseNumber: "LIC789012",
    pickupDate: "2026-02-01",
    pickupTime: "10:00",
    returnDate: "2026-02-05",
    returnTime: "10:00",
    pickupLocation: "Oficina Central",
    returnLocation: "Oficina Central",
    dailyRate: 1200,
    totalDays: 4,
    subtotal: 4800,
    extras: [
      { extraId: "e1", name: "Seguro Premium", dailyRate: 150, totalCost: 600 },
      { extraId: "e2", name: "GPS", dailyRate: 50, totalCost: 200 },
    ],
    extrasTotal: 800,
    depositAmount: 8000,
    depositStatus: "collected",
    total: 5600,
    status: "active",
    paymentStatus: "paid",
    mileageAtPickup: 8500,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
  {
    id: "r2",
    shopId: "rentcar-demo",
    vehicleId: "v1",
    rentalNumber: "R-2026-0002",
    vehicleSnapshot: {
      name: "Toyota Corolla 2024",
      plate: "ABC-1234",
      category: "sedan",
      thumbnail: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
    },
    customerName: "María García",
    customerPhone: "+52 555 987 6543",
    customerEmail: "maria@email.com",
    pickupDate: "2026-02-03",
    pickupTime: "14:00",
    returnDate: "2026-02-06",
    returnTime: "14:00",
    pickupLocation: "Aeropuerto",
    returnLocation: "Oficina Central",
    dailyRate: 800,
    totalDays: 3,
    subtotal: 2400,
    extras: [],
    extrasTotal: 0,
    depositAmount: 5000,
    depositStatus: "pending",
    total: 2400,
    status: "confirmed",
    paymentStatus: "partial",
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
  {
    id: "r3",
    shopId: "rentcar-demo",
    vehicleId: "v1",
    rentalNumber: "R-2026-0003",
    vehicleSnapshot: {
      name: "Toyota Corolla 2024",
      plate: "ABC-1234",
      category: "sedan",
      thumbnail: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
    },
    customerName: "Carlos López",
    customerPhone: "+52 555 456 7890",
    pickupDate: "2026-02-10",
    pickupTime: "09:00",
    returnDate: "2026-02-12",
    returnTime: "09:00",
    pickupLocation: "Oficina Central",
    returnLocation: "Oficina Central",
    dailyRate: 800,
    totalDays: 2,
    subtotal: 1600,
    extras: [],
    extrasTotal: 0,
    depositAmount: 5000,
    depositStatus: "pending",
    total: 1600,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
];

export default function RentalsPage() {
  const [rentals, setRentals] = useState<Rental[]>(MOCK_RENTALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RentalStatus | "all">("all");
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filtrar rentas
  const filteredRentals = useMemo(() => {
    return rentals.filter(r => {
      const matchesSearch =
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerPhone.includes(searchTerm) ||
        r.rentalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicleSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicleSnapshot.plate.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [rentals, searchTerm, filterStatus]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: rentals.length,
    pending: rentals.filter(r => r.status === "pending").length,
    confirmed: rentals.filter(r => r.status === "confirmed").length,
    active: rentals.filter(r => r.status === "active").length,
    revenue: rentals
      .filter(r => r.status === "active" || r.status === "completed")
      .reduce((sum, r) => sum + r.total, 0),
  }), [rentals]);

  // Acciones
  const handleConfirm = (rentalId: string) => {
    setRentals(prev =>
      prev.map(r =>
        r.id === rentalId
          ? { ...r, status: "confirmed" as RentalStatus, depositStatus: "collected" as const }
          : r
      )
    );
  };

  const handlePickup = (rentalId: string) => {
    const mileage = prompt("Kilometraje al momento de entrega:");
    if (mileage) {
      setRentals(prev =>
        prev.map(r =>
          r.id === rentalId
            ? {
                ...r,
                status: "active" as RentalStatus,
                mileageAtPickup: parseInt(mileage),
                actualPickupAt: new Date() as any,
              }
            : r
        )
      );
    }
  };

  const handleReturn = (rentalId: string) => {
    const mileage = prompt("Kilometraje al momento de devolución:");
    if (mileage) {
      setRentals(prev =>
        prev.map(r =>
          r.id === rentalId
            ? {
                ...r,
                status: "completed" as RentalStatus,
                mileageAtReturn: parseInt(mileage),
                actualReturnAt: new Date() as any,
                depositStatus: "returned" as const,
              }
            : r
        )
      );
    }
  };

  const handleCancel = (rentalId: string) => {
    if (confirm("¿Estás seguro de cancelar esta reserva?")) {
      setRentals(prev =>
        prev.map(r =>
          r.id === rentalId ? { ...r, status: "cancelled" as RentalStatus } : r
        )
      );
    }
  };

  const openWhatsApp = (phone: string, rental: Rental) => {
    const message = encodeURIComponent(
      `Hola ${rental.customerName}, te contactamos sobre tu reserva ${rental.rentalNumber} del vehículo ${rental.vehicleSnapshot.name}.`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const viewDetails = (rental: Rental) => {
    setSelectedRental(rental);
    setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 md:pb-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="text-cyan-400" />
            Gestión de Rentas
          </h1>
          <p className="text-white/50 text-sm">Administra reservaciones y entregas</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-white/50">Total Rentas</div>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-white/50">Pendientes</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{stats.confirmed}</div>
          <div className="text-sm text-white/50">Confirmadas</div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-sm text-white/50">En Curso</div>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">${stats.revenue.toLocaleString()}</div>
          <div className="text-sm text-white/50">Ingresos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, reserva o vehículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RentalStatus | "all")}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rentals List */}
      <div className="space-y-4">
        {filteredRentals.map(rental => {
          const statusConfig = STATUS_CONFIG[rental.status];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={rental.id}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-cyan-500/30 transition-all"
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Vehicle Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={rental.vehicleSnapshot.thumbnail}
                      alt={rental.vehicleSnapshot.name}
                      className="w-full md:w-32 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-cyan-400">
                            {rental.rentalNumber}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                            statusConfig.bgColor,
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-white mt-1">
                          {rental.vehicleSnapshot.name}
                        </h3>
                        <p className="text-sm text-white/50">
                          {rental.vehicleSnapshot.plate}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          ${rental.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-white/50">
                          {rental.totalDays} días
                        </div>
                      </div>
                    </div>

                    {/* Customer & Dates */}
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-white/50" />
                          <span className="text-white">{rental.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-white/50" />
                          <span className="text-white/70">{rental.customerPhone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-white/50" />
                          <span className="text-white">
                            {formatRentalDates(rental.pickupDate, rental.returnDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-white/50" />
                          <span className="text-white/70">
                            {rental.pickupLocation}
                            {rental.returnLocation !== rental.pickupLocation && (
                              <> → {rental.returnLocation}</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Extras */}
                    {rental.extras.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {rental.extras.map(extra => (
                          <span
                            key={extra.extraId}
                            className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                          >
                            {extra.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(rental)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalles
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWhatsApp(rental.customerPhone, rental)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>

                  {rental.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500"
                        onClick={() => handleConfirm(rental.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => handleCancel(rental.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}

                  {rental.status === "confirmed" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500"
                      onClick={() => handlePickup(rental.id)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Registrar Entrega
                    </Button>
                  )}

                  {rental.status === "active" && (
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-500"
                      onClick={() => handleReturn(rental.id)}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Registrar Devolución
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredRentals.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron rentas</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRental && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Reserva {selectedRental.rentalNumber}
                </h2>
                <p className="text-sm text-white/50">
                  {STATUS_CONFIG[selectedRental.status].label}
                </p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-white/50 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Vehicle */}
              <div className="flex gap-4">
                <img
                  src={selectedRental.vehicleSnapshot.thumbnail}
                  alt={selectedRental.vehicleSnapshot.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {selectedRental.vehicleSnapshot.name}
                  </h3>
                  <p className="text-white/50">{selectedRental.vehicleSnapshot.plate}</p>
                </div>
              </div>

              {/* Customer */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Cliente
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/50">Nombre:</span>
                    <span className="ml-2 text-white">{selectedRental.customerName}</span>
                  </div>
                  <div>
                    <span className="text-white/50">Teléfono:</span>
                    <span className="ml-2 text-white">{selectedRental.customerPhone}</span>
                  </div>
                  {selectedRental.customerEmail && (
                    <div>
                      <span className="text-white/50">Email:</span>
                      <span className="ml-2 text-white">{selectedRental.customerEmail}</span>
                    </div>
                  )}
                  {selectedRental.customerIdNumber && (
                    <div>
                      <span className="text-white/50">ID:</span>
                      <span className="ml-2 text-white">{selectedRental.customerIdNumber}</span>
                    </div>
                  )}
                  {selectedRental.customerLicenseNumber && (
                    <div>
                      <span className="text-white/50">Licencia:</span>
                      <span className="ml-2 text-white">{selectedRental.customerLicenseNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Fechas y Ubicaciones
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-white/50 mb-1">Recogida</div>
                    <div className="text-white font-medium">
                      {selectedRental.pickupDate} a las {selectedRental.pickupTime}
                    </div>
                    <div className="text-white/70 text-xs mt-1">
                      📍 {selectedRental.pickupLocation}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-white/50 mb-1">Devolución</div>
                    <div className="text-white font-medium">
                      {selectedRental.returnDate} a las {selectedRental.returnTime}
                    </div>
                    <div className="text-white/70 text-xs mt-1">
                      📍 {selectedRental.returnLocation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Detalle de Precio
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">
                      {selectedRental.totalDays} días x ${selectedRental.dailyRate.toLocaleString()}
                    </span>
                    <span className="text-white">${selectedRental.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedRental.extras.map(extra => (
                    <div key={extra.extraId} className="flex justify-between">
                      <span className="text-white/50">{extra.name}</span>
                      <span className="text-white">${extra.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-white/10 font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-cyan-400">${selectedRental.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">
                      Depósito ({selectedRental.depositStatus})
                    </span>
                    <span className="text-white/70">
                      ${selectedRental.depositAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mileage */}
              {(selectedRental.mileageAtPickup || selectedRental.mileageAtReturn) && (
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-cyan-400" />
                    Kilometraje
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {selectedRental.mileageAtPickup && (
                      <div>
                        <span className="text-white/50">Al entregar:</span>
                        <span className="ml-2 text-white">
                          {selectedRental.mileageAtPickup.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {selectedRental.mileageAtReturn && (
                      <div>
                        <span className="text-white/50">Al devolver:</span>
                        <span className="ml-2 text-white">
                          {selectedRental.mileageAtReturn.toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {selectedRental.mileageAtPickup && selectedRental.mileageAtReturn && (
                      <div>
                        <span className="text-white/50">Recorrido:</span>
                        <span className="ml-2 text-green-400 font-bold">
                          {(selectedRental.mileageAtReturn - selectedRental.mileageAtPickup).toLocaleString()} km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end">
              <Button onClick={() => setShowDetails(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

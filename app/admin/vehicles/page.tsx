"use client";

import { useState, useEffect } from "react";
import {
  Car,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Users,
  Settings2,
  DollarSign,
  Calendar,
  Check,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  Vehicle,
  VehicleCategory,
  VehicleStatus,
  TransmissionType,
  FuelType,
} from "@/lib/types/rental.types";

// Categorías de vehículos
const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
  { value: "economy", label: "Económico", icon: "🚗" },
  { value: "compact", label: "Compacto", icon: "🚙" },
  { value: "sedan", label: "Sedán", icon: "🚘" },
  { value: "suv", label: "SUV", icon: "🚐" },
  { value: "pickup", label: "Pickup", icon: "🛻" },
  { value: "van", label: "Van", icon: "🚌" },
  { value: "luxury", label: "Lujo", icon: "🏎️" },
];

const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; icon: typeof Car }> = {
  available: { label: "Disponible", color: "text-green-400 bg-green-500/20", icon: Check },
  rented: { label: "Rentado", color: "text-blue-400 bg-blue-500/20", icon: Car },
  reserved: { label: "Reservado", color: "text-yellow-400 bg-yellow-500/20", icon: Calendar },
  maintenance: { label: "Mantenimiento", color: "text-orange-400 bg-orange-500/20", icon: Wrench },
  inactive: { label: "Inactivo", color: "text-slate-400 bg-slate-500/20", icon: AlertCircle },
};

// Mock data inicial
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    shopId: "rentcar-demo",
    name: "Toyota Corolla 2024",
    brand: "Toyota",
    model: "Corolla",
    year: 2024,
    plate: "ABC-1234",
    color: "Blanco",
    category: "sedan",
    transmission: "automatic",
    fuelType: "gasoline",
    seats: 5,
    doors: 4,
    airConditioning: true,
    bluetooth: true,
    dailyRate: 800,
    weeklyRate: 4800,
    monthlyRate: 16000,
    depositAmount: 5000,
    status: "available",
    currentMileage: 15000,
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800",
      "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800",
    ],
    thumbnail: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
    featured: true,
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
  {
    id: "v2",
    shopId: "rentcar-demo",
    name: "Honda CR-V 2023",
    brand: "Honda",
    model: "CR-V",
    year: 2023,
    plate: "XYZ-5678",
    color: "Gris",
    category: "suv",
    transmission: "automatic",
    fuelType: "hybrid",
    seats: 5,
    doors: 4,
    airConditioning: true,
    bluetooth: true,
    dailyRate: 1200,
    weeklyRate: 7000,
    monthlyRate: 24000,
    depositAmount: 8000,
    status: "rented",
    currentRentalId: "r1",
    currentMileage: 8500,
    images: [
      "https://images.unsplash.com/photo-1568844293986-8c1c5681b590?w=800",
    ],
    thumbnail: "https://images.unsplash.com/photo-1568844293986-8c1c5681b590?w=400",
    featured: true,
    isActive: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
];

interface VehicleFormData {
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  doors: number;
  airConditioning: boolean;
  bluetooth: boolean;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  depositAmount: number;
  currentMileage: number;
  images: string[];
  videoUrl?: string;
  notes?: string;
  featured: boolean;
}

const initialFormData: VehicleFormData = {
  name: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  color: "",
  category: "sedan",
  transmission: "automatic",
  fuelType: "gasoline",
  seats: 5,
  doors: 4,
  airConditioning: true,
  bluetooth: true,
  dailyRate: 0,
  weeklyRate: 0,
  monthlyRate: 0,
  depositAmount: 0,
  currentMileage: 0,
  images: [],
  featured: false,
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<VehicleCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | "all">("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Gallery modal
  const [showGallery, setShowGallery] = useState(false);
  const [galleryVehicle, setGalleryVehicle] = useState<Vehicle | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Filtrar vehículos
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || v.category === filterCategory;
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    rented: vehicles.filter(v => v.status === "rented").length,
    maintenance: vehicles.filter(v => v.status === "maintenance").length,
  };

  // Abrir modal para nuevo vehículo
  const handleAddNew = () => {
    setEditingVehicle(null);
    setFormData(initialFormData);
    setActiveImageIndex(0);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      color: vehicle.color,
      category: vehicle.category,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      seats: vehicle.seats,
      doors: vehicle.doors,
      airConditioning: vehicle.airConditioning,
      bluetooth: vehicle.bluetooth,
      dailyRate: vehicle.dailyRate,
      weeklyRate: vehicle.weeklyRate || 0,
      monthlyRate: vehicle.monthlyRate || 0,
      depositAmount: vehicle.depositAmount,
      currentMileage: vehicle.currentMileage,
      images: vehicle.images,
      notes: vehicle.notes,
      featured: vehicle.featured,
    });
    setActiveImageIndex(0);
    setShowModal(true);
  };

  // Guardar vehículo
  const handleSave = () => {
    if (editingVehicle) {
      // Actualizar existente
      setVehicles(prev =>
        prev.map(v =>
          v.id === editingVehicle.id
            ? {
                ...v,
                ...formData,
                thumbnail: formData.images[0] || v.thumbnail,
                updatedAt: new Date() as any,
              }
            : v
        )
      );
    } else {
      // Crear nuevo
      const newVehicle: Vehicle = {
        id: `v${Date.now()}`,
        shopId: "rentcar-demo",
        ...formData,
        status: "available",
        thumbnail: formData.images[0] || "",
        isActive: true,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    setShowModal(false);
  };

  // Eliminar vehículo
  const handleDelete = (vehicleId: string) => {
    if (confirm("¿Estás seguro de eliminar este vehículo?")) {
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }
  };

  // Agregar imagen
  const handleAddImage = () => {
    const url = prompt("URL de la imagen:");
    if (url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url],
      }));
    }
  };

  // Eliminar imagen
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    if (activeImageIndex >= formData.images.length - 1) {
      setActiveImageIndex(Math.max(0, formData.images.length - 2));
    }
  };

  // Abrir galería
  const openGallery = (vehicle: Vehicle, index: number = 0) => {
    setGalleryVehicle(vehicle);
    setGalleryIndex(index);
    setShowGallery(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 md:pb-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="text-cyan-400" />
            Gestión de Vehículos
          </h1>
          <p className="text-slate-400 text-sm">Administra tu flota de vehículos</p>
        </div>
        <Button onClick={handleAddNew} className="bg-cyan-600 hover:bg-cyan-500">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Vehículo
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-slate-400">Total Vehículos</div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{stats.available}</div>
          <div className="text-sm text-slate-400">Disponibles</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-400">{stats.rented}</div>
          <div className="text-sm text-slate-400">Rentados</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-400">{stats.maintenance}</div>
          <div className="text-sm text-slate-400">Mantenimiento</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, placa o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as VehicleCategory | "all")}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">Todas las categorías</option>
          {VEHICLE_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as VehicleStatus | "all")}
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

      {/* Vehicle Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => {
          const statusConfig = STATUS_CONFIG[vehicle.status];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={vehicle.id}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-cyan-500/50 transition-all"
            >
              {/* Image Gallery Preview */}
              <div
                className="relative h-48 bg-slate-800 cursor-pointer"
                onClick={() => openGallery(vehicle)}
              >
                {vehicle.images.length > 0 ? (
                  <img
                    src={vehicle.thumbnail || vehicle.images[0]}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Car className="w-16 h-16" />
                  </div>
                )}

                {/* Image count badge */}
                {vehicle.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {vehicle.images.length}
                  </div>
                )}

                {/* Featured badge */}
                {vehicle.featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-yellow-500 text-black text-xs font-bold">
                    ⭐ Destacado
                  </div>
                )}

                {/* Status badge */}
                <div className={cn(
                  "absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                  statusConfig.color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">{vehicle.name}</h3>
                    <p className="text-sm text-slate-400">{vehicle.plate}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">
                    {VEHICLE_CATEGORIES.find(c => c.value === vehicle.category)?.icon}{" "}
                    {VEHICLE_CATEGORIES.find(c => c.value === vehicle.category)?.label}
                  </span>
                </div>

                {/* Specs */}
                <div className="flex gap-4 text-sm text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {vehicle.seats}
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings2 className="w-4 h-4" />
                    {vehicle.transmission === "automatic" ? "Auto" : "Manual"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    {vehicle.fuelType === "gasoline" ? "Gas" :
                     vehicle.fuelType === "diesel" ? "Diesel" :
                     vehicle.fuelType === "electric" ? "Elec" : "Híb"}
                  </span>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-cyan-400">
                      ${vehicle.dailyRate.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-sm"> /día</span>
                  </div>
                  {vehicle.weeklyRate && (
                    <div className="text-right text-sm">
                      <div className="text-slate-300">${vehicle.weeklyRate.toLocaleString()}/sem</div>
                      {vehicle.monthlyRate && (
                        <div className="text-slate-400">${vehicle.monthlyRate.toLocaleString()}/mes</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVehicles.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No se encontraron vehículos</p>
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer vehículo
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="w-full max-w-3xl bg-slate-900 rounded-2xl border border-white/10 mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingVehicle ? "Editar Vehículo" : "Nuevo Vehículo"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Image Gallery */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fotos del Vehículo
                </label>

                {formData.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative h-64 rounded-xl overflow-hidden bg-slate-800">
                      <img
                        src={formData.images[activeImageIndex]}
                        alt="Vehicle"
                        className="w-full h-full object-cover"
                      />

                      {/* Navigation arrows */}
                      {formData.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveImageIndex(i => Math.max(0, i - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            disabled={activeImageIndex === 0}
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setActiveImageIndex(i => Math.min(formData.images.length - 1, i + 1))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            disabled={activeImageIndex === formData.images.length - 1}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveImage(activeImageIndex)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={cn(
                            "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                            idx === activeImageIndex
                              ? "border-cyan-500"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <button
                        onClick={handleAddImage}
                        className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/40"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAddImage}
                    className="w-full h-48 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:border-white/40 transition-all"
                  >
                    <Upload className="w-12 h-12 mb-2" />
                    <span>Agregar fotos del vehículo</span>
                    <span className="text-sm opacity-60">Click para agregar URL de imagen</span>
                  </button>
                )}
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Video (opcional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="URL de YouTube o video..."
                      value={formData.videoUrl || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre del Vehículo *
                  </label>
                  <input
                    type="text"
                    placeholder="Toyota Corolla 2024"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Placa *
                  </label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    value={formData.plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Toyota"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Corolla"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="Blanco"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VehicleCategory }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {VEHICLE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Transmisión
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value as TransmissionType }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="automatic">Automática</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Combustible
                  </label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value as FuelType }))}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="gasoline">Gasolina</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Eléctrico</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Asientos
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="15"
                      value={formData.seats}
                      onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Puertas
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="5"
                      value={formData.doors}
                      onChange={(e) => setFormData(prev => ({ ...prev, doors: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.airConditioning}
                    onChange={(e) => setFormData(prev => ({ ...prev, airConditioning: e.target.checked }))}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Aire Acondicionado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bluetooth}
                    onChange={(e) => setFormData(prev => ({ ...prev, bluetooth: e.target.checked }))}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300">Bluetooth</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-yellow-500 focus:ring-yellow-500"
                  />
                  <span className="text-slate-300">⭐ Destacar</span>
                </label>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Precios
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Por Día *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Por Semana
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, weeklyRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Por Mes
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Depósito
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kilometraje Actual
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentMileage}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentMileage: parseInt(e.target.value) || 0 }))}
                  className="w-full md:w-1/3 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas Internas
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas sobre el vehículo..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.plate || formData.dailyRate <= 0}
                className="bg-cyan-600 hover:bg-cyan-500"
              >
                {editingVehicle ? "Guardar Cambios" : "Crear Vehículo"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && galleryVehicle && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setShowGallery(false)}
        >
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[80vh] mx-4" onClick={e => e.stopPropagation()}>
            <img
              src={galleryVehicle.images[galleryIndex]}
              alt={galleryVehicle.name}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {galleryVehicle.images.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                  disabled={galleryIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setGalleryIndex(i => Math.min(galleryVehicle.images.length - 1, i + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                  disabled={galleryIndex === galleryVehicle.images.length - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {galleryVehicle.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGalleryIndex(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        idx === galleryIndex ? "bg-white w-4" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="font-bold">{galleryVehicle.name}</h3>
            <p className="text-sm text-slate-400">{galleryVehicle.plate}</p>
          </div>
        </div>
      )}
    </div>
  );
}

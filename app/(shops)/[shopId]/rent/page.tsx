"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Users,
  Fuel,
  Settings,
  Calendar,
  Phone,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Vehicle, VehicleCategory } from "@/lib/types/rental.types";
import { calculateRentalDays, calculateBestRate } from "@/lib/types/rental.types";

// Helper para generar número de renta simple
function generateSimpleRentalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999) + 1;
  return `R-${year}-${random.toString().padStart(4, "0")}`;
}

interface ShopData {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  logo?: string;
}

export default function PublicRentPage() {
  const params = useParams();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | "all">("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Formulario de reserva
  const [reservationForm, setReservationForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupDate: "",
    returnDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Cargar datos de la tienda y vehículos
  useEffect(() => {
    const loadData = async () => {
      if (!shopId) return;
      setLoading(true);

      try {
        // Cargar info de la tienda
        const shopRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopRef);
        if (shopSnap.exists()) {
          setShop({ id: shopSnap.id, ...shopSnap.data() } as ShopData);
        }

        // Cargar vehículos disponibles
        const vehiclesRef = collection(db, `shops/${shopId}/vehicles`);
        const vehiclesSnap = await getDocs(
          query(vehiclesRef, where("status", "==", "available"), orderBy("brand"))
        );
        const vehiclesData = vehiclesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Vehicle[];
        setVehicles(vehiclesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId]);

  // Filtrar vehículos por categoría
  const filteredVehicles = useMemo(() => {
    if (selectedCategory === "all") return vehicles;
    return vehicles.filter((v) => v.category === selectedCategory);
  }, [vehicles, selectedCategory]);

  // Calcular precio estimado
  const estimatedPrice = useMemo(() => {
    if (!selectedVehicle || !reservationForm.pickupDate || !reservationForm.returnDate) {
      return null;
    }
    const days = calculateRentalDays(reservationForm.pickupDate, reservationForm.returnDate);
    if (days <= 0) return null;
    const rate = calculateBestRate(selectedVehicle, days);
    return {
      days,
      dailyRate: rate.dailyRate,
      total: Math.round(rate.dailyRate * days),
      rateType: rate.rateType,
    };
  }, [selectedVehicle, reservationForm.pickupDate, reservationForm.returnDate]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentImageIndex(0);
  };

  const handleReserveClick = () => {
    setShowReservationModal(true);
    setReservationSuccess(false);
    setReservationForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      pickupDate: "",
      returnDate: "",
      notes: "",
    });
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !estimatedPrice) return;

    setSubmitting(true);
    try {
      const rentalNumber = generateSimpleRentalNumber();
      const days = calculateRentalDays(reservationForm.pickupDate, reservationForm.returnDate);

      await addDoc(collection(db, `shops/${shopId}/rentals`), {
        rentalNumber,
        vehicleId: selectedVehicle.id,
        vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
        vehiclePlate: selectedVehicle.plate,
        customerName: reservationForm.customerName,
        customerPhone: reservationForm.customerPhone,
        customerEmail: reservationForm.customerEmail || null,
        pickupDate: reservationForm.pickupDate,
        returnDate: reservationForm.returnDate,
        totalDays: days,
        dailyRate: estimatedPrice.dailyRate,
        totalAmount: estimatedPrice.total,
        depositAmount: selectedVehicle.depositAmount || 0,
        status: "pending",
        notes: reservationForm.notes || null,
        source: "web",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setReservationSuccess(true);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Error al crear la reserva. Por favor intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = (category: VehicleCategory) => {
    const labels: Record<VehicleCategory, string> = {
      sedan: "Sedán",
      suv: "SUV",
      pickup: "Pickup",
      van: "Van",
      luxury: "Lujo",
      economy: "Económico",
      compact: "Compacto",
    };
    return labels[category] || category;
  };

  const getTransmissionLabel = (transmission: string) => {
    return transmission === "automatic" ? "Automático" : "Manual";
  };

  const getFuelLabel = (fuelType: string) => {
    const labels: Record<string, string> = {
      gasoline: "Gasolina",
      diesel: "Diésel",
      electric: "Eléctrico",
      hybrid: "Híbrido",
    };
    return labels[fuelType] || fuelType;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {shop?.logo ? (
                <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Car className="h-6 w-6 text-cyan-400" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg text-white">{shop?.name || "Rent a Car"}</h1>
                <p className="text-sm text-slate-400">Alquiler de vehículos</p>
              </div>
            </div>
            {shop?.whatsapp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://wa.me/${shop.whatsapp}`, "_blank")}
              >
                <Phone className="h-4 w-4 mr-2" />
                Contactar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Todos
            </button>
            {(["economy", "compact", "sedan", "suv", "pickup", "van", "luxury"] as VehicleCategory[]).map(
              (category) => {
                const count = vehicles.filter((v) => v.category === category).length;
                if (count === 0) return null;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {getCategoryLabel(category)} ({count})
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de vehículos */}
          <div className="lg:col-span-2 space-y-4">
            {filteredVehicles.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <Car className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No hay vehículos disponibles</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => handleSelectVehicle(vehicle)}
                  className={`bg-slate-800 rounded-xl border cursor-pointer transition-all hover:border-cyan-500/50 ${
                    selectedVehicle?.id === vehicle.id ? "ring-2 ring-cyan-500 border-cyan-500" : "border-slate-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Imagen */}
                    <div className="sm:w-48 h-40 sm:h-auto relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <Car className="h-12 w-12 text-slate-600" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-cyan-500 text-white text-xs px-2 py-1 rounded">
                        {getCategoryLabel(vehicle.category)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-sm text-slate-400">{vehicle.year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-400">
                            ${vehicle.dailyRate.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">por día</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {vehicle.seats} asientos
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          {getTransmissionLabel(vehicle.transmission)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="h-4 w-4" />
                          {getFuelLabel(vehicle.fuelType)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {vehicle.airConditioning && (
                          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">A/C</span>
                        )}
                        {vehicle.bluetooth && (
                          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">Bluetooth</span>
                        )}
                        <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                          {vehicle.doors} puertas
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Panel de detalles */}
          <div className="lg:col-span-1">
            {selectedVehicle ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 sticky top-24">
                {/* Galería */}
                <div className="relative aspect-video">
                  {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                    <>
                      <img
                        src={selectedVehicle.images[currentImageIndex]}
                        alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                      {selectedVehicle.images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === 0 ? selectedVehicle.images!.length - 1 : prev - 1
                              );
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === selectedVehicle.images!.length - 1 ? 0 : prev + 1
                              );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {selectedVehicle.images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full ${
                                  idx === currentImageIndex ? "bg-white" : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center rounded-t-xl">
                      <Car className="h-16 w-16 text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                    </h2>
                    {selectedVehicle.notes && (
                      <p className="text-sm text-slate-400 mt-1">{selectedVehicle.notes}</p>
                    )}
                  </div>

                  {/* Precios */}
                  <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-white">
                      <span className="text-sm">Por día</span>
                      <span className="font-semibold">${selectedVehicle.dailyRate.toLocaleString()}</span>
                    </div>
                    {selectedVehicle.weeklyRate && (
                      <div className="flex justify-between text-white">
                        <span className="text-sm">Por semana</span>
                        <span className="font-semibold">${selectedVehicle.weeklyRate.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedVehicle.monthlyRate && (
                      <div className="flex justify-between text-white">
                        <span className="text-sm">Por mes</span>
                        <span className="font-semibold">${selectedVehicle.monthlyRate.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedVehicle.depositAmount && (
                      <div className="flex justify-between text-slate-400">
                        <span className="text-sm">Depósito</span>
                        <span>${selectedVehicle.depositAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Características */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {selectedVehicle.seats} asientos
                    </span>
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">
                      {selectedVehicle.doors} puertas
                    </span>
                    {selectedVehicle.airConditioning && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">A/C</span>
                    )}
                    {selectedVehicle.bluetooth && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded">Bluetooth</span>
                    )}
                  </div>

                  <Button className="w-full" onClick={handleReserveClick}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Reservar ahora
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <Car className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">Selecciona un vehículo para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de reservación */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {reservationSuccess ? (
              <div className="text-center py-8 px-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">¡Reserva enviada!</h2>
                <p className="text-slate-400">
                  Tu solicitud de reserva ha sido enviada. Te contactaremos pronto para confirmar.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => {
                    setShowReservationModal(false);
                    setSelectedVehicle(null);
                  }}
                >
                  Entendido
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <div>
                    <h2 className="text-lg font-bold text-white">Reservar vehículo</h2>
                    <p className="text-sm text-slate-400">
                      {selectedVehicle?.brand} {selectedVehicle?.model} {selectedVehicle?.year}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReservationModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitReservation} className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Nombre completo *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      value={reservationForm.customerName}
                      onChange={(e) =>
                        setReservationForm((prev) => ({ ...prev, customerName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      placeholder="+1 809 555 0000"
                      value={reservationForm.customerPhone}
                      onChange={(e) =>
                        setReservationForm((prev) => ({ ...prev, customerPhone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Email (opcional)</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      value={reservationForm.customerEmail}
                      onChange={(e) =>
                        setReservationForm((prev) => ({ ...prev, customerEmail: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Fecha recogida *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        value={reservationForm.pickupDate}
                        onChange={(e) =>
                          setReservationForm((prev) => ({ ...prev, pickupDate: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Fecha devolución *</label>
                      <input
                        type="date"
                        required
                        min={reservationForm.pickupDate || new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        value={reservationForm.returnDate}
                        onChange={(e) =>
                          setReservationForm((prev) => ({ ...prev, returnDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {estimatedPrice && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <div className="flex justify-between text-sm text-white">
                        <span>{estimatedPrice.days} día(s) × ${estimatedPrice.dailyRate.toLocaleString()}</span>
                        <span className="font-semibold">${estimatedPrice.total.toLocaleString()}</span>
                      </div>
                      {selectedVehicle?.depositAmount && (
                        <div className="flex justify-between text-sm text-slate-400 mt-1">
                          <span>+ Depósito (reembolsable)</span>
                          <span>${selectedVehicle.depositAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Notas adicionales</label>
                    <textarea
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none"
                      rows={2}
                      placeholder="Hora preferida de recogida, lugar, etc."
                      value={reservationForm.notes}
                      onChange={(e) =>
                        setReservationForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setShowReservationModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting || !estimatedPrice}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Confirmar reserva"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

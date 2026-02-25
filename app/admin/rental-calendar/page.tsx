"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/shared/auth-context";
import {
  ChevronLeft,
  ChevronRight,
  Car,
  Calendar,
  Info,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import type { Vehicle, VehicleMonthAvailability } from "@/lib/types/rental.types";

type DayStatus = "available" | "rented" | "maintenance" | "blocked" | "partial";

interface Rental {
  id: string;
  rentalNumber: string;
  vehicleId: string;
  vehicleName: string;
  customerName: string;
  pickupDate: string;
  returnDate: string;
  status: string;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  status: DayStatus;
  rentalInfo?: {
    rentalNumber: string;
    customerName: string;
    isPickup?: boolean;
    isReturn?: boolean;
  };
}

export default function RentalCalendarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<Record<string, VehicleMonthAvailability>>({});

  const shopId = user?.shopId || "linko-agency";

  // Cargar vehículos y reservas
  useEffect(() => {
    const loadData = async () => {
      if (!shopId) return;
      setLoading(true);

      try {
        // Cargar vehículos
        const vehiclesRef = collection(db, `shops/${shopId}/vehicles`);
        const vehiclesSnap = await getDocs(query(vehiclesRef, orderBy("brand")));
        const vehiclesData = vehiclesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Vehicle[];
        setVehicles(vehiclesData);

        // Cargar reservas activas
        const rentalsRef = collection(db, `shops/${shopId}/rentals`);
        const rentalsSnap = await getDocs(
          query(
            rentalsRef,
            where("status", "in", ["pending", "confirmed", "active"]),
            orderBy("pickupDate")
          )
        );
        const rentalsData = rentalsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Rental[];
        setRentals(rentalsData);

        // Cargar disponibilidad del mes actual
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const monthKey = `${year}-${String(month).padStart(2, "0")}`;

        const availabilityData: Record<string, VehicleMonthAvailability> = {};
        for (const vehicle of vehiclesData) {
          const availRef = collection(db, `shops/${shopId}/vehicles/${vehicle.id}/availability`);
          const availSnap = await getDocs(query(availRef, where("month", "==", monthKey)));
          if (!availSnap.empty) {
            availabilityData[vehicle.id] = availSnap.docs[0].data() as VehicleMonthAvailability;
          }
        }
        setAvailability(availabilityData);
      } catch (error) {
        console.error("Error loading calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId, currentDate]);

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false,
        status: "available",
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];

      let status: DayStatus = "available";
      let rentalInfo: CalendarDay["rentalInfo"] = undefined;

      const vehiclesToCheck =
        selectedVehicle === "all"
          ? vehicles
          : vehicles.filter((v) => v.id === selectedVehicle);

      let rentedCount = 0;
      let availableCount = 0;

      for (const vehicle of vehiclesToCheck) {
        const vehicleAvail = availability[vehicle.id];
        const dayAvail = vehicleAvail?.days[String(day)];

        if (vehicle.status === "maintenance") {
          // No contar como disponible
        } else if (dayAvail?.status === "reserved" || dayAvail?.status === "rented") {
          rentedCount++;
          const rental = rentals.find(
            (r) =>
              r.vehicleId === vehicle.id &&
              new Date(r.pickupDate) <= date &&
              new Date(r.returnDate) >= date
          );
          if (rental) {
            rentalInfo = {
              rentalNumber: rental.rentalNumber,
              customerName: rental.customerName,
              isPickup: rental.pickupDate === dateStr,
              isReturn: rental.returnDate === dateStr,
            };
          }
        } else {
          availableCount++;
        }
      }

      if (selectedVehicle === "all") {
        if (rentedCount === 0) {
          status = "available";
        } else if (availableCount === 0) {
          status = "rented";
        } else {
          status = "partial";
        }
      } else {
        const vehicle = vehicles.find((v) => v.id === selectedVehicle);
        if (vehicle?.status === "maintenance") {
          status = "maintenance";
        } else if (rentedCount > 0) {
          status = "rented";
        } else {
          status = "available";
        }
      }

      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        status,
        rentalInfo,
      });
    }

    // Días del próximo mes
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        dayOfMonth: i,
        isCurrentMonth: false,
        status: "available",
      });
    }

    return days;
  }, [currentDate, vehicles, rentals, availability, selectedVehicle]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getStatusColor = (status: DayStatus) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-400 hover:bg-green-500/30";
      case "rented":
        return "bg-red-500/20 text-red-400";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-400";
      case "blocked":
        return "bg-slate-500/20 text-slate-400";
      case "partial":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-slate-800";
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // Estadísticas del mes
  const monthStats = useMemo(() => {
    const currentMonthDays = calendarDays.filter((d) => d.isCurrentMonth);
    return {
      available: currentMonthDays.filter((d) => d.status === "available").length,
      rented: currentMonthDays.filter((d) => d.status === "rented").length,
      partial: currentMonthDays.filter((d) => d.status === "partial").length,
      maintenance: currentMonthDays.filter((d) => d.status === "maintenance").length,
    };
  }, [calendarDays]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-cyan-400" />
            Calendario de Disponibilidad
          </h1>
          <p className="text-slate-400">Vista de disponibilidad de vehículos por fecha</p>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Selector de vehículo */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Car className="h-4 w-4 text-slate-400" />
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white w-full sm:w-[250px]"
            >
              <option value="all">Todos los vehículos</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} ({vehicle.plate})
                </option>
              ))}
            </select>
          </div>

          {/* Navegación de mes */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth("prev")}
              className="w-9 h-9 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-lg min-w-[180px] text-center text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth("next")}
              className="w-9 h-9 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
          <span className="text-slate-300">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
          <span className="text-slate-300">Rentado</span>
        </div>
        {selectedVehicle === "all" && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/50" />
            <span className="text-slate-300">Parcialmente disponible</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50" />
          <span className="text-slate-300">En mantenimiento</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        {/* Encabezados de días */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-medium text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[80px] p-2 rounded-lg border border-slate-700 transition-colors
                ${!day.isCurrentMonth ? "opacity-40 bg-slate-900" : getStatusColor(day.status)}
                ${day.isCurrentMonth && day.status === "available" ? "cursor-pointer" : ""}
              `}
            >
              <div className="font-medium text-sm">{day.dayOfMonth}</div>
              {day.isCurrentMonth && day.rentalInfo && (
                <div className="mt-1 text-xs">
                  <div className="truncate font-medium">#{day.rentalInfo.rentalNumber}</div>
                  <div className="truncate text-slate-400">{day.rentalInfo.customerName}</div>
                  {day.rentalInfo.isPickup && (
                    <span className="inline-block text-[10px] px-1 mt-1 bg-blue-500/20 text-blue-400 rounded">
                      Recogida
                    </span>
                  )}
                  {day.rentalInfo.isReturn && (
                    <span className="inline-block text-[10px] px-1 mt-1 bg-purple-500/20 text-purple-400 rounded">
                      Devolución
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Días disponibles</p>
              <p className="text-2xl font-bold text-green-400">{monthStats.available}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Días rentados</p>
              <p className="text-2xl font-bold text-red-400">{monthStats.rented}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Car className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>

        {selectedVehicle === "all" && (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Parcial</p>
                <p className="text-2xl font-bold text-orange-400">{monthStats.partial}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Info className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-400">{monthStats.maintenance}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de reservas del mes */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Reservas del mes</h2>
        </div>
        <div className="p-4">
          {rentals.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay reservas para este mes
            </div>
          ) : (
            <div className="space-y-3">
              {rentals
                .filter((rental) => {
                  const pickupDate = new Date(rental.pickupDate);
                  const returnDate = new Date(rental.returnDate);
                  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                  return pickupDate <= monthEnd && returnDate >= monthStart;
                })
                .filter((rental) => selectedVehicle === "all" || rental.vehicleId === selectedVehicle)
                .map((rental) => {
                  const vehicle = vehicles.find((v) => v.id === rental.vehicleId);
                  return (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                          <Car className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {vehicle?.brand} {vehicle?.model}
                          </p>
                          <p className="text-sm text-slate-400">
                            {rental.customerName} - #{rental.rentalNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {new Date(rental.pickupDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(rental.returnDate).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded ${rental.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : rental.status === "confirmed"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                        >
                          {rental.status === "active"
                            ? "En curso"
                            : rental.status === "confirmed"
                              ? "Confirmada"
                              : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

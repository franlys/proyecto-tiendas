"use client";

import { useState, useMemo } from "react";
import { useOrders, useInventory } from "@/components/shared";
import {
  Users,
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Minus,
  X,
  ShoppingBag,
  Search,
  Send,
  Trash2,
  UtensilsCrossed,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/constants";

// Configuración de mesas (en producción, cargar desde config)
const DEFAULT_TABLES = 12;

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function WaiterDashboard() {
  const { orders, addOrder, updateStatus } = useOrders();
  const { products } = useInventory();

  // Estado del panel
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [tableCount] = useState(DEFAULT_TABLES);

  // Generar array de mesas
  const TABLES = useMemo(() =>
    Array.from({ length: tableCount }, (_, i) => (i + 1).toString()),
    [tableCount]
  );

  // Obtener estado de mesas activas
  const activeTables = useMemo(() => {
    const tableStatus: Record<string, {
      total: number;
      items: number;
      status: string;
      time: string;
      orderId?: string;
    }> = {};

    orders
      .filter(o => o.tableId && (o.status === "pending" || o.status === "completed"))
      .forEach(order => {
        if (!tableStatus[order.tableId!]) {
          tableStatus[order.tableId!] = {
            total: 0,
            items: 0,
            status: order.status === "pending" ? "active" : "ready",
            time: order.date,
            orderId: order.id,
          };
        }
        tableStatus[order.tableId!].total += order.total;
        tableStatus[order.tableId!].items += order.items.length;
      });

    return tableStatus;
  }, [orders]);

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(term) ||
           p.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Agrupar productos por categoría
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });
    return grouped;
  }, [filteredProducts]);

  // Calcular total del pedido actual
  const orderTotal = useMemo(() =>
    currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [currentOrder]
  );

  // Agregar producto al pedido
  const addToOrder = (product: Product) => {
    setCurrentOrder(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.promoPrice || product.price,
        quantity: 1,
      }];
    });
  };

  // Modificar cantidad
  const updateQuantity = (productId: string, delta: number) => {
    setCurrentOrder(prev => {
      const updated = prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
      return updated;
    });
  };

  // Eliminar item
  const removeItem = (productId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.productId !== productId));
  };

  // Enviar pedido
  const submitOrder = () => {
    if (!selectedTable || currentOrder.length === 0) return;

    const orderData = {
      shopId: "restaurant", // En producción, obtener del contexto de la tienda
      shopName: "Restaurante",
      tableId: selectedTable,
      items: currentOrder.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      total: orderTotal,
      customerName: `Mesa ${selectedTable}`,
      customerPhone: "",
      orderType: "dine-in" as const,
    };

    try {
      addOrder(orderData);

      // Limpiar estado
      setCurrentOrder([]);
      setSelectedTable(null);
      setShowOrderModal(false);

      // Mostrar notificación (en producción usar toast)
      alert(`Pedido enviado a cocina - Mesa ${selectedTable}`);
    } catch (error) {
      console.error("Error al enviar pedido:", error);
      alert("Error al enviar el pedido");
    }
  };

  // Seleccionar mesa y abrir modal
  const handleTableClick = (tableId: string) => {
    setSelectedTable(tableId);
    setShowOrderModal(true);
    setSearchTerm("");

    // Si la mesa tiene pedido activo, cargar items existentes (opcional)
    // Por ahora empezamos con orden vacía
    setCurrentOrder([]);
  };

  // Cerrar cuenta de mesa
  const closeTable = async (tableId: string) => {
    const tableInfo = activeTables[tableId];
    if (tableInfo?.orderId) {
      await updateStatus(tableInfo.orderId, "cancelled"); // O un nuevo status "paid"
    }
  };

  // Calcular tiempo transcurrido
  const getElapsedTime = (dateStr: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 md:pb-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950 z-20 py-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="text-orange-500" />
            Panel de Meseros
          </h1>
          <p className="text-white/50 text-sm">
            Toca una mesa para tomar pedido
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="text-white/50">Mesas activas</div>
            <div className="text-xl font-bold text-orange-400">
              {Object.keys(activeTables).length}/{tableCount}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="!p-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {TABLES.map((tableNum) => {
          const info = activeTables[tableNum];
          const isActive = !!info;

          return (
            <button
              key={tableNum}
              onClick={() => handleTableClick(tableNum)}
              className={cn(
                "relative p-4 rounded-xl border transition-all h-28 flex flex-col",
                isActive
                  ? "bg-orange-500/20 border-orange-500/50 hover:bg-orange-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-xl font-bold",
                  isActive ? "text-orange-400" : "text-white/40"
                )}>
                  {tableNum}
                </span>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded-full bg-orange-500/30 text-orange-300 text-[10px] font-bold">
                    {info.status === "ready" ? "Listo" : "Activa"}
                  </span>
                )}
              </div>

              {isActive ? (
                <div className="mt-auto text-left">
                  <div className="text-lg font-mono font-bold text-white">
                    ${info.total.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Clock className="w-3 h-3" />
                    {getElapsedTime(info.time)}
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Comandas Pendientes */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          Comandas en Cocina
        </h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders
            .filter(o => o.tableId && o.status === "pending")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(order => (
              <div
                key={order.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-bold text-white">
                      Mesa {order.tableId}
                    </div>
                    <div className="text-xs text-white/50">
                      #{order.id.slice(-6)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-orange-400">
                      {getElapsedTime(order.date)}
                    </div>
                  </div>
                </div>

                <ul className="text-sm text-white/70 mb-4 space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.quantity || 1}x {item.name}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-500"
                    onClick={() => updateStatus(order.id, "completed")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Listo
                  </Button>
                </div>
              </div>
            ))
          }

          {orders.filter(o => o.tableId && o.status === "pending").length === 0 && (
            <div className="col-span-full text-center py-8 text-white/40">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay comandas pendientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Toma de Pedido */}
      {showOrderModal && selectedTable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
          {/* Panel de Productos */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-orange-500 text-white">
                    Mesa {selectedTable}
                  </span>
                  Nuevo Pedido
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOrderModal(false);
                    setCurrentOrder([]);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Grid de Productos por Categoría */}
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-semibold text-white/50 uppercase mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryProducts.map(product => {
                      const inOrder = currentOrder.find(i => i.productId === product.id);

                      return (
                        <button
                          key={product.id}
                          onClick={() => addToOrder(product)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            inOrder
                              ? "bg-cyan-500/20 border-cyan-500/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div className="font-medium text-white truncate">
                            {product.name}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-cyan-400 font-mono font-bold">
                              ${(product.promoPrice || product.price).toLocaleString()}
                            </span>
                            {inOrder && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-bold">
                                {inOrder.quantity}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-white/40">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Pedido Actual */}
          <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                Pedido Actual
              </h3>
              <p className="text-sm text-white/50">
                {currentOrder.length} {currentOrder.length === 1 ? "producto" : "productos"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentOrder.map(item => (
                <div
                  key={item.productId}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-white text-sm">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-white/50 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-mono text-cyan-400">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {currentOrder.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  <p className="text-sm">Selecciona productos para agregar</p>
                </div>
              )}
            </div>

            {/* Footer con Total y Botón Enviar */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span className="text-white/50">Total</span>
                <span className="font-mono font-bold text-white">
                  ${orderTotal.toLocaleString()}
                </span>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-500"
                disabled={currentOrder.length === 0}
                onClick={submitOrder}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar a Cocina
              </Button>

              {activeTables[selectedTable] && (
                <Button
                  variant="outline"
                  className="w-full border-slate-600"
                  onClick={() => closeTable(selectedTable)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cerrar Cuenta
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

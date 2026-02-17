"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  DollarSign,
  Phone,
  MessageCircle,
  ChevronRight,
  X,
  FileText,
  Bell,
  Volume2,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  SalesOrdersProvider,
  useSalesOrders,
  ORDER_STATUS_CONFIG,
  type SalesOrder,
  type OrderStatus,
} from "@/components/shared/sales-orders-context";
import { useAuth } from "@/components/shared/auth-context";
import { useShops, ShopsProvider } from "@/components/shared/shops-context";
import { InvoiceTemplate } from "@/components/admin/invoice-template";
import { pdf } from "@react-pdf/renderer";
import { cn } from "@/lib/utils";

// Order Detail Modal
function OrderDetailModal({
  order,
  onClose,
  shopId,
}: {
  order: SalesOrder | null;
  onClose: () => void;
  shopId: string;
}) {
  const { updateOrderStatus, updatePaymentStatus } = useSalesOrders();
  const { getShop } = useShops();
  const [isNotifying, setIsNotifying] = useState(false);
  const [autoNotify, setAutoNotify] = useState(true); // Auto-notify enabled by default
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [sendingQuickMessage, setSendingQuickMessage] = useState<string | null>(null);

  if (!order) return null;

  const shop = getShop(shopId);

  // Generate and download invoice PDF
  const handleGenerateInvoice = async () => {
    if (!shop) {
      alert("No se pudo cargar la información de la tienda");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const blob = await pdf(
        <InvoiceTemplate
          order={order}
          shop={shop}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Factura-${order.orderNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar la factura. Intenta de nuevo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  const statusOrder: OrderStatus[] = ["pending", "confirmed", "preparing", "dispatched", "delivered"];
  const currentIndex = statusOrder.indexOf(order.status);
  const canAdvance = currentIndex < statusOrder.length - 1 && order.status !== "cancelled";
  const nextStatus = canAdvance ? statusOrder[currentIndex + 1] : null;

  // Send notification via API or fallback to WhatsApp link
  const sendStatusNotification = async (status: OrderStatus) => {
    if (!order.customerPhone) {
      console.log("No customer phone available");
      return;
    }

    setIsNotifying(true);
    try {
      const response = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          status,
          total: order.total,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Notification sent via Evolution API");
      } else if (data.needsSetup) {
        console.warn("⚠️ Bot no configurado - mensaje no enviado");
      } else if (data.whatsappUrl && confirm("⚠️ Error al enviar via bot. ¿Abrir WhatsApp manualmente?")) {
        // Fallback: open WhatsApp link only if user confirms
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setIsNotifying(false);
    }
  };

  const handleAdvance = async () => {
    if (nextStatus) {
      console.log(`[OrderDetail] Advancing order ${order.id} from ${order.status} to ${nextStatus}`);

      try {
        await updateOrderStatus(order.id, nextStatus);
        console.log(`[OrderDetail] ✅ Order advanced successfully`);

        // Send notification if auto-notify is enabled and customer has phone
        if (autoNotify && order.customerPhone) {
          await sendStatusNotification(nextStatus);
        }

        // If order is being delivered and payment is pending, send payment reminder
        if (nextStatus === "delivered" && order.paymentStatus === "pending" && order.customerPhone) {
          try {
            await fetch("/api/orders/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shopId,
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerPhone: order.customerPhone,
                customerName: order.customerName,
                status: "payment_reminder",
                total: order.total,
              }),
            });
            console.log(`[OrderDetail] Payment reminder sent for unpaid order`);
          } catch (e) {
            console.error("Error sending payment reminder:", e);
          }
        }

        // Play sound effect
        if (typeof window !== "undefined") {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => { });
        }

        // Close modal after successful update
        onClose();
      } catch (error) {
        console.error(`[OrderDetail] ❌ Error advancing order:`, error);
      }
    }
  };

  const handleCancel = () => {
    if (confirm("¿Estás seguro de cancelar este pedido?")) {
      updateOrderStatus(order.id, "cancelled");
    }
  };

  const getWhatsAppUrl = (type: "status" | "ready_pickup" | "ready_delivery" | "on_way_location") => {
    let message = "";
    const cleanPhone = order.customerPhone?.replace(/\D/g, "") || "";

    switch (type) {
      case "ready_pickup":
        message = `Hola ${order.customerName} 👋\n\nTu pedido *${order.orderNumber}* está LISTO ✅.\n\nPuedes pasar a recogerlo cuando gustes.\n\nTotal a pagar: $${order.total.toFixed(2)}`;
        break;
      case "ready_delivery":
        message = `Hola ${order.customerName} 👋\n\nTu pedido *${order.orderNumber}* está LISTO ✅.\n\n¿Prefieres pasar por él o te lo enviamos a domicilio? 🛵`;
        break;
      case "on_way_location":
        message = `Hola ${order.customerName} 👋\n\nTu pedido va en camino 🛵.\n\nPor favor, compártenos tu ubicación actual para facilitar la entrega 📍.\n\nTotal: $${order.total.toFixed(2)}`;
        break;
      default:
        const statusMsg = ORDER_STATUS_CONFIG[order.status];
        message = `Hola ${order.customerName}!\n\n` +
          `Tu pedido *${order.orderNumber}* está: ${statusMsg.icon} ${statusMsg.label}\n\n` +
          `Total: $${order.total.toFixed(2)}\n\n` +
          `Gracias por tu compra! 🙏`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Send quick message via Evolution API
  const sendQuickMessage = async (type: "ready_pickup" | "on_way_location") => {
    if (!order.customerPhone) {
      alert("El cliente no tiene teléfono registrado");
      return;
    }

    setSendingQuickMessage(type);
    try {
      const response = await fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          status: type,
          total: order.total,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Mensaje enviado correctamente via bot");
      } else if (data.needsSetup) {
        // Bot not configured - show clear error
        alert("⚠️ Bot de WhatsApp no configurado.\n\nPara enviar mensajes automáticamente, configura:\n• EVOLUTION_API_URL\n• EVOLUTION_API_KEY\n\nen las variables de entorno de Vercel.");
      } else if (data.whatsappUrl) {
        // Fallback: offer to open WhatsApp link
        if (confirm("⚠️ Error al enviar via bot.\n\n¿Abrir WhatsApp manualmente para enviar el mensaje?")) {
          window.open(data.whatsappUrl, "_blank");
        }
      } else {
        alert("Error al enviar mensaje: " + (data.error || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error sending quick message:", error);
      alert("Error al enviar mensaje. Intenta de nuevo.");
    } finally {
      setSendingQuickMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
              statusConfig.color === "amber" && "bg-amber-500/20",
              statusConfig.color === "blue" && "bg-blue-500/20",
              statusConfig.color === "purple" && "bg-purple-500/20",
              statusConfig.color === "cyan" && "bg-cyan-500/20",
              statusConfig.color === "green" && "bg-green-500/20",
              statusConfig.color === "red" && "bg-red-500/20"
            )}>
              {statusConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <code className="px-2 py-0.5 rounded bg-white/10 text-sm text-white font-mono">
                  {order.orderNumber}
                </code>
                {order.isWholesale && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium">
                    MAYORISTA
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{order.customerName}</h2>
              <p className="text-slate-400 text-sm">{order.customerPhone}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Progress */}
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex items-center justify-between min-w-[500px]">
              {statusOrder.map((status, idx) => {
                const config = ORDER_STATUS_CONFIG[status];
                const isActive = idx <= currentIndex;
                const isCurrent = status === order.status;

                return (
                  <div key={status} className="flex items-center flex-1 last:flex-none">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shrink-0",
                      isActive ? "bg-green-500/20 border-2 border-green-500" : "bg-white/5 border-2 border-white/20",
                      isCurrent && "ring-2 ring-green-500/50 ring-offset-2 ring-offset-slate-900"
                    )}>
                      {isActive ? "✓" : config.icon}
                    </div>
                    {idx < statusOrder.length - 1 && (
                      <div className={cn(
                        "h-0.5 mx-2 flex-1",
                        isActive && idx < currentIndex ? "bg-green-500" : "bg-white/20"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Productos</h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">{item.productName}</p>
                    <p className="text-sm text-slate-400">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-white font-bold">${item.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-xl bg-white/5 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA (16%)</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-4 rounded-xl bg-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">Estado de pago</span>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                order.paymentStatus === "paid" && "bg-green-500/20 text-green-400",
                order.paymentStatus === "pending" && "bg-amber-500/20 text-amber-400",
                order.paymentStatus === "refunded" && "bg-red-500/20 text-red-400"
              )}>
                {order.paymentStatus === "paid" && "💰 Pagado"}
                {order.paymentStatus === "pending" && "⏳ Pendiente"}
                {order.paymentStatus === "refunded" && "↩️ Reembolsado"}
              </span>
            </div>
            {order.paymentStatus === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await updatePaymentStatus(order.id, "paid");
                    // Send payment confirmed notification
                    if (order.customerPhone) {
                      try {
                        await fetch("/api/orders/notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            shopId,
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            customerPhone: order.customerPhone,
                            customerName: order.customerName,
                            status: "payment_confirmed",
                            total: order.total,
                          }),
                        });
                      } catch (e) {
                        console.error("Error sending payment confirmation:", e);
                      }
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar Pagado
                </Button>
                {order.customerPhone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/orders/notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            shopId,
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            customerPhone: order.customerPhone,
                            customerName: order.customerName,
                            status: "payment_reminder",
                            total: order.total,
                          }),
                        });
                        const data = await response.json();
                        if (data.success) {
                          alert("✅ Recordatorio de pago enviado");
                        } else if (data.whatsappUrl) {
                          window.open(data.whatsappUrl, "_blank");
                        }
                      } catch (e) {
                        console.error("Error sending payment reminder:", e);
                        alert("Error al enviar recordatorio");
                      }
                    }}
                    className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Recordar Pago
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-sm">📝 {order.notes}</p>
            </div>
          )}

          {/* Order Details (toggle with Info button) */}
          {showDetails && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 space-y-3">
              <h4 className="font-medium text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Detalles del Pedido
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Número de Orden</p>
                  <p className="text-white font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400">Fecha</p>
                  <p className="text-white">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Hora</p>
                  <p className="text-white">
                    {new Date(order.createdAt).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Origen</p>
                  <p className="text-white capitalize">{order.source || "web"}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cliente</p>
                  <p className="text-white">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Teléfono</p>
                  <p className="text-white">{order.customerPhone || "No registrado"}</p>
                </div>
              </div>
              {order.customerPhone && (
                <a
                  href={getWhatsAppUrl("status")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-center w-full mt-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    "text-green-400 border border-green-500/30 hover:bg-green-500/10"
                  )}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar resumen por WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Auto-notify toggle */}
          {order.customerPhone && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span className="text-slate-400">Notificar al cliente automáticamente</span>
              </div>
              <button
                onClick={() => setAutoNotify(!autoNotify)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  autoNotify ? "bg-green-500" : "bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                    autoNotify && "translate-x-6"
                  )}
                />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {canAdvance && nextStatus && (
              <Button onClick={handleAdvance} className="w-full" disabled={isNotifying}>
                {isNotifying ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Avanzar a: {ORDER_STATUS_CONFIG[nextStatus].label}
                {autoNotify && order.customerPhone && " + Notificar"}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sendQuickMessage("ready_pickup")}
                disabled={sendingQuickMessage === "ready_pickup" || !order.customerPhone}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingQuickMessage === "ready_pickup" ? (
                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3 mr-1" />
                )}
                Listo (Recoger)
              </button>
              <button
                onClick={() => sendQuickMessage("on_way_location")}
                disabled={sendingQuickMessage === "on_way_location" || !order.customerPhone}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-xs font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingQuickMessage === "on_way_location" ? (
                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Truck className="w-3 h-3 mr-1" />
                )}
                Pedir Ubicación
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className={cn(
                  "border-slate-500/30",
                  showDetails ? "bg-slate-500/20 text-white" : "text-slate-400 hover:bg-slate-500/10"
                )}
              >
                <FileText className="w-4 h-4 mr-2" />
                Info
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateInvoice}
                disabled={isGeneratingPdf}
                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                {isGeneratingPdf ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Factura
              </Button>
              {order.status !== "cancelled" && order.status !== "delivered" && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

// Order Card
function OrderCard({ order, onClick }: { order: SalesOrder; onClick: () => void }) {
  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer transition-all hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <code className="text-xs text-slate-400 font-mono">{order.orderNumber}</code>
          <p className="text-white font-medium">{order.customerName}</p>
        </div>
        {order.isWholesale && (
          <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-medium">
            MAYOREO
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          {order.items.length} producto{order.items.length > 1 ? "s" : ""}
        </span>
        <span className="text-white font-bold">${order.total.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-medium",
          order.paymentStatus === "paid" && "bg-green-500/20 text-green-400",
          order.paymentStatus === "pending" && "bg-amber-500/20 text-amber-400"
        )}>
          {order.paymentStatus === "paid" ? "💰 Pagado" : "⏳ Por pagar"}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(order.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

// Kanban Column
function KanbanColumn({ status, orders, onOrderClick }: {
  status: OrderStatus;
  orders: SalesOrder[];
  onOrderClick: (order: SalesOrder) => void;
}) {
  const config = ORDER_STATUS_CONFIG[status];

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={cn(
        "flex items-center gap-2 mb-4 p-3 rounded-xl",
        config.color === "amber" && "bg-amber-500/10 border border-amber-500/20",
        config.color === "blue" && "bg-blue-500/10 border border-blue-500/20",
        config.color === "purple" && "bg-purple-500/10 border border-purple-500/20",
        config.color === "cyan" && "bg-cyan-500/10 border border-cyan-500/20",
        config.color === "green" && "bg-green-500/10 border border-green-500/20"
      )}>
        <span className="text-xl">{config.icon}</span>
        <span className={cn(
          "font-medium",
          config.color === "amber" && "text-amber-400",
          config.color === "blue" && "text-blue-400",
          config.color === "purple" && "text-purple-400",
          config.color === "cyan" && "text-cyan-400",
          config.color === "green" && "text-green-400"
        )}>
          {config.label}
        </span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-white text-xs">
          {orders.length}
        </span>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
        ))}

        {orders.length === 0 && (
          <div className="p-8 text-center text-slate-500 border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-sm">Sin pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}

// History Table Component
function HistoryTable({ orders, onOrderClick }: { orders: SalesOrder[]; onOrderClick: (order: SalesOrder) => void }) {
  if (orders.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 border-2 border-dashed border-white/10 rounded-xl">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay historial de pedidos</p>
        <p className="text-sm">Los pedidos entregados y cancelados aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-slate-400 font-medium">
          <tr>
            <th className="p-4">Orden</th>
            <th className="p-4">Fecha</th>
            <th className="p-4">Cliente</th>
            <th className="p-4">Estado</th>
            <th className="p-4">Pago</th>
            <th className="p-4 text-right">Total</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status];
            return (
              <tr
                key={order.id}
                className="hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => onOrderClick(order)}
              >
                <td className="p-4 font-mono text-slate-300">{order.orderNumber}</td>
                <td className="p-4 text-slate-300">
                  {new Date(order.createdAt).toLocaleDateString("es-MX", {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="p-4 text-white font-medium">{order.customerName}</td>
                <td className="p-4">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    statusConfig.color === "green" && "bg-green-500/10 text-green-400 border-green-500/20",
                    statusConfig.color === "red" && "bg-red-500/10 text-red-400 border-red-500/20"
                  )}>
                    {statusConfig.icon} {statusConfig.label}
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    order.paymentStatus === "paid" && "text-green-400",
                    order.paymentStatus === "pending" && "text-amber-400",
                    order.paymentStatus === "refunded" && "text-red-400"
                  )}>
                    {order.paymentStatus === "paid" ? "Pagado" : order.paymentStatus === "pending" ? "Pendiente" : "Reembolsado"}
                  </span>
                </td>
                <td className="p-4 text-right font-bold text-white">${order.total.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                    Ver
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersContent({ shopId }: { shopId: string }) {
  const { orders, getOrdersByStatus, getPendingOrders } = useSalesOrders();
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<"active" | "history">("active");

  // Stats
  const pendingCount = getPendingOrders().length;
  const todayTotal = orders
    .filter((o) => o.createdAt.startsWith(new Date().toISOString().split("T")[0]) && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  // Play notification sound for new pending orders
  useEffect(() => {
    if (pendingCount > 0 && soundEnabled) {
      // Would play notification sound here
      console.log("🔔 New pending order!");
    }
  }, [pendingCount, soundEnabled]);

  const activeStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "dispatched"];

  // Filter for history view
  const historyOrders = orders.filter(o => o.status === "delivered" || o.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Pedidos</h1>
                  <p className="text-slate-400 text-sm">Centro de comandos</p>
                </div>
              </div>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex p-1 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setViewMode("active")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "active" ? "bg-amber-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  Activos
                </button>
                <button
                  onClick={() => setViewMode("history")}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "history" ? "bg-slate-700 text-white shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  Historial
                </button>
              </div>

              {/* Notification Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  soundEnabled ? "text-amber-400 bg-amber-500/10" : "text-slate-400 bg-white/5"
                )}
                title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-3">
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">{pendingCount} nuevos</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400">
                  <span className="font-medium">Hoy: ${todayTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {viewMode === "active" ? (
          <>
            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-4">
              {activeStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  orders={getOrdersByStatus(status)}
                  onOrderClick={setSelectedOrder}
                />
              ))}
            </div>

            {/* Completed Orders Summary */}
            <div className="mt-8 glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Resumen de Hoy
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-green-500/10">
                  <p className="text-2xl font-bold text-green-400">
                    {getOrdersByStatus("delivered").length}
                  </p>
                  <p className="text-xs text-slate-400">Entregados</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10">
                  <p className="text-2xl font-bold text-red-400">
                    {getOrdersByStatus("cancelled").length}
                  </p>
                  <p className="text-xs text-slate-400">Cancelados</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10">
                  <p className="text-2xl font-bold text-blue-400">{orders.length}</p>
                  <p className="text-xs text-slate-400">Total pedidos</p>
                </div>
                <div className="p-4 rounded-xl bg-gold/10">
                  <p className="text-2xl font-bold text-gold">
                    {orders.filter((o) => o.isWholesale).length}
                  </p>
                  <p className="text-xs text-slate-400">Mayoristas</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* History View */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Historial de Pedidos</h2>
              <div className="text-sm text-slate-400">
                Mostrando últimos {historyOrders.length} pedidos finalizados
              </div>
            </div>
            <HistoryTable orders={historyOrders} onOrderClick={setSelectedOrder} />
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} shopId={shopId} />
    </div>
  );
}

// Shop Selector for Super Admin
function ShopSelector({ selectedShopId, onSelect }: { selectedShopId: string; onSelect: (id: string) => void }) {
  const { shops, isLoading } = useShops();

  if (isLoading) {
    return <div className="text-slate-400">Cargando tiendas...</div>;
  }

  return (
    <div className="flex items-center gap-3">
      <Store className="w-5 h-5 text-slate-400" />
      <select
        value={selectedShopId}
        onChange={(e) => onSelect(e.target.value)}
        className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-primary/50 [&>option]:bg-slate-800 [&>option]:text-white"
      >
        <option value="">Selecciona una tienda</option>
        {shops.map((shop) => (
          <option key={shop.slug} value={shop.slug}>
            {shop.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function OrdersPage() {
  const { user, isSuperAdmin } = useAuth();
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  if (!user) return <div className="p-8 text-center text-slate-400">Cargando sesión...</div>;

  // Super Admin needs to select a shop
  const shopId = isSuperAdmin ? selectedShopId : (user.shopId || "");

  // Show shop selector for Super Admin if no shop selected
  if (isSuperAdmin && !selectedShopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Centro de Pedidos</h1>
            <p className="text-slate-400">Como Super Admin, selecciona una tienda para ver sus pedidos</p>
          </div>
          <ShopSelector selectedShopId={selectedShopId} onSelect={setSelectedShopId} />
        </div>
      </div>
    );
  }

  // No shop available
  if (!shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay tienda asignada a tu cuenta</p>
        </div>
      </div>
    );
  }

  return (
    <SalesOrdersProvider shopId={shopId}>
      <div className="relative">
        {/* Shop selector for Super Admin at top */}
        {isSuperAdmin && (
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
            <ShopSelector selectedShopId={selectedShopId} onSelect={setSelectedShopId} />
          </div>
        )}
        <OrdersContent shopId={shopId} />
      </div>
    </SalesOrdersProvider>
  );
}

// Wrap with ShopsProvider for Super Admin shop selection
export default function OrdersPageWrapper() {
  return (
    <ShopsProvider>
      <OrdersPage />
    </ShopsProvider>
  );
}

"use client";

import { useState } from "react";
import { FileText, Send, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui";
import type { SalesOrder } from "@/components/shared/sales-orders-context";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";

interface DailyReportCardProps {
  shopName: string;
  orders: SalesOrder[];
  totalSales: number;
  totalOrders: number;
  topService: string | null;
  ownerPhone?: string;
}

export function DailyReportCard({
  shopName,
  orders,
  totalSales,
  totalOrders,
  topService,
  ownerPhone = "",
}: DailyReportCardProps) {
  const [isSent, setIsSent] = useState(false);

  // Format today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Build WhatsApp message
  const buildReportMessage = () => {
    let message = `📊 *Reporte ${shopName}* - ${formattedDate}\n\n`;
    message += `✅ Ventas: $${totalSales.toLocaleString()}\n`;
    message += `📅 Citas: ${totalOrders}\n`;

    if (topService) {
      message += `✨ Top: ${topService}\n`;
    }

    if (totalOrders > 0) {
      const avgTicket = Math.round(totalSales / totalOrders);
      message += `💰 Ticket Promedio: $${avgTicket.toLocaleString()}\n`;
    }

    message += `\n¡Buen trabajo! 🎉`;

    return message;
  };

  const handleSendReport = () => {
    const message = buildReportMessage();
    const cleanPhone = formatPhoneForWhatsApp(ownerPhone || "");

    // Open WhatsApp with the report message
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  const handleCopyReport = () => {
    const message = buildReportMessage();
    navigator.clipboard.writeText(message);
    setIsSent(true);
    setTimeout(() => setIsSent(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
          <FileText className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Cierre del Día</h3>
          <p className="text-sm text-slate-400">{formattedDate}</p>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 font-mono text-sm">
        <p className="text-gold mb-2">📊 Reporte {shopName}</p>
        <div className="space-y-1 text-slate-300">
          <p>✅ Ventas: <span className="text-white font-bold">${totalSales.toLocaleString()}</span></p>
          <p>📅 Citas: <span className="text-white font-bold">{totalOrders}</span></p>
          {topService && (
            <p>✨ Top: <span className="text-white">{topService}</span></p>
          )}
          {totalOrders > 0 && (
            <p>
              💰 Ticket Promedio:{" "}
              <span className="text-white">
                ${Math.round(totalSales / totalOrders).toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Today's Orders List */}
      {orders.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-3">Órdenes de hoy:</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">
                    {order.items.map((i) => i.productName).join(", ")}
                  </span>
                </div>
                <span className="text-sm font-medium text-gold">
                  ${order.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-6 mb-6">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No hay órdenes hoy</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSendReport}
          className="flex-1"
          disabled={isSent}
        >
          {isSent ? (
            <>
              <CheckCircle className="w-4 h-4" />
              ¡Enviado!
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Reporte
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleCopyReport}>
          Copiar
        </Button>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        El reporte se enviará por WhatsApp
      </p>
    </div>
  );
}

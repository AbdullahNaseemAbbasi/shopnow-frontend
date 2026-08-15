"use client";

import { Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_META } from "@/lib/orderStatus";
import type { Order } from "@/types";

interface Props {
  order: Order;
  mode?: "invoice" | "packing"; // packing slip hides prices/totals
}

// Print-isolation: on print, hide the whole app chrome (navbar/footer/admin sidebar) and show only
// the invoice block. Layout-independent, so it works from both the customer and admin routes.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-print, #invoice-print * { visibility: visible !important; }
  #invoice-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
  .no-print { display: none !important; }
  @page { margin: 14mm; }
}
`;

export default function Invoice({ order, mode = "invoice" }: Props) {
  const isPacking = mode === "packing";
  const meta = ORDER_STATUS_META[order.status];
  const date = new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" });

  const itemsSubtotal = order.items.reduce((sum, it) => sum + (it.subtotal ?? it.price * it.quantity), 0);
  const adjustment = order.totalAmount - itemsSubtotal; // shipping (+) or discount (−) not stored separately

  return (
    <div className="max-w-3xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <div id="invoice-print" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-gray-800">
        {/* header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-black">S</span>
              </div>
              <span className="text-2xl font-black text-gray-900">ShopNow</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Pakistan-based fashion &amp; clothing store<br />
              support@shopnow.pk
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-wide">
              {isPacking ? "Packing Slip" : "Invoice"}
            </h1>
            <p className="text-sm font-bold text-gray-700 mt-1">{order.orderNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">{date}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full border ${meta?.badge ?? ""}`}>
              {meta?.label ?? order.status}
            </span>
          </div>
        </div>

        {/* parties */}
        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Billed to</p>
            <p className="text-sm font-semibold text-gray-900">{order.customerName || "Customer"}</p>
            {order.customerEmail && <p className="text-xs text-gray-500">{order.customerEmail}</p>}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Ship to</p>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{order.shippingAddress}</p>
          </div>
        </div>

        {/* items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="py-2 font-bold">#</th>
              <th className="py-2 font-bold">Item</th>
              <th className="py-2 font-bold text-center">Qty</th>
              {!isPacking && <th className="py-2 font-bold text-right">Unit price</th>}
              {!isPacking && <th className="py-2 font-bold text-right">Amount</th>}
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2.5 text-gray-400">{i + 1}</td>
                <td className="py-2.5 font-medium text-gray-900">{it.productName}</td>
                <td className="py-2.5 text-center">{it.quantity}</td>
                {!isPacking && <td className="py-2.5 text-right text-gray-600">{formatPrice(it.price)}</td>}
                {!isPacking && <td className="py-2.5 text-right font-semibold text-gray-900">{formatPrice(it.subtotal ?? it.price * it.quantity)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* totals (invoice only) */}
        {!isPacking ? (
          <div className="flex justify-end pt-5">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({order.totalItems} item{order.totalItems === 1 ? "" : "s"})</span>
                <span>{formatPrice(itemsSubtotal)}</span>
              </div>
              {Math.abs(adjustment) >= 1 && (
                <div className="flex justify-between text-gray-500">
                  <span>{adjustment > 0 ? "Delivery / adjustment" : "Discount"}</span>
                  <span>{adjustment > 0 ? formatPrice(adjustment) : `− ${formatPrice(-adjustment)}`}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
                <span>Total payable</span>
                <span className="text-brand">{formatPrice(order.totalAmount)}</span>
              </div>
              <p className="text-xs text-gray-400 pt-1">Payment: {order.paymentStatus}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 pt-5">Total items: <span className="font-bold text-gray-900">{order.totalItems}</span></p>
        )}

        <div className="border-t border-gray-100 mt-8 pt-4 text-center">
          <p className="text-xs text-gray-400">
            {isPacking ? "Please verify the items above against the shipment." : "Thank you for shopping with ShopNow!"}
          </p>
        </div>
      </div>
    </div>
  );
}

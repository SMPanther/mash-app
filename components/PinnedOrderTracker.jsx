"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";
import { useActiveOrders } from "@/lib/useActiveOrders";
import { STATUS_LABELS } from "@/lib/orderStatus";
import OrderStatusStepper from "./OrderStatusStepper";

// Mounted once in the root layout (see app/layout.js) so it follows the
// customer around the whole site. Handles any number of simultaneously
// active orders: one order collapses to a single pill; two or more show
// a count badge, and expanding lists each one with its own status —
// clicking one order drills into its full stepper, with a way back to
// the list rather than only ever showing one at a time.
export default function PinnedOrderTracker() {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const orders = useActiveOrders(user?.id);
  const [expanded, setExpanded] = useState(false);
  const [openOrderId, setOpenOrderId] = useState(null);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/rider")) return null;
  if (pathname?.startsWith("/order/confirmation/")) return null;
  if (orders.length === 0) return null;

  const openOrder = orders.find((o) => o.id === openOrderId);

  return (
    <div className="fixed bottom-4 right-4 z-[1500] max-w-[calc(100vw-2rem)]">
      {expanded && (
        <div className="mb-2 bg-white border border-smoke/20 rounded-xl shadow-xl p-4 w-80 max-w-full">
          {openOrder ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setOpenOrderId(null)}
                  className="text-sm text-smoke"
                  data-cursor-hover
                  disabled={orders.length < 2}
                >
                  {orders.length > 1 ? "← All orders" : `Order #${openOrder.id.slice(0, 8)}`}
                </button>
                <button onClick={() => setExpanded(false)} className="text-smoke text-sm" data-cursor-hover>
                  ✕
                </button>
              </div>
              <OrderStatusStepper status={openOrder.status} />
              <a
                href={`/order/confirmation/${openOrder.id}`}
                className="text-xs text-chili mt-4 inline-block"
                data-cursor-hover
              >
                View full details →
              </a>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-char">{orders.length} active orders</span>
                <button onClick={() => setExpanded(false)} className="text-smoke text-sm" data-cursor-hover>
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setOpenOrderId(o.id)}
                    data-cursor-hover
                    className="w-full flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-paper text-left"
                  >
                    <span className="text-char">#{o.id.slice(0, 8)}</span>
                    <span className="text-smoke text-xs">{STATUS_LABELS[o.status]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        data-cursor-hover
        className="flex items-center gap-2 bg-ink text-paper rounded-full pl-2 pr-4 py-2 shadow-lg relative"
      >
        <span className="w-8 h-8 rounded-full bg-chili flex items-center justify-center text-sm">📦</span>
        <span className="text-sm font-medium">
          {orders.length === 1 ? STATUS_LABELS[orders[0].status] : `${orders.length} orders active`}
        </span>
        {orders.length > 1 && (
          <span className="absolute -top-1.5 -right-1.5 bg-chili text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {orders.length}
          </span>
        )}
      </button>
    </div>
  );
}

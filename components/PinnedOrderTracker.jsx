"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/lib/useAuthUser";
import { useActiveOrder } from "@/lib/useActiveOrder";
import { STATUS_LABELS } from "@/lib/orderStatus";
import OrderStatusStepper from "./OrderStatusStepper";

// Mounted once in the root layout (see app/layout.js) so it follows the
// customer around the whole site — this is the "pin it down so I can
// check on it while I keep browsing" feature. Click to expand into the
// full status stepper right where you are, no navigation required;
// click again (or the link inside) to go to the full confirmation page.
export default function PinnedOrderTracker() {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const order = useActiveOrder(user?.id);
  const [expanded, setExpanded] = useState(false);

  // Don't show inside admin/rider sections, or on the confirmation page
  // itself (that page already shows the same info front and center).
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/rider")) return null;
  if (pathname?.startsWith("/order/confirmation/")) return null;
  if (!order) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[1500] max-w-[calc(100vw-2rem)]">
      {expanded && (
        <div className="mb-2 bg-white border border-smoke/20 rounded-xl shadow-xl p-4 w-80 max-w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-char">Order #{order.id.slice(0, 8)}</span>
            <button onClick={() => setExpanded(false)} className="text-smoke text-sm" data-cursor-hover>
              ✕
            </button>
          </div>
          <OrderStatusStepper status={order.status} />
          <a
            href={`/order/confirmation/${order.id}`}
            className="text-xs text-chili mt-4 inline-block"
            data-cursor-hover
          >
            View full details →
          </a>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        data-cursor-hover
        className="flex items-center gap-2 bg-ink text-paper rounded-full pl-2 pr-4 py-2 shadow-lg"
      >
        <span className="w-8 h-8 rounded-full bg-chili flex items-center justify-center text-sm">📦</span>
        <span className="text-sm font-medium">{STATUS_LABELS[order.status] || order.status}</span>
      </button>
    </div>
  );
}

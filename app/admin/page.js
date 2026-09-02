"use client";

import { useEffect, useMemo, useState } from "react";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { createClient } from "@/lib/supabaseClient";
import { isActive } from "@/lib/orderStatus";
import OrderCard from "@/components/OrderCard";
import NotificationBell from "@/components/NotificationBell";

// This is the screen an admin lands on right after login (see
// app/login/page.js). New orders arrive here via realtime INSERT events —
// no polling, no refresh. See 03-order-system-spec.md §3.
//
// Riders are in-house staff (confirmed decision — see 03-order-system-spec.md
// §8), so admin picks a rider from a dropdown when moving an order to
// "out for delivery" rather than riders claiming orders themselves.
export default function AdminOrderBoard() {
  const orders = useRealtimeOrders({ role: "admin" });
  const [seenIds, setSeenIds] = useState(new Set());
  const [riders, setRiders] = useState([]);
  const [pendingRider, setPendingRider] = useState({}); // orderId -> riderId being selected

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "rider")
      .then(({ data }) => setRiders(data || []));
  }, []);

  const activeOrders = useMemo(() => orders.filter((o) => isActive(o.status)), [orders]);
  const unreadCount = useMemo(
    () => activeOrders.filter((o) => !seenIds.has(o.id)).length,
    [activeOrders, seenIds]
  );

  function markAllSeen() {
    setSeenIds(new Set(activeOrders.map((o) => o.id)));
  }

  async function setStatus(orderId, status, extra = {}) {
    const supabase = createClient();
    await supabase.from("orders").update({ status, ...extra }).eq("id", orderId);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-medium text-char">Live orders</h1>
        <NotificationBell unreadCount={unreadCount} onClick={markAllSeen} />
      </div>

      <div className="space-y-3">
        {activeOrders.length === 0 && (
          <div className="text-center py-16 border border-dashed border-smoke/25 rounded-xl">
            <p className="text-smoke">No active orders right now.</p>
          </div>
        )}
        {activeOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <>
                {order.status === "received" && (
                  <button
                    onClick={() => setStatus(order.id, "preparing")}
                    className="text-sm px-3 py-1.5 rounded-full bg-ember text-paper"
                  >
                    Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <div className="flex items-center gap-2">
                    <select
                      className="text-sm border border-smoke/30 rounded-full px-2 py-1.5 bg-white"
                      value={pendingRider[order.id] || ""}
                      onChange={(e) =>
                        setPendingRider((p) => ({ ...p, [order.id]: e.target.value }))
                      }
                    >
                      <option value="" disabled>
                        Assign rider…
                      </option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.id.slice(0, 6)}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!pendingRider[order.id]}
                      onClick={() =>
                        setStatus(order.id, "out_for_delivery", { rider_id: pendingRider[order.id] })
                      }
                      className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper disabled:opacity-40"
                    >
                      Send out
                    </button>
                  </div>
                )}
                <a
                  href={`/admin/orders/${order.id}`}
                  className="text-sm px-3 py-1.5 rounded-full border border-smoke/30 text-char"
                >
                  Details
                </a>
              </>
            }
          />
        ))}
      </div>
    </div>
  );
}

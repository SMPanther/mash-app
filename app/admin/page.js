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
  const [errors, setErrors] = useState({}); // orderId -> error message
  const [busy, setBusy] = useState({}); // orderId -> bool, while an update is in flight

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "rider")
      .eq("is_available", true)
      .then(({ data, error }) => {
        if (error) console.error("Failed to load riders:", error.message);
        setRiders(data || []);
      });
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
    setErrors((e) => ({ ...e, [orderId]: "" }));
    setBusy((b) => ({ ...b, [orderId]: true }));
    const supabase = createClient();
    const { error } = await supabase.from("orders").update({ status, ...extra }).eq("id", orderId);
    setBusy((b) => ({ ...b, [orderId]: false }));
    if (error) {
      // This used to fail completely silently — the button would just
      // appear to do nothing, with no way to tell whether it was blocked
      // by a permissions issue, a network problem, or something else.
      setErrors((e) => ({ ...e, [orderId]: error.message }));
      console.error("Failed to update order status:", error);
    }
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
          <div key={order.id}>
            <OrderCard
              order={order}
              actions={
                <>
                  {order.status === "received" && (
                    <button
                      onClick={() => setStatus(order.id, "preparing")}
                      disabled={busy[order.id]}
                      className="text-sm px-3 py-1.5 rounded-full bg-ember text-paper disabled:opacity-50"
                    >
                      {busy[order.id] ? "…" : "Preparing"}
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
                          {riders.length === 0 ? "No riders available" : "Assign rider…"}
                        </option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name || r.id.slice(0, 6)}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!pendingRider[order.id] || busy[order.id]}
                        onClick={() =>
                          setStatus(order.id, "out_for_delivery", { rider_id: pendingRider[order.id] })
                        }
                        className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper disabled:opacity-40"
                      >
                        {busy[order.id] ? "…" : "Send out"}
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
            {order.status === "preparing" && riders.length === 0 && (
              <p className="text-xs text-smoke mt-1 ml-1">
                No riders currently marked available — either none exist yet (create one via Supabase
                Auth, then set its role to 'rider'), or they've all toggled themselves off shift.
              </p>
            )}
            {errors[order.id] && <p className="text-xs text-chili mt-1 ml-1">{errors[order.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

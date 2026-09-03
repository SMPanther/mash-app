"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";
import { isActive } from "./orderStatus";

// Powers the pinned order tracker. Returns EVERY currently-active order
// for this customer, not just the newest — a customer can genuinely have
// two orders in flight at once (one for lunch, one they just added for
// later), and collapsing that down to a single tracked order would just
// hide the other one's progress from them.
//
// Scoped to role === 'customer' only — checked before the realtime
// subscription is even set up, so an admin/rider account that placed a
// test order never subscribes to this at all.
export function useActiveOrders(userId) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    let channel = null;

    async function init() {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (cancelled) return;
      if (profile?.role !== "customer") {
        setOrders([]);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      setOrders((data || []).filter((o) => isActive(o.status)));

      channel = supabase
        .channel(`active-orders-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${userId}` },
          (payload) => {
            setOrders((current) => {
              if (payload.eventType === "INSERT") {
                if (!isActive(payload.new.status)) return current;
                if (current.some((o) => o.id === payload.new.id)) return current;
                return [payload.new, ...current];
              }
              if (payload.eventType === "UPDATE") {
                if (isActive(payload.new.status)) {
                  return current.map((o) => (o.id === payload.new.id ? payload.new : o));
                }
                // just became delivered/cancelled — drops off the pinned list
                return current.filter((o) => o.id !== payload.new.id);
              }
              return current;
            });
          }
        )
        .subscribe();
    }
    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return orders;
}

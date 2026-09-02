"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";
import { isActive } from "./orderStatus";

// Powers the pinned order tracker (components/PinnedOrderTracker.jsx) —
// so a customer who places an order and then keeps browsing the site can
// still see it's moving, without having to go back to the confirmation
// page. Only ever tracks the single most recent active order; if someone
// somehow has two active orders at once, only the newest shows here.
//
// Deliberately scoped to role === 'customer' only — an admin or rider
// account that was also used to place a test order shouldn't have the
// tracker follow them around their own admin/rider work. The role check
// happens before the realtime subscription is even set up, not just on
// the initial fetch, so an admin account never subscribes at all.
export function useActiveOrder(userId) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!userId) {
      setOrder(null);
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    let channel = null;

    async function init() {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
      if (cancelled) return;
      if (profile?.role !== "customer") {
        setOrder(null);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(5); // a handful, then filter client-side for the active one
      if (cancelled) return;
      setOrder((data || []).find((o) => isActive(o.status)) || null);

      channel = supabase
        .channel(`active-order-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === "INSERT" && isActive(payload.new.status)) {
              setOrder(payload.new);
            } else if (payload.eventType === "UPDATE") {
              setOrder((current) => {
                if (current && current.id === payload.new.id) {
                  return isActive(payload.new.status) ? payload.new : null;
                }
                return current || (isActive(payload.new.status) ? payload.new : current);
              });
            }
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

  return order;
}

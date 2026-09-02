"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";
import { isActive } from "./orderStatus";

// Powers the pinned order tracker (components/PinnedOrderTracker.jsx) —
// so a customer who places an order and then keeps browsing the site can
// still see it's moving, without having to go back to the confirmation
// page. Only ever tracks the single most recent active order; if someone
// somehow has two active orders at once, only the newest shows here.
export function useActiveOrder(userId) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!userId) {
      setOrder(null);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    async function fetchActive() {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(5); // a handful, then filter client-side for the active one
      if (cancelled) return;
      const activeOne = (data || []).find((o) => isActive(o.status));
      setOrder(activeOne || null);
    }
    fetchActive();

    const channel = supabase
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
              // a different order just became active (e.g. this is a
              // second order and it's newer) — only take over if we
              // don't already have one pinned
              return current ? current : isActive(payload.new.status) ? payload.new : current;
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return order;
}

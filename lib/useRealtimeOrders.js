"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";

// One realtime implementation, three call sites (admin board, rider list,
// customer live view) — see 05-frontend-architecture.md "Key architectural
// decisions". Pass exactly one of { role: 'admin' } | { riderId } | { orderId }.
export function useRealtimeOrders({ role, riderId, orderId, initialOrders = [] }) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const supabase = createClient();
    let filter = "";
    if (orderId) filter = `id=eq.${orderId}`;
    else if (riderId) filter = `rider_id=eq.${riderId}`;
    // role === 'admin' gets no filter — admin sees every order

    const channel = supabase
      .channel(`orders-changes-${orderId || riderId || role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: filter || undefined },
        (payload) => {
          setOrders((current) => {
            if (payload.eventType === "INSERT") {
              return [payload.new, ...current];
            }
            if (payload.eventType === "UPDATE") {
              return current.map((o) => (o.id === payload.new.id ? payload.new : o));
            }
            if (payload.eventType === "DELETE") {
              return current.filter((o) => o.id !== payload.old.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, riderId, orderId]);

  return orders;
}

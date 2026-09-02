"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";

// One realtime implementation, three call sites (admin board, rider list,
// customer live view) — see 05-frontend-architecture.md "Key architectural
// decisions". Pass exactly one of { role: 'admin' } | { riderId } | { orderId }.
//
// This used to ONLY subscribe to future changes with no initial fetch —
// meaning any order that already existed before this hook mounted (which
// is every order, on every page load) was invisible until something
// changed it again. That's why the admin board looked empty even with
// real orders sitting in the database, and why the customer's own
// confirmation page could miss its own just-placed order if the INSERT
// event fired before the subscription finished connecting. Fixed by
// actually querying for existing rows first, then layering realtime
// updates on top of that.
export function useRealtimeOrders({ role, riderId, orderId }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    let filter = "";
    if (orderId) filter = `id=eq.${orderId}`;
    else if (riderId) filter = `rider_id=eq.${riderId}`;
    // role === 'admin' gets no filter — admin sees every order

    let cancelled = false;

    async function fetchInitial() {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (orderId) query = query.eq("id", orderId);
      else if (riderId) query = query.eq("rider_id", riderId);
      else query = query.limit(200); // admin board — bounded, not literally every order ever

      const { data, error } = await query;
      if (!cancelled && !error) setOrders(data || []);
    }
    fetchInitial();

    const channel = supabase
      .channel(`orders-changes-${orderId || riderId || role}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: filter || undefined },
        (payload) => {
          setOrders((current) => {
            if (payload.eventType === "INSERT") {
              // guard against double-adding if the initial fetch and the
              // INSERT event both deliver the same row in a race
              if (current.some((o) => o.id === payload.new.id)) return current;
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
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, riderId, orderId]);

  return orders;
}

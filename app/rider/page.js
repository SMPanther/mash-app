"use client";

import { useEffect, useState } from "react";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import { createClient } from "@/lib/supabaseClient";
import OrderCard from "@/components/OrderCard";

// Only ever offers the "delivered" transition — riders can't set any
// other status, both here and enforced by the RLS policy in
// 04-database-schema.md. Once an order flips to delivered, the realtime
// UPDATE removes it from this list automatically (it's no longer
// out_for_delivery).
export default function RiderDashboard() {
  const [riderId, setRiderId] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setRiderId(data.user?.id));
  }, []);

  const orders = useRealtimeOrders({ riderId });
  const assigned = orders.filter((o) => o.status === "out_for_delivery");

  // Location tracking only runs while there's an active delivery — starts
  // when one appears, stops when there are none, not continuously in the
  // background. See 07-phase2-features.md §4.
  useEffect(() => {
    if (!riderId || assigned.length === 0) return;
    if (!("geolocation" in navigator)) return;

    const supabase = createClient();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        supabase
          .from("rider_locations")
          .upsert({
            rider_id: riderId,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            updated_at: new Date().toISOString(),
          })
          .then(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [riderId, assigned.length]);

  async function markDelivered(orderId) {
    const supabase = createClient();
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
  }

  return (
    <div>
      <h1 className="text-2xl font-medium text-char mb-4">Your deliveries</h1>
      {assigned.length > 0 && (
        <p className="text-xs text-smoke mb-4">📍 Sharing your location while you have an active delivery.</p>
      )}
      <div className="space-y-3">
        {assigned.length === 0 && <p className="text-smoke">Nothing assigned right now.</p>}
        {assigned.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <button
                onClick={() => markDelivered(order.id)}
                className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper"
              >
                Mark delivered
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

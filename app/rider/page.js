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
  const [isAvailable, setIsAvailable] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setRiderId(data.user?.id);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_available")
          .eq("id", data.user.id)
          .single();
        setIsAvailable(profile?.is_available ?? true);
      }
    });
  }, []);

  async function toggleAvailability() {
    setToggling(true);
    const next = !isAvailable;
    const res = await fetch("/api/update-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: next }),
    });
    if (res.ok) setIsAvailable(next);
    setToggling(false);
  }

  const orders = useRealtimeOrders({ riderId });
  const assigned = orders.filter((o) => o.status === "out_for_delivery");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      console.error("Failed to mark delivered:", updateError);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium text-char">Your deliveries</h1>
        <div className="flex items-center gap-3">
          {assigned.length > 0 && (
            <span className="text-xs bg-chili/10 text-chili px-2.5 py-1 rounded-full font-medium">
              {assigned.length} active
            </span>
          )}
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            data-cursor-hover
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isAvailable ? "bg-lime/20 text-char" : "bg-smoke/15 text-smoke"
            }`}
          >
            {isAvailable ? "🟢 Available" : "⚪ Off shift"}
          </button>
        </div>
      </div>
      {assigned.length > 0 && (
        <p className="text-xs text-smoke mb-4">📍 Sharing your location while you have an active delivery.</p>
      )}
      {error && <p className="text-sm text-chili mb-4">{error}</p>}
      <div className="space-y-3">
        {assigned.length === 0 && (
          <div className="text-center py-16 border border-dashed border-smoke/25 rounded-xl">
            <p className="text-smoke">Nothing assigned right now — check back shortly.</p>
          </div>
        )}
        {assigned.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <button
                onClick={() => markDelivered(order.id)}
                disabled={busy}
                className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper disabled:opacity-50"
              >
                {busy ? "…" : "Mark delivered"}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

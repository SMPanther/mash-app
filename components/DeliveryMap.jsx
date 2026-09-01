"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabaseClient";

// Free approach: OpenStreetMap tiles (no API key, no per-load billing —
// unlike Google Maps) + the rider's position from the rider_locations
// table, kept live via Supabase Realtime. See 07-phase2-features.md §4.
//
// This is a single pin, not turn-by-turn routing or ETA — that would need
// a routing service, which isn't free at volume. Ship this first, add
// routing only if it turns out to actually be needed.
export default function DeliveryMap({ riderId }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!riderId) return;
    const supabase = createClient();

    supabase
      .from("rider_locations")
      .select("lat, lng")
      .eq("rider_id", riderId)
      .single()
      .then(({ data }) => {
        if (data) setPosition([data.lat, data.lng]);
      });

    const channel = supabase
      .channel(`rider-location-${riderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_locations", filter: `rider_id=eq.${riderId}` },
        (payload) => {
          if (payload.new) setPosition([payload.new.lat, payload.new.lng]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [riderId]);

  if (!position) {
    return <div className="text-sm text-smoke py-4">Waiting for your rider's location…</div>;
  }

  return (
    <div className="rounded-lg overflow-hidden border border-smoke/20 h-64">
      <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}

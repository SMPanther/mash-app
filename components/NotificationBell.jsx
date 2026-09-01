"use client";

import { useState } from "react";

// Unread count is driven by the parent's realtime order list (new INSERTs
// since last viewed) — kept dumb/presentational here on purpose, so the
// realtime logic stays in useRealtimeOrders, not duplicated in the UI.
export default function NotificationBell({ unreadCount = 0, onClick }) {
  const [pulsed, setPulsed] = useState(false);

  return (
    <button
      onClick={() => {
        setPulsed(true);
        onClick?.();
      }}
      className="relative w-10 h-10 rounded-full border border-smoke/30 flex items-center justify-center"
      aria-label={`${unreadCount} new orders`}
    >
      <span className="text-lg">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-chili text-paper text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

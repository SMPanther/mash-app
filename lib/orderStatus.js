// Single source of truth for the order status machine.
// See 03-order-system-spec.md §2 for the reasoning behind each transition.

export const STATUSES = ["received", "preparing", "out_for_delivery", "delivered"];

export const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Who is allowed to move an order INTO each status.
// Enforced here for UI purposes, and mirrored by the RLS policies in
// 04-database-schema.md — this is not the real security boundary,
// just what keeps the UI from offering a button that would fail anyway.
export const ALLOWED_TRANSITIONS = {
  admin: ["preparing", "out_for_delivery", "cancelled"],
  rider: ["delivered"],
};

export function canTransition(role, nextStatus) {
  return (ALLOWED_TRANSITIONS[role] || []).includes(nextStatus);
}

export function statusIndex(status) {
  return STATUSES.indexOf(status);
}

export function isActive(status) {
  return status !== "delivered" && status !== "cancelled";
}

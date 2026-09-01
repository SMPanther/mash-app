import { STATUS_LABELS } from "@/lib/orderStatus";

// One card, three contexts — admin passes status-change buttons as
// `actions`, rider passes a single "Mark delivered" action, customer
// view renders it with no actions at all (read-only).
export default function OrderCard({ order, actions = null }) {
  return (
    <div className="border border-smoke/30 rounded-lg p-4 flex items-center justify-between gap-4 bg-paper">
      <div>
        <div className="font-medium text-char">#{order.id.slice(0, 8)}</div>
        <div className="text-sm text-smoke">{order.address}</div>
        <div className="text-sm text-smoke">
          Rs. {order.total} · {STATUS_LABELS[order.status] || order.status}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

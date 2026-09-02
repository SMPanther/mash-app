import { STATUS_LABELS } from "@/lib/orderStatus";

const STATUS_DOT = {
  received: "bg-smoke",
  preparing: "bg-ember",
  out_for_delivery: "bg-chili",
  delivered: "bg-lime",
  cancelled: "bg-smoke",
};

// One card, three contexts — admin passes status-change buttons as
// `actions`, rider passes a single "Mark delivered" action, customer
// view renders it with no actions at all (read-only).
export default function OrderCard({ order, actions = null }) {
  return (
    <div className="border border-smoke/20 rounded-xl p-4 flex items-center justify-between gap-4 bg-white shadow-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[order.status] || "bg-smoke"}`} />
          <span className="font-medium text-char">#{order.id.slice(0, 8)}</span>
        </div>
        <div className="text-sm text-smoke truncate max-w-[220px] sm:max-w-xs mt-0.5">{order.address}</div>
        <div className="text-sm text-char mt-0.5">
          Rs. {order.total} <span className="text-smoke">· {STATUS_LABELS[order.status] || order.status}</span>
        </div>
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

"use client";

import { STATUSES, STATUS_LABELS, statusIndex } from "@/lib/orderStatus";

const STATUS_STICKERS = {
  received: "/assets/status/received.png",
  preparing: "/assets/status/preparing.png",
  out_for_delivery: "/assets/status/out-for-delivery.png",
  delivered: "/assets/status/delivered.png",
};

// The one deliberate motion moment on the customer's live-order view —
// see 01-project-study.md's animation principle: answer a state change,
// don't animate ambiently. The current step's sticker pops in with a
// scale/fade; reached-but-past steps sit at full opacity, upcoming ones
// are dimmed — everything else is static, no ambient motion.
export default function OrderStatusStepper({ status }) {
  const currentIndex = statusIndex(status);

  if (status === "cancelled") {
    return <div className="text-chili font-medium">This order was cancelled.</div>;
  }

  return (
    <div className="flex items-center w-full">
      {STATUSES.map((s, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STATUS_STICKERS[s]}
                alt={STATUS_LABELS[s]}
                className={[
                  "w-10 h-10 sm:w-12 sm:h-12 object-contain transition-all duration-300",
                  reached ? "opacity-100" : "opacity-30 grayscale",
                  isCurrent ? "scale-110" : "scale-100",
                ].join(" ")}
              />
              <div className="mt-1 text-[11px] sm:text-xs text-smoke whitespace-nowrap">
                {STATUS_LABELS[s]}
              </div>
            </div>
            {i < STATUSES.length - 1 && (
              <div
                className={[
                  "h-[2px] flex-1 mx-1.5 sm:mx-2 transition-colors duration-300",
                  i < currentIndex ? "bg-chili" : "bg-smoke/30",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

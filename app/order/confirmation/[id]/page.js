"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useRealtimeOrders } from "@/lib/useRealtimeOrders";
import OrderStatusStepper from "@/components/OrderStatusStepper";
import SiteHeader from "@/components/SiteHeader";

// Leaflet touches `window` at module load time, which crashes during
// Next.js's server-side render pass (window doesn't exist there) even
// though this is a "use client" component — client components still get
// pre-rendered on the server for the initial HTML. `ssr: false` skips
// that pre-render for this component specifically, so it only ever
// mounts in the browser, after window genuinely exists.
const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => <div className="text-sm text-smoke py-4">Loading map…</div>,
});

// The live view a customer lands on right after checkout. Subscribed to
// just this one order — when the admin or rider changes its status, this
// updates with no refresh, and the stepper animates the new current step.
export default function OrderConfirmation() {
  const { id } = useParams();
  const orders = useRealtimeOrders({ orderId: id });
  const order = orders[0];

  return (
    <>
      <SiteHeader />
      {!order ? (
        <p className="text-smoke p-6">Loading your order…</p>
      ) : (
        <main className="max-w-lg mx-auto p-6 sm:p-8">
          <h1 className="font-display text-2xl text-char mb-2">Order placed!</h1>
          <p className="text-smoke mb-8">We'll keep this updated as it moves.</p>
          <OrderStatusStepper status={order.status} />

          {order.status === "out_for_delivery" && order.rider_id && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-char mb-2">Your rider is on the way</h2>
              <DeliveryMap riderId={order.rider_id} />
            </div>
          )}

          <a href="/account/orders" className="text-sm text-chili mt-8 inline-block">
            ← View all your orders
          </a>
        </main>
      )}
    </>
  );
}

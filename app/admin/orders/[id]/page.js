"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import OrderStatusStepper from "@/components/OrderStatusStepper";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponValue, setCouponValue] = useState("15");
  const [couponMin, setCouponMin] = useState("0");
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setOrder(data));
    supabase
      .from("order_items")
      .select("*, menu_items(name)")
      .eq("order_id", id)
      .then(({ data }) => setItems(data || []));
  }, [id]);

  // Issue a coupon to THIS order's customer while reviewing it — no need
  // to know their email or hunt for them elsewhere, since the customer
  // is already known from the order itself.
  async function issueCoupon() {
    setCouponMessage("");
    const supabase = createClient();
    const code = "MASH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: adminUser } = await supabase.auth.getUser();
    const { error } = await supabase.from("coupons").insert({
      code,
      customer_id: order.customer_id,
      discount_type: "percentage",
      discount_value: Number(couponValue),
      min_order_amount: Number(couponMin),
      created_by: adminUser.user?.id,
    });
    if (error) {
      setCouponMessage(error.message);
    } else {
      setCouponMessage(`Issued ${code} to this customer.`);
      setShowCouponForm(false);
    }
  }

  if (!order) return <p className="text-smoke">Loading order…</p>;

  return (
    <div className="max-w-xl">
      <a href="/admin" className="text-sm text-smoke mb-4 inline-block">
        ← Back to orders
      </a>
      <h1 className="text-xl font-medium text-char mb-1">Order #{order.id.slice(0, 8)}</h1>
      <p className="text-smoke mb-6">{order.address}</p>

      <OrderStatusStepper status={order.status} />

      <ul className="mt-8 divide-y divide-smoke/20 mb-6">
        {items.map((item) => (
          <li key={item.id} className="py-2 flex justify-between text-sm">
            <span>
              {item.quantity}× {item.menu_items?.name}
            </span>
            <span>Rs. {item.price_at_order}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-smoke/20 pt-4">
        {showCouponForm ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-char">Issue a coupon to this customer</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                placeholder="% off"
                className="w-24 border border-smoke/30 rounded-md px-2 py-1.5 bg-white text-sm"
              />
              <input
                type="number"
                value={couponMin}
                onChange={(e) => setCouponMin(e.target.value)}
                placeholder="Min order (0 = none)"
                className="flex-1 border border-smoke/30 rounded-md px-2 py-1.5 bg-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={issueCoupon} className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper">
                Issue coupon
              </button>
              <button
                onClick={() => setShowCouponForm(false)}
                className="text-sm px-3 py-1.5 rounded-full border border-smoke/30 text-char"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCouponForm(true)}
            className="text-sm px-3 py-1.5 rounded-full bg-ember text-paper"
          >
            Give this customer a coupon
          </button>
        )}
        {couponMessage && <p className="text-sm text-smoke mt-2">{couponMessage}</p>}
      </div>
    </div>
  );
}

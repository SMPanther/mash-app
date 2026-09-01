"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { STATUS_LABELS } from "@/lib/orderStatus";

const CATEGORIES = [
  { value: "late_delivery", label: "It arrived late" },
  { value: "wrong_item", label: "Wrong item / address" },
  { value: "quality", label: "Quality issue" },
  { value: "other", label: "Something else" },
];

// Delivered orders land here — same `status = 'delivered'` filter used
// everywhere else, no separate "history" table. See
// 03-order-system-spec.md §2. Complaints are scoped to a specific order,
// not a floating contact form — see §6 there and §5 in
// 07-phase2-features.md for how admin resolves these.
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [category, setCategory] = useState("late_delivery");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: past } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", data.user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });
      setOrders(past || []);
    });
  }, []);

  async function submitComplaint(order) {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from("complaints").insert({
      order_id: order.id,
      customer_id: data.user.id,
      category,
      message,
    });
    if (!error) {
      setSubmitted((s) => ({ ...s, [order.id]: true }));
      setOpenId(null);
      setMessage("");
    }
  }

  return (
    <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-char">Order history</h1>
        <a href="/account/coupons" className="text-sm text-chili">
          My coupons
        </a>
      </div>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-smoke">No past orders yet.</p>}
        {orders.map((order) => (
          <div key={order.id} className="border border-smoke/20 rounded-lg p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-medium text-char">#{order.id.slice(0, 8)}</div>
                <div className="text-sm text-smoke">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm text-smoke self-center">{STATUS_LABELS[order.status]}</div>
            </div>

            {submitted[order.id] ? (
              <p className="text-sm text-smoke mt-3">Complaint submitted — we'll follow up.</p>
            ) : openId === order.id ? (
              <div className="mt-3 space-y-2 border-t border-smoke/20 pt-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened?"
                  className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitComplaint(order)}
                    className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setOpenId(null)}
                    className="text-sm px-3 py-1.5 rounded-full border border-smoke/30 text-char"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setOpenId(order.id)}
                className="text-sm text-chili mt-2"
              >
                Report a problem
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

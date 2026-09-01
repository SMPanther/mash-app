"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

// Every coupon here is tied to this one logged-in customer (RLS enforces
// that server-side too) — see 07-phase2-features.md §6.
export default function MyCoupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("coupons")
        .select("*")
        .eq("customer_id", data.user.id)
        .order("created_at", { ascending: false });
      setCoupons(rows || []);
    });
  }, []);

  function statusOf(c) {
    if (c.is_used) return "Used";
    if (c.expires_at && new Date(c.expires_at) < new Date()) return "Expired";
    return "Active";
  }

  return (
    <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh]">
      <h1 className="font-display text-3xl text-char mb-6">Your coupons</h1>
      <div className="space-y-3">
        {coupons.length === 0 && <p className="text-smoke">No coupons yet.</p>}
        {coupons.map((c) => {
          const status = statusOf(c);
          return (
            <div
              key={c.id}
              className={[
                "border rounded-lg p-4 flex items-center justify-between",
                status === "Active" ? "border-chili/40 bg-paper" : "border-smoke/20 bg-paper opacity-60",
              ].join(" ")}
            >
              <div>
                <div className="font-medium text-char tracking-wide">{c.code}</div>
                <div className="text-sm text-smoke">
                  {c.discount_type === "percentage" ? `${c.discount_value}% off` : `Rs. ${c.discount_value} off`}
                  {c.min_order_amount > 0 && ` · orders over Rs. ${c.min_order_amount}`}
                </div>
              </div>
              <span
                className={[
                  "text-xs px-2.5 py-1 rounded-full",
                  status === "Active" ? "bg-chili text-paper" : "bg-smoke/20 text-smoke",
                ].join(" ")}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}

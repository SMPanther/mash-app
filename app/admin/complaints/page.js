"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const RESOLUTION_OPTIONS = [
  { value: "contacted_rider", label: "Contacted rider — confirmed delivery" },
  { value: "redelivered_free", label: "Redelivered for free (wrong address/item)" },
  { value: "discount_issued", label: "Issued discount/coupon" },
  { value: "apology_only", label: "Apology only" },
  { value: "other", label: "Other" },
];

// Deliberately not automated — every complaint is judged case-by-case
// (contact the rider first, figure out what actually happened, then
// respond). This just gives admin one consistent place to record the
// outcome and optionally issue compensation in the same action. See
// 07-phase2-features.md §5.
export default function ComplaintsQueue() {
  const [complaints, setComplaints] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [resolutionAction, setResolutionAction] = useState("contacted_rider");
  const [issueCoupon, setIssueCoupon] = useState(false);
  const [couponValue, setCouponValue] = useState("15");
  const [couponMin, setCouponMin] = useState("0");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("complaints")
      .select("*, orders(id, customer_id)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setComplaints(data || []));

    const channel = supabase
      .channel("complaints-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, (payload) => {
        setComplaints((c) => [payload.new, ...c]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function resolve(complaint) {
    const supabase = createClient();
    let issuedCouponId = null;

    if (issueCoupon) {
      const code = "MASH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: coupon, error } = await supabase
        .from("coupons")
        .insert({
          code,
          customer_id: complaint.orders.customer_id,
          discount_type: "percentage",
          discount_value: Number(couponValue),
          min_order_amount: Number(couponMin),
          related_complaint_id: complaint.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      if (!error) issuedCouponId = coupon.id;
    }

    await supabase
      .from("complaints")
      .update({
        status: "resolved",
        resolution_action: resolutionAction,
        issued_coupon_id: issuedCouponId,
      })
      .eq("id", complaint.id);

    setComplaints((c) =>
      c.map((x) =>
        x.id === complaint.id ? { ...x, status: "resolved", resolution_action: resolutionAction } : x
      )
    );
    setOpenId(null);
  }

  return (
    <div className="max-w-2xl space-y-3">
      <h1 className="text-2xl font-medium text-char mb-4">Complaints</h1>
      {complaints.length === 0 && <p className="text-smoke">No complaints on file.</p>}
      {complaints.map((c) => (
        <div key={c.id} className="border border-smoke/30 rounded-lg p-4 bg-paper">
          <div className="flex justify-between text-sm text-smoke mb-1">
            <span>Order #{c.orders?.id?.slice(0, 8)}</span>
            <span>{c.category}</span>
          </div>
          <p className="text-char mb-3">{c.message}</p>

          {c.status === "resolved" ? (
            <span className="text-sm text-smoke">
              Resolved — {RESOLUTION_OPTIONS.find((o) => o.value === c.resolution_action)?.label || "done"}
            </span>
          ) : openId === c.id ? (
            <div className="space-y-3 border-t border-smoke/20 pt-3">
              <select
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
              >
                {RESOLUTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm text-char">
                <input type="checkbox" checked={issueCoupon} onChange={(e) => setIssueCoupon(e.target.checked)} />
                Also issue a coupon to this customer
              </label>

              {issueCoupon && (
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
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => resolve(c)}
                  className="text-sm px-3 py-1.5 rounded-full bg-chili text-paper"
                >
                  Confirm resolution
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
              onClick={() => setOpenId(c.id)}
              className="text-sm px-3 py-1.5 rounded-full bg-ember text-paper"
            >
              Resolve
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

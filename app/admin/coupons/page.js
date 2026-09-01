"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

// Standalone issuance (a "just because" reward) — issuing FROM a complaint
// resolution is handled in app/admin/complaints/page.js, which links the
// coupon back to the complaint via issued_coupon_id.
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    customerEmail: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "0",
  });
  const [message, setMessage] = useState("");

  async function loadCoupons() {
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });
    setCoupons(data || []);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function issueCoupon(e) {
    e.preventDefault();
    setMessage("");
    const supabase = createClient();

    // Look up the customer by email — admin thinks in terms of who the
    // customer is, not their uuid.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", form.customerEmail) // requires `email` synced onto profiles, or join auth.users server-side
      .single();

    if (!profile) {
      setMessage("Couldn't find a customer with that email.");
      return;
    }

    const code = "MASH-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const { error } = await supabase.from("coupons").insert({
      code,
      customer_id: profile.id,
      discount_type: form.discountType,
      discount_value: Number(form.discountValue),
      min_order_amount: Number(form.minOrderAmount),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Issued ${code}.`);
      setForm({ customerEmail: "", discountType: "percentage", discountValue: "", minOrderAmount: "0" });
      loadCoupons();
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-medium text-char mb-6">Coupons</h1>

      <form onSubmit={issueCoupon} className="border border-smoke/30 rounded-lg p-4 mb-8 space-y-3">
        <h2 className="font-medium text-char">Issue a coupon</h2>
        <input
          type="email"
          placeholder="Customer email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
          required
        />
        <div className="flex gap-3">
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            className="border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
          >
            <option value="percentage">% off</option>
            <option value="fixed">Rs. off</option>
          </select>
          <input
            type="number"
            placeholder="Value"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="flex-1 border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
            required
          />
        </div>
        <input
          type="number"
          placeholder="Minimum order amount (0 for none)"
          value={form.minOrderAmount}
          onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
        />
        {message && <p className="text-sm text-chili">{message}</p>}
        <button type="submit" className="bg-chili text-paper rounded-full px-4 py-2 text-sm font-medium">
          Issue coupon
        </button>
      </form>

      <h2 className="font-medium text-char mb-3">Issued coupons</h2>
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex justify-between text-sm border-b border-smoke/20 pb-2">
            <span>
              {c.code} — {c.profiles?.name || "customer"}
            </span>
            <span className="text-smoke">{c.is_used ? "Used" : "Active"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

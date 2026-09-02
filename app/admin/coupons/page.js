"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

// Standalone issuance (a "just because" reward). Issuing FROM a specific
// order is handled on that order's own detail page (no customer lookup
// needed there — the order already tells you who they are); issuing FROM
// a complaint resolution is handled in app/admin/complaints/page.js.
// This page is for the remaining case: "I want to reward someone but I'm
// not looking at one of their orders" — so it needs a way to actually
// browse customers rather than requiring you to already know their email.
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  async function loadCoupons() {
    const { data } = await supabase
      .from("coupons")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });
    setCoupons(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .limit(50);
    setCustomers(data || []);
  }

  useEffect(() => {
    loadCoupons();
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  async function issueCoupon(e) {
    e.preventDefault();
    setMessage("");
    if (!selectedCustomer) {
      setMessage("Pick a customer first.");
      return;
    }

    const code = "MASH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("coupons").insert({
      code,
      customer_id: selectedCustomer.id,
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrderAmount),
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Issued ${code} to ${selectedCustomer.name || selectedCustomer.email}.`);
      setSelectedCustomer(null);
      setDiscountValue("");
      setMinOrderAmount("0");
      loadCoupons();
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-medium text-char mb-6">Coupons</h1>

      <div className="border border-smoke/30 rounded-lg p-4 mb-8">
        <h2 className="font-medium text-char mb-3">Issue a coupon</h2>

        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-lime/10 rounded-md px-3 py-2 mb-3 text-sm">
            <span>
              {selectedCustomer.name || "Unnamed"} — {selectedCustomer.email}
            </span>
            <button onClick={() => setSelectedCustomer(null)} className="text-smoke text-xs">
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              placeholder="Search customers by name or email…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm mb-2"
            />
            <div className="max-h-40 overflow-y-auto border border-smoke/20 rounded-md mb-3">
              {filteredCustomers.length === 0 && (
                <p className="text-xs text-smoke p-3">No customers match — they may not have signed up yet.</p>
              )}
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-paper border-b border-smoke/10 last:border-0"
                >
                  {c.name || "Unnamed"} — <span className="text-smoke">{c.email}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <form onSubmit={issueCoupon} className="space-y-3">
          <div className="flex gap-3">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
            >
              <option value="percentage">% off</option>
              <option value="fixed">Rs. off</option>
            </select>
            <input
              type="number"
              placeholder="Value"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1 border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
              required
            />
          </div>
          <input
            type="number"
            placeholder="Minimum order amount (0 for none)"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
          />
          {message && <p className="text-sm text-chili">{message}</p>}
          <button type="submit" className="bg-chili text-paper rounded-full px-4 py-2 text-sm font-medium">
            Issue coupon
          </button>
        </form>
      </div>

      <h2 className="font-medium text-char mb-3">Issued coupons</h2>
      <div className="space-y-2">
        {coupons.length === 0 && <p className="text-sm text-smoke">None issued yet.</p>}
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

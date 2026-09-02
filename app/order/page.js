"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { createClient } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

export default function CheckoutPage() {
  const { items, updateQuantity, subtotal, clearCart, loaded } = useCart();
  const router = useRouter();

  const [savedAddress, setSavedAddress] = useState(null);
  const [addressChoice, setAddressChoice] = useState("saved"); // 'saved' | 'different'
  const [customAddress, setCustomAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_address")
        .eq("id", data.user.id)
        .single();
      if (profile?.default_address) {
        setSavedAddress(profile.default_address);
      } else {
        setAddressChoice("different");
      }
    });
  }, []);

  const address = addressChoice === "saved" ? savedAddress : customAddress;

  async function placeOrder() {
    setError("");
    if (!address || !address.trim()) {
      setError("Add a delivery address.");
      return;
    }
    setPlacing(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          variationId: i.variationId,
          quantity: i.quantity,
        })),
        address,
        couponCode: couponCode.trim() || null,
      }),
    });

    const data = await res.json();
    setPlacing(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong placing your order.");
      return;
    }

    clearCart();
    router.push(`/order/confirmation/${data.orderId}`);
  }

  if (loaded && items.length === 0) {
    return (
      <>
        <SiteHeader />
        <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh] text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mascot/empty-cart.png"
            alt=""
            className="w-48 sm:w-64 mx-auto mb-2"
            style={{ animation: "float 5s ease-in-out infinite" }}
          />
          <h1 className="font-display text-3xl text-char mb-4">Your cart is empty</h1>
          <a href="/menu" className="text-chili">
            Browse the menu →
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh] max-w-xl mx-auto">
        <h1 className="font-display text-3xl text-char mb-6">Your order</h1>

        <div className="space-y-3 mb-8">
          {items.map((item) => (
            <div key={`${item.menuItemId}-${item.variationId}`} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-char text-sm">{item.name}</div>
                <div className="text-xs text-smoke">Rs. {item.price} each</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.variationId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-smoke/30 text-sm"
                  data-cursor-hover
                >
                  −
                </button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, item.variationId, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-smoke/30 text-sm"
                  data-cursor-hover
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm text-smoke mb-6 pt-3 border-t border-smoke/20">
          <span>Subtotal</span>
          <span>Rs. {subtotal}</span>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-char mb-2">Delivery address</div>

          {savedAddress && (
            <label className="flex items-start gap-2 mb-2 text-sm">
              <input
                type="radio"
                checked={addressChoice === "saved"}
                onChange={() => setAddressChoice("saved")}
                className="mt-1"
              />
              <span>
                Use my saved address
                <div className="text-smoke text-xs">{savedAddress}</div>
              </span>
            </label>
          )}

          <label className="flex items-center gap-2 mb-2 text-sm">
            <input
              type="radio"
              checked={addressChoice === "different"}
              onChange={() => setAddressChoice("different")}
            />
            <span>{savedAddress ? "Deliver somewhere else this time" : "Delivery address"}</span>
          </label>

          {addressChoice === "different" && (
            <textarea
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Enter delivery address"
              rows={2}
              className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
            />
          )}
        </div>

        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Coupon code (optional)"
          className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm mb-1"
        />
        <a href="/account/coupons" className="text-xs text-chili">
          View your coupons
        </a>

        {error && <p className="text-sm text-chili mt-3">{error}</p>}

        <button
          onClick={placeOrder}
          disabled={placing}
          data-cursor-hover
          className="w-full bg-chili text-paper rounded-full py-3 font-medium mt-6 disabled:opacity-50"
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </main>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";

export default function CheckoutPage() {
  const { items, updateQuantity, subtotal, clearCart, loaded } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  async function placeOrder() {
    setError("");
    if (!address.trim()) {
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
      <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh]">
        <h1 className="font-display text-3xl text-char mb-4">Your cart is empty</h1>
        <a href="/menu" className="text-chili">
          Browse the menu →
        </a>
      </main>
    );
  }

  return (
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
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.menuItemId, item.variationId, item.quantity + 1)}
                className="w-7 h-7 rounded-full border border-smoke/30 text-sm"
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

      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Delivery address"
        rows={2}
        className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm mb-3"
      />

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
        className="w-full bg-chili text-paper rounded-full py-3 font-medium mt-6 disabled:opacity-50"
      >
        {placing ? "Placing order…" : "Place order"}
      </button>
    </main>
  );
}

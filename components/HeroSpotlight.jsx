"use client";

import { useCart } from "@/lib/CartContext";

// The "OUR NEW MASH SPECIAL" feature slot — an admin-flagged dish
// (menu_items.featured) gets the big treatment. If nothing's flagged
// yet, this renders nothing rather than a fake placeholder ad.
export default function HeroSpotlight({ item }) {
  const { addItem } = useCart();
  if (!item) return null;

  return (
    <div className="relative bg-paper border border-smoke/15 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden flex flex-col sm:flex-row items-center gap-6">
      {/* soft accent blobs, our own palette — not a copy of any reference site's art */}
      <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-lime/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-chili/10 blur-2xl pointer-events-none" />

      <div className="relative flex-1 text-center sm:text-left">
        <div className="text-xs sm:text-sm tracking-wide text-smoke mb-1">OUR NEW</div>
        <h2 className="font-display text-3xl sm:text-4xl text-char leading-none mb-3">
          MASH <span className="text-chili">SPECIAL</span>
        </h2>
        {item.description && <p className="text-smoke text-sm max-w-sm mb-4">{item.description}</p>}
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-medium text-char text-lg">Rs. {item.price}</span>
          <button
            onClick={() => addItem({ menuItemId: item.id, variationId: null, name: item.name, price: item.price })}
            data-cursor-hover
            className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Order now
          </button>
        </div>
      </div>

      <div
        className="relative w-40 h-40 sm:w-56 sm:h-56 shrink-0"
        style={{ animation: "float 5s ease-in-out infinite" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url || item.menu_categories?.icon}
          alt={item.name}
          className="w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.18))" }}
        />
      </div>
    </div>
  );
}

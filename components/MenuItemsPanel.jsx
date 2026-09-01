"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useCart } from "@/lib/CartContext";

function ItemCard({ item, index }) {
  const { addItem } = useCart();
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("menu_item_variations")
      .select("*")
      .eq("menu_item_id", item.id)
      .order("sort_order")
      .then(({ data }) => {
        setVariations(data || []);
        setSelectedVariation((data || []).find((v) => v.is_default) || (data || [])[0] || null);
      });
  }, [item.id]);

  function handleAdd() {
    const price = selectedVariation ? selectedVariation.price : item.price;
    const name = selectedVariation ? `${item.name} (${selectedVariation.name})` : item.name;
    addItem({
      menuItemId: item.id,
      variationId: selectedVariation ? selectedVariation.id : null,
      name,
      price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const displayPrice = selectedVariation ? selectedVariation.price : item.price;
  const image = item.image_url || item.menu_categories?.icon;

  return (
    <div className="bg-paper border border-smoke/15 rounded-2xl p-4 flex flex-col items-center text-center">
      <div
        className="w-28 h-28 sm:w-36 sm:h-36 mb-3"
        style={{ animation: `float 4s ease-in-out ${(index % 4) * 0.3}s infinite` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={item.name}
          className="w-full h-full object-contain"
          style={{ filter: "drop-shadow(0 12px 16px rgba(0,0,0,0.15))" }}
        />
      </div>
      <div className="font-medium text-char">{item.name}</div>
      {item.description && (
        <div className="text-xs text-smoke mt-1 line-clamp-2">{item.description}</div>
      )}

      {variations.length > 0 && (
        <select
          value={selectedVariation?.id || ""}
          onChange={(e) => setSelectedVariation(variations.find((v) => v.id === e.target.value))}
          className="mt-2 text-xs border border-smoke/30 rounded-md px-2 py-1 bg-white"
        >
          {variations.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — Rs. {v.price}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-center justify-between w-full mt-3">
        <span className="font-medium text-char">Rs. {displayPrice}</span>
        <button
          onClick={handleAdd}
          data-cursor-hover
          className="text-xs px-3 py-1.5 rounded-full bg-chili text-paper"
        >
          {added ? "Added ✓" : "Add"}
        </button>
      </div>
    </div>
  );
}

// Cinematic (not display:none/block) transition between categories: the
// outgoing set fades/slides out, then the incoming set fades/slides in —
// see the brief's §8. ~350ms round trip, quick enough to stay practical
// for actually ordering.
export default function MenuItemsPanel({ category, items, heightClass }) {
  const [displayed, setDisplayed] = useState({ category, items });
  const [phase, setPhase] = useState("idle"); // 'idle' | 'out' | 'in'
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (category === displayed.category) {
      // same category, just fresh data (e.g. after a realtime menu update)
      setDisplayed({ category, items });
      return;
    }
    setPhase("out");
    timeoutRef.current = setTimeout(() => {
      setDisplayed({ category, items });
      setPhase("in");
      requestAnimationFrame(() => setPhase("idle"));
    }, 220);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, items]);

  return (
    <div
      className={`${heightClass} overflow-y-auto pr-1`}
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 transition-all duration-200 ease-out"
        style={{
          opacity: phase === "idle" ? 1 : 0,
          transform: phase === "out" ? "translateY(10px) scale(0.98)" : "translateY(0) scale(1)",
        }}
      >
        {displayed.items.map((item, i) => (
          <ItemCard key={item.id} item={item} index={i} />
        ))}
        {displayed.items.length === 0 && (
          <p className="col-span-full text-smoke text-sm py-8 text-center">
            No dishes in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

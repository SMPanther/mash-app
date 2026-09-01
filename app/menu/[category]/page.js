"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useCart } from "@/lib/CartContext";

function DishRow({ item }) {
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
        const def = (data || []).find((v) => v.is_default) || (data || [])[0];
        setSelectedVariation(def || null);
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

  return (
    <div className="flex items-center justify-between border-b border-smoke/20 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-char text-sm sm:text-base">{item.name}</div>
        {item.description && <div className="text-xs sm:text-sm text-smoke truncate">{item.description}</div>}
        {variations.length > 0 && (
          <select
            value={selectedVariation?.id || ""}
            onChange={(e) => setSelectedVariation(variations.find((v) => v.id === e.target.value))}
            className="mt-1 text-xs border border-smoke/30 rounded-md px-2 py-1 bg-white"
          >
            {variations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — Rs. {v.price}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-char">Rs. {displayPrice}</span>
        <button
          onClick={handleAdd}
          data-cursor-hover
          className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-chili text-paper whitespace-nowrap"
        >
          {added ? "Added ✓" : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function MenuCategoryPage({ params }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("menu_items")
      .select("*, menu_categories!inner(slug)")
      .eq("menu_categories.slug", params.category)
      .eq("is_available", true)
      .then(({ data }) => setItems(data || []));
  }, [params.category]);

  return (
    <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh]">
      <h1 className="font-display text-3xl sm:text-4xl text-char mb-6 sm:mb-8 capitalize">
        {params.category.replace(/-/g, " ")}
      </h1>
      <div>
        {items.map((item) => (
          <DishRow key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}

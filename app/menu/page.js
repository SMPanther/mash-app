"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

// Maps a category's slug to its sticker asset. Falls back to no image if a
// slug isn't in the set yet (new categories added in admin won't have a
// matching sticker until one's drawn in the same style — see
// 02-logo-brief.md §7 on keeping the icon set one consistent hand).
const CATEGORY_STICKERS = {
  burgers: "/assets/category/burgers.png",
  ramen: "/assets/category/ramen.png",
  pizzas: "/assets/category/pizzas.png",
  "bbq-grills": "/assets/category/bbq-grills.png",
  desserts: "/assets/category/desserts.png",
  drinks: "/assets/category/drinks.png",
  "pakistani-cuisine": "/assets/category/pakistani-cuisine.png",
  "deals-combos": "/assets/category/deals-combos.png",
};

export default function MenuPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setCategories(data || []));
  }, []);

  return (
    <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh]">
      <h1 className="font-display text-3xl sm:text-4xl text-char mb-6 sm:mb-8">Menu</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-px sm:bg-smoke">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/menu/${cat.slug}`}
            className="aspect-square bg-ink text-paper rounded-lg sm:rounded-none flex flex-col items-center justify-center gap-2 p-4 font-medium"
          >
            {CATEGORY_STICKERS[cat.slug] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={CATEGORY_STICKERS[cat.slug]}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            )}
            <span className="text-sm sm:text-base text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

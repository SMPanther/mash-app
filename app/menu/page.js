"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { CATEGORIES } from "@/lib/categories";
import CategoryWheel from "@/components/CategoryWheel";
import MenuItemsPanel from "@/components/MenuItemsPanel";
import HeroSpotlight from "@/components/HeroSpotlight";

const PANEL_HEIGHT = "h-[520px] sm:h-[560px]";

function MenuPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [itemsByCategory, setItemsByCategory] = useState({});
  const [featuredItem, setFeaturedItem] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const requestedSlug = searchParams.get("category");
  const initialIndex = Math.max(
    0,
    CATEGORIES.findIndex((c) => c.slug === requestedSlug)
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex === -1 ? 0 : initialIndex);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("menu_items")
      .select("*, menu_categories(slug)")
      .eq("is_available", true)
      .then(({ data }) => {
        const grouped = {};
        (data || []).forEach((item) => {
          const slug = item.menu_categories?.slug;
          if (!slug) return;
          if (!grouped[slug]) grouped[slug] = [];
          grouped[slug].push(item);
        });
        setItemsByCategory(grouped);
        setLoaded(true);
      });

    supabase
      .from("menu_items")
      .select("*, menu_categories(slug)")
      .eq("featured", true)
      .limit(1)
      .then(({ data }) => setFeaturedItem(data?.[0] || null));
  }, []);

  // Attach each category's icon as a fallback image for its dishes (until
  // real per-dish photography is uploaded via the admin panel) — done here
  // rather than baked into the fetch so it stays in sync with lib/categories.js.
  const iconBySlug = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.slug] = c.icon));
    return map;
  }, []);

  function withIconFallback(items, slug) {
    return (items || []).map((item) => ({
      ...item,
      menu_categories: { ...item.menu_categories, icon: iconBySlug[slug] },
    }));
  }

  const activeCategory = CATEGORIES[activeIndex];
  const activeItems = withIconFallback(itemsByCategory[activeCategory.slug], activeCategory.slug);

  function handleActiveChange(index) {
    setActiveIndex(index);
    router.replace(`/menu?category=${CATEGORIES[index].slug}`, { scroll: false });
  }

  const featuredWithIcon = featuredItem
    ? { ...featuredItem, menu_categories: { icon: iconBySlug[featuredItem.menu_categories?.slug] } }
    : null;

  return (
    <main className="px-[6vw] sm:px-[8vw] py-8 sm:py-[6vh]">
      <HeroSpotlight item={featuredWithIcon} />

      {/* Desktop / tablet: wheel + independently-scrolling panel side by side */}
      <div className="hidden md:flex gap-6 lg:gap-10">
        <div className={`w-64 lg:w-72 shrink-0 ${PANEL_HEIGHT}`}>
          <CategoryWheel categories={CATEGORIES} activeIndex={activeIndex} onActiveChange={handleActiveChange} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl lg:text-3xl text-char mb-4">{activeCategory.name}</h1>
          <MenuItemsPanel category={activeCategory.slug} items={activeItems} heightClass={PANEL_HEIGHT} />
        </div>
      </div>

      {/* Mobile: horizontal pill tabs, then a normal-flow list (page scrolls) */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-[6vw] px-[6vw]">
          {CATEGORIES.map((cat, index) => (
            <button
              key={cat.slug}
              onClick={() => handleActiveChange(index)}
              data-cursor-hover
              className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${
                index === activeIndex ? "border-chili bg-chili/5" : "border-smoke/20"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
              <span className="text-[10px] font-medium text-char whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
        <h1 className="font-display text-2xl text-char mt-4 mb-4">{activeCategory.name}</h1>
        <MenuItemsPanel category={activeCategory.slug} items={activeItems} heightClass="" />
      </div>

      {loaded && Object.keys(itemsByCategory).length === 0 && (
        <p className="text-smoke text-sm mt-6">
          No menu data yet — run <code>supabase/seed.sql</code> to add some test dishes.
        </p>
      )}
    </main>
  );
}

// useSearchParams() requires a Suspense boundary — see Next.js docs on
// bailing out of static rendering for client components that read the URL.
export default function MenuPage() {
  return (
    <Suspense fallback={<div className="px-[8vw] py-[8vh] text-smoke">Loading menu…</div>}>
      <MenuPageInner />
    </Suspense>
  );
}

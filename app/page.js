"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";

// Single-location restaurant — no /locations list. A "Visit us" line
// (address + hours) covers what a locations page would otherwise need.
const CATEGORIES = [
  { name: "Burgers", slug: "burgers", img: "/assets/category/burgers.png" },
  { name: "Ramen", slug: "ramen", img: "/assets/category/ramen.png" },
  { name: "Pizzas", slug: "pizzas", img: "/assets/category/pizzas.png" },
  { name: "BBQ & Grills", slug: "bbq-grills", img: "/assets/category/bbq-grills.png" },
  { name: "Pakistani cuisine", slug: "pakistani-cuisine", img: "/assets/category/pakistani-cuisine.png" },
  { name: "Desserts", slug: "desserts", img: "/assets/category/desserts.png" },
  { name: "Drinks", slug: "drinks", img: "/assets/category/drinks.png" },
  { name: "Deals & combos", slug: "deals-combos", img: "/assets/category/deals-combos.png" },
];

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <main className="px-[6vw] sm:px-[8vw] py-8 sm:py-[8vh]">
      <header className="flex items-center justify-between mb-16 sm:mb-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/mash-logo.png" alt="MASH" className="h-9 sm:h-11 w-auto" />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8 text-sm text-char">
          <a href="/menu">Menu</a>
          <a href="#about">About</a>
          <a href="#visit">Visit us</a>
          <a href="/order" className="relative" data-cursor-hover>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/cart.png" alt="Cart" className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-chili text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </a>
        </nav>
        <a
          href="/order"
          className="hidden sm:inline-block bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium"
        >
          Order now
        </a>

        {/* Mobile: cart + hamburger */}
        <div className="sm:hidden flex items-center gap-3">
          <a href="/order" className="relative" data-cursor-hover>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/cart.png" alt="Cart" className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-chili text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </a>
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center"
            aria-label="Menu"
            data-cursor-hover
          >
            <span className="text-2xl">{navOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>

      {navOpen && (
        <nav className="sm:hidden flex flex-col gap-4 text-char text-lg mb-10 -mt-10">
          <a href="/menu" onClick={() => setNavOpen(false)}>Menu</a>
          <a href="#about" onClick={() => setNavOpen(false)}>About</a>
          <a href="#visit" onClick={() => setNavOpen(false)}>Visit us</a>
          <a
            href="/order"
            className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium text-center"
          >
            Order now
          </a>
        </nav>
      )}

      <h1 className="font-display text-[clamp(2.25rem,9vw,5.5rem)] leading-[0.95] max-w-[16ch] mb-5 sm:mb-6">
        MIX. MASH. EAT.
      </h1>
      <p className="text-smoke max-w-[40ch] text-sm sm:text-base mb-10 sm:mb-12">
        One kitchen, every cuisine you're craving. Burgers, ramen, pizza, BBQ, Pakistani classics —
        mashed into one menu.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.slug}
            href={`/menu/${cat.slug}`}
            className="flex flex-col items-center gap-1.5 sm:gap-2 text-center"
            data-cursor-hover
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cat.img} alt="" className="w-14 h-14 sm:w-20 sm:h-20 object-contain" />
            <span className="text-[11px] sm:text-sm text-char leading-tight">{cat.name}</span>
          </a>
        ))}
      </div>

      {/* TODO: signature dish spotlight, story strip — see
          01-project-study.md §2/§4 layout concept */}
    </main>
  );
}

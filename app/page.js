"use client";

import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import { CATEGORIES } from "@/lib/categories";

// Single-location restaurant — no /locations list. A "Visit us" line
// (address + hours) covers what a locations page would otherwise need.

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <main className="px-[6vw] sm:px-[8vw] py-8 sm:py-[8vh] relative overflow-hidden">
      {/* decorative corner cluster — purely visual, hidden from screen readers */}
      <div className="hidden sm:block absolute -top-2 -left-6 opacity-70 pointer-events-none" aria-hidden="true">
        <div className="relative w-40 h-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/category/bbq-grills.png" alt="" className="absolute w-16 h-16 top-0 left-0 -rotate-12" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/category/desserts.png" alt="" className="absolute w-14 h-14 top-4 left-14 rotate-6" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/category/drinks.png" alt="" className="absolute w-12 h-12 top-10 left-28 -rotate-6" />
        </div>
      </div>

      <header className="flex items-center justify-between mb-16 sm:mb-24 relative z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/mash-logo.png" alt="MASH" className="h-9 sm:h-11 w-auto" />

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-8 text-sm text-char">
          <a href="/menu">Menu</a>
          <a href="#about">About</a>
          <a href="#visit">Visit us</a>
          <a href="/login" data-cursor-hover>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/profile.png" alt="Account" className="w-6 h-6" />
          </a>
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
          <a href="/login" onClick={() => setNavOpen(false)}>Log in</a>
          <a
            href="/order"
            className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium text-center"
          >
            Order now
          </a>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-4">
        <div className="flex-1">
          <h1 className="font-display text-[clamp(2.25rem,9vw,5.5rem)] leading-[0.95] max-w-[16ch] mb-5 sm:mb-6">
            MIX. MASH. EAT.
          </h1>
          <p className="text-smoke max-w-[40ch] text-sm sm:text-base mb-8">
            One kitchen, every cuisine you're craving. Burgers, ramen, pizza, BBQ, Pakistani classics —
            mashed into one menu.
          </p>
          <a
            href="/menu"
            data-cursor-hover
            className="hidden sm:inline-block bg-chili text-paper rounded-full px-6 py-3 text-sm font-medium"
          >
            Explore the menu
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/mascot/thumbs-up.png"
          alt=""
          className="w-40 sm:w-64 shrink-0"
          style={{ animation: "float 5s ease-in-out infinite", filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.15))" }}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 mt-10 sm:mt-14">
        {CATEGORIES.map((cat, i) => (
          <a
            key={cat.slug}
            href={`/menu?category=${cat.slug}`}
            className="flex flex-col items-center gap-2 text-center bg-white/50 hover:bg-white rounded-2xl p-3 transition-colors"
            data-cursor-hover
          >
            <div style={{ animation: `float 4.5s ease-in-out ${(i % 4) * 0.35}s infinite` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.icon}
                alt=""
                className="w-16 h-16 sm:w-24 sm:h-24 object-contain"
                style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.12))" }}
              />
            </div>
            <span className="text-[11px] sm:text-sm text-char leading-tight">{cat.name}</span>
          </a>
        ))}
      </div>

      {/* TODO: story strip / about section — see 01-project-study.md §2/§4.
          The richer spotlight + browsing experience lives on /menu itself
          (wheel + hero + mascot pointing at the panel). */}
    </main>
  );
}

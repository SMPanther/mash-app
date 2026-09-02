"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/coupons", label: "Coupons" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-smoke/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/mash-logo.png" alt="" className="h-6 w-auto" />
        <span className="font-display text-lg sm:text-xl text-char">admin</span>
      </div>
      <nav className="flex gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              data-cursor-hover
              className={`px-3 py-1.5 rounded-full transition-colors ${
                active ? "bg-chili text-paper" : "text-char hover:bg-smoke/10"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <a href="/" data-cursor-hover className="text-xs sm:text-sm text-smoke">
          ← Site
        </a>
        <button onClick={handleLogout} data-cursor-hover className="text-xs sm:text-sm text-smoke">
          Log out
        </button>
      </div>
    </header>
  );
}

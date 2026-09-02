"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuthUser } from "@/lib/useAuthUser";

// Every customer-facing page outside the homepage (checkout, order
// history, coupons, login, signup, order confirmation) had NO shared
// navigation at all before this — no logo link home, no way back, no
// visible logout. This one header fixes all of that in one place rather
// than repeating nav markup on every page.
export default function SiteHeader() {
  const { itemCount } = useCart();
  const router = useRouter();
  const { user, logout } = useAuthUser();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between px-[6vw] sm:px-[8vw] py-4 border-b border-smoke/10">
      <a href="/" data-cursor-hover>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/mash-logo.png" alt="MASH" className="h-7 sm:h-8 w-auto" />
      </a>
      <nav className="flex items-center gap-4 sm:gap-6 text-sm text-char">
        <a href="/menu" data-cursor-hover>
          Menu
        </a>
        <a href="/order" className="relative" data-cursor-hover>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icons/cart.png" alt="Cart" className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-chili text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </a>
        {user === undefined ? null : user ? (
          <>
            <a href="/account/profile" data-cursor-hover>
              Profile
            </a>
            <button onClick={handleLogout} data-cursor-hover className="text-smoke">
              Log out
            </button>
          </>
        ) : (
          <a href="/login" data-cursor-hover>
            Log in
          </a>
        )}
      </nav>
    </header>
  );
}

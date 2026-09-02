"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function RiderHeader() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-smoke/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo/mash-logo.png" alt="" className="h-6 w-auto" />
        <span className="font-display text-lg sm:text-xl text-char">rider</span>
      </div>
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

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useAuthUser } from "@/lib/useAuthUser";
import SiteHeader from "@/components/SiteHeader";

function ProfileInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { logout } = useAuthUser();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [activeCouponCount, setActiveCouponCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone, default_address, email, created_at")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setAddress(profile.default_address || "");
        setEmail(profile.email || data.user.email || "");
        setMemberSince(profile.created_at);
      }

      const { count: orders } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", data.user.id)
        .eq("status", "delivered");
      setOrderCount(orders || 0);

      const { count: coupons } = await supabase
        .from("coupons")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", data.user.id)
        .eq("is_used", false);
      setActiveCouponCount(coupons || 0);

      setLoading(false);
    });
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, default_address: address }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Couldn't save — try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (isOnboarding) router.push("/");
  }

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (loading) return <p className="text-smoke p-8">Loading…</p>;

  const firstName = (name || "there").split(" ")[0];
  const joinYear = memberSince ? new Date(memberSince).getFullYear() : null;

  return (
    <>
      <SiteHeader />
      <main className="max-w-lg mx-auto pb-10 sm:pb-[8vh]">
        {isOnboarding && (
          <div className="bg-lime/15 border-b border-lime/40 p-4 text-sm text-char text-center">
            Welcome to MASH! Add your contact and delivery info now so checkout is faster next time.
          </div>
        )}

        {/* Mascot banner — a bit of personality instead of a plain header bar */}
        <div className="relative bg-ink px-6 pt-8 pb-14 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-chili/20 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/mascot/thumbs-up.png"
            alt=""
            className="absolute right-2 -bottom-2 w-28 opacity-90"
            style={{ animation: "float 5s ease-in-out infinite" }}
          />
          <div className="relative">
            <p className="text-paper/60 text-xs mb-1">Hey {firstName},</p>
            <h1 className="font-display text-3xl text-paper">welcome back</h1>
            {joinYear && <p className="text-paper/50 text-xs mt-1">MASH regular since {joinYear}</p>}
          </div>
        </div>

        {/* Stats strip, overlapping the banner slightly for depth */}
        <div className="px-6 -mt-8 relative grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-smoke/10">
            <div className="font-display text-2xl text-chili">{orderCount}</div>
            <div className="text-xs text-smoke">Orders delivered</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-smoke/10">
            <div className="font-display text-2xl text-chili">{activeCouponCount}</div>
            <div className="text-xs text-smoke">Coupons ready to use</div>
          </div>
        </div>

        <div className="px-6">
          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <a
              href="/account/orders"
              data-cursor-hover
              className="border border-smoke/20 rounded-xl p-4 text-sm font-medium text-char hover:border-chili/40 transition-colors"
            >
              📦 Order history
            </a>
            <a
              href="/account/coupons"
              data-cursor-hover
              className="border border-smoke/20 rounded-xl p-4 text-sm font-medium text-char hover:border-chili/40 transition-colors"
            >
              🏷️ My coupons
            </a>
          </div>

          {/* Editable details card */}
          <div className="border border-smoke/20 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-medium text-char mb-4">Contact details</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-smoke">Email</label>
                <input
                  value={email}
                  disabled
                  className="w-full border border-smoke/20 rounded-md px-3 py-2 bg-smoke/5 text-sm text-smoke"
                />
              </div>
              <div>
                <label className="text-xs text-smoke">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-smoke">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-smoke">Default delivery address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-smoke/30 rounded-md px-3 py-2 bg-white text-sm"
                />
              </div>

              {error && <p className="text-chili text-sm">{error}</p>}
              {saved && <p className="text-sm text-char">Saved.</p>}

              <button
                type="submit"
                data-cursor-hover
                className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium"
              >
                {isOnboarding ? "Save and continue" : "Save changes"}
              </button>
            </form>
          </div>

          <button onClick={handleLogout} data-cursor-hover className="text-sm text-smoke">
            Log out
          </button>
        </div>
      </main>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-smoke p-8">Loading…</p>}>
      <ProfileInner />
    </Suspense>
  );
}

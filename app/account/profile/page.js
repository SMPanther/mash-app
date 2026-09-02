"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

function ProfileInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOnboarding = searchParams.get("onboarding") === "true";

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
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
        .select("name, phone, default_address, email")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setName(profile.name || "");
        setPhone(profile.phone || "");
        setAddress(profile.default_address || "");
        setEmail(profile.email || data.user.email || "");
      }
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

  if (loading) return <p className="text-smoke p-8">Loading…</p>;

  return (
    <>
      <SiteHeader />
      <main className="px-[6vw] sm:px-[8vw] py-10 sm:py-[8vh] max-w-md">
        {isOnboarding && (
          <div className="bg-lime/15 border border-lime/40 rounded-lg p-4 mb-6 text-sm text-char">
            Welcome to MASH! Add your contact and delivery info now so checkout is faster next time —
            you can always change it later.
          </div>
        )}
        <h1 className="font-display text-3xl text-char mb-6">Your profile</h1>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-xs text-smoke">Email</label>
            <input value={email} disabled className="w-full border border-smoke/20 rounded-md px-3 py-2 bg-smoke/5 text-sm text-smoke" />
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

          <button type="submit" className="bg-chili text-paper rounded-full px-5 py-2.5 text-sm font-medium">
            {isOnboarding ? "Save and continue" : "Save changes"}
          </button>
        </form>
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

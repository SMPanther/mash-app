"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// One login for every role. The redirect-by-role here is what makes
// "admin login leads straight to the admin page" true — see
// 05-frontend-architecture.md "Key architectural decisions".
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      setError("Couldn't load your account. Try again.");
      return;
    }

    if (profile.role === "admin") router.push("/admin");
    else if (profile.role === "rider") router.push("/rider");
    else router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-char mb-6">MASH</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 mb-3 bg-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 mb-3 bg-white"
          required
        />
        {error && <p className="text-chili text-sm mb-3">{error}</p>}
        <button type="submit" className="w-full bg-chili text-paper rounded-full py-2 font-medium">
          Log in
        </button>
        <p className="text-sm text-smoke text-center mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-chili">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}

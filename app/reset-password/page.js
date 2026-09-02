"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// Reached via the link in the password-reset email
// (supabase.auth.resetPasswordForEmail's redirectTo, set in app/login/page.js).
// Supabase's client automatically turns the recovery token in the URL into
// a temporary session, so updateUser() here just works without needing to
// manually parse anything from the URL.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-6">
        <p className="text-char">Password updated — redirecting to login…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-char mb-6">Set a new password</h1>
        <input
          type="password"
          placeholder="New password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 mb-3 bg-white"
          required
        />
        {error && <p className="text-chili text-sm mb-3">{error}</p>}
        <button type="submit" className="w-full bg-chili text-paper rounded-full py-2 font-medium">
          Update password
        </button>
      </form>
    </main>
  );
}

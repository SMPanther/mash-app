"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// Every new signup gets a `profiles` row automatically (role defaults to
// 'customer') via the on_auth_user_created trigger in supabase/schema.sql
// — this form just needs to create the auth.users row; the rest follows.
export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off for this project — signed in immediately.
      // Send them to fill in contact/address once, rather than dropping
      // them on the homepage with an incomplete profile.
      router.push("/account/profile?onboarding=true");
    } else {
      // Supabase Auth has "Confirm email" turned on — no session until
      // they click the link. Don't pretend they're logged in.
      setNeedsConfirmation(true);
    }
  }

  if (needsConfirmation) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl text-char mb-3">Check your email</h1>
          <p className="text-smoke text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
          </p>
          <a href="/login" className="text-chili text-sm mt-4 inline-block">
            Go to login →
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <a href="/" className="block mb-6 text-sm text-smoke" data-cursor-hover>
          ← Back to MASH
        </a>
        <h1 className="font-display text-3xl text-char mb-6">Create your account</h1>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 mb-3 bg-white"
          required
        />
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
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className="w-full border border-smoke/30 rounded-md px-3 py-2 mb-3 bg-white"
          required
        />
        {error && <p className="text-chili text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-chili text-paper rounded-full py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-sm text-smoke text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-chili">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}

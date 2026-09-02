"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabaseClient";

// Extracted after a real bug: the home page had its own hardcoded
// `<a href="/login">` for the profile icon that never checked whether
// anyone was actually logged in — so "Profile" always bounced to login
// there, even right after saving profile info, while every other page
// (using SiteHeader, which checked auth state properly) worked fine.
// One hook, used everywhere that needs this, so it can't drift again.
export function useAuthUser() {
  const [user, setUser] = useState(undefined); // undefined = not checked yet

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  return { user, logout };
}

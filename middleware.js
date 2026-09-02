import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// This was missing entirely before, and is very likely why a logged-in
// user could hit a page (like a profile page) and get bounced back to
// /login: without middleware refreshing the auth cookies on every
// request, the access token can go stale between page loads and any
// server-side check (like app/admin/layout.js's getUser() call) sees no
// valid session even though the person never actually logged out.
// This is Supabase's documented required pattern for @supabase/ssr —
// not optional infrastructure, every server-rendered auth check depends
// on it running.
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Touching getUser() here is what actually triggers the refresh — just
  // creating the client doesn't do it.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and image optimization
     * files, where there's no session to refresh anyway.
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};

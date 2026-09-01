import { createBrowserClient } from "@supabase/ssr";

// Single browser-side Supabase client, reused everywhere on the client.
// Server components/actions should create their own server client with
// @supabase/ssr's createServerClient (cookie-based) instead of this one —
// keep browser and server clients separate rather than sharing an instance.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

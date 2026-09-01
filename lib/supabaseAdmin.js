import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the service role key, which bypasses RLS entirely —
// never import this in a client component, and never send this key to the
// browser. This is why coupon validation and order totals are computed
// here (app/api/checkout/route.js), not trusted from the client: a
// client-side-only discount calculation can be edited in devtools before
// the request is sent. See 07-phase2-features.md §6.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

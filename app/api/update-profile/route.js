import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabaseAdmin";

// Customers have no UPDATE policy on `profiles` at all (see schema.sql —
// deliberate, so nobody can self-promote their own role). That means
// profile edits (name/phone/address) have to go through a server route
// like this one, same pattern as checkout: verify who they actually are
// from their session, then use the service-role client to touch only the
// specific columns this endpoint is allowed to touch.
export async function POST(request) {
  const { name, phone, default_address } = await request.json();

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ name, phone, default_address })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

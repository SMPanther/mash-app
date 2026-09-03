import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabaseAdmin";

// Same pattern as /api/update-profile — riders have no direct UPDATE
// policy on `profiles` (nobody does, except admins; see schema.sql), so
// this goes through a server route that verifies who's actually asking
// and touches only the one column this endpoint is allowed to touch.
export async function POST(request) {
  const { isAvailable } = await request.json();

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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "rider") {
    return NextResponse.json({ error: "Only riders can toggle availability." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_available: isAvailable }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

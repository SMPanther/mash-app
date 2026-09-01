import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Re-checks role server-side on every request to this section — RLS on the
// database is the real security boundary, but this stops a customer who
// guesses /admin from even seeing the shell render. See
// 05-frontend-architecture.md "Key architectural decisions".
export default async function AdminLayout({ children }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-smoke/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-lg sm:text-xl text-char">MASH admin</span>
        <nav className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-char flex-wrap">
          <a href="/admin">Orders</a>
          <a href="/admin/complaints">Complaints</a>
          <a href="/admin/menu">Menu</a>
          <a href="/admin/coupons">Coupons</a>
        </nav>
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

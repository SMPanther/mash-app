import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AdminHeader from "@/components/AdminHeader";

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
      <AdminHeader />
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}

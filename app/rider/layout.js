import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export default async function RiderLayout({ children }) {
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
  if (profile?.role !== "rider") redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-smoke/20 px-6 py-4">
        <span className="font-display text-xl text-char">MASH rider</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

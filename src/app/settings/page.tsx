import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import ThemeSettings from "@/components/ThemeSettings";
import AccountSettings from "@/components/AccountSettings";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiel } = await supabase
    .from("profiles").select("username").eq("id", user.id).single();

  const username = profiel?.username ?? user.user_metadata?.username ?? "";

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors ml-auto">← Profile</Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-10">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Themes */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Your themes</h2>
          <ThemeSettings />
        </section>

        {/* Account */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Account</h2>
          <AccountSettings username={username} />
        </section>
      </main>
    </div>
  );
}

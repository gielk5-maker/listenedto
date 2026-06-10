import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import SettingsTabs from "@/components/SettingsTabs";

export default async function InstellingenPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiel } = await supabase
    .from("profiles").select("username, bio, spotify_url, avatar_url").eq("id", user.id).single();

  const username = profiel?.username ?? user.user_metadata?.username ?? "";
  const bio = profiel?.bio ?? "";
  const spotifyUrl = profiel?.spotify_url ?? "";
  const avatarUrl = profiel?.avatar_url ?? null;

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>} />

      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>
        <SettingsTabs
          initialTab={tab === "preferences" ? "preferences" : "profile"}
          username={username}
          bio={bio}
          spotifyUrl={spotifyUrl}
          userId={user.id}
          avatarUrl={avatarUrl}
        />
      </main>
    </div>
  );
}

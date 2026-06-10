import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ThemeSettings from "@/components/ThemeSettings";
import AccountSettings from "@/components/AccountSettings";
import ProfileSettings from "@/components/ProfileSettings";
import FeedbackForm from "@/components/FeedbackForm";

export default async function InstellingenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiel } = await supabase
    .from("profiles").select("username, bio, spotify_url").eq("id", user.id).single();

  const username = profiel?.username ?? user.user_metadata?.username ?? "";
  const bio = profiel?.bio ?? "";
  const spotifyUrl = profiel?.spotify_url ?? "";

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>} />

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-10">
        <h1 className="text-2xl font-bold">Settings</h1>

        {/* Themes */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Your themes</h2>
          <ThemeSettings />
        </section>

        {/* Profile */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Profile</h2>
          <ProfileSettings bio={bio} spotifyUrl={spotifyUrl} />
        </section>

        {/* Account */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Account</h2>
          <AccountSettings username={username} />
        </section>

        {/* Feedback */}
        <section>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Feedback</h2>
          <FeedbackForm userId={user.id} username={username} />
        </section>
      </main>
    </div>
  );
}

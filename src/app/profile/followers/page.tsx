import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function VolgersPagina() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: volgerRelaties } = await supabase
    .from("follows").select("follower_id").eq("following_id", user.id);

  const volgerIds = volgerRelaties?.map((r) => r.follower_id) ?? [];

  const { data: profielen } = volgerIds.length > 0
    ? await supabase.from("profiles").select("id, username").in("id", volgerIds)
    : { data: [] };

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors ml-auto">← Profile</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-xl font-bold mb-6">Followers <span className="text-stone-500 font-normal text-base">({profielen?.length ?? 0})</span></h1>

        {profielen?.length === 0 ? (
          <p className="text-stone-600 text-center py-16">No followers yet.</p>
        ) : (
          <div className="space-y-2">
            {profielen?.map((p) => (
              <Link key={p.id} href={`/user/${p.username}`}
                className="flex items-center gap-3 bg-stone-900 hover:bg-stone-800/80 rounded-2xl px-4 py-3.5 transition-colors border border-stone-800/40 hover:border-stone-700">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)] flex-shrink-0 shadow shadow-black/20">
                  {p.username[0].toUpperCase()}
                </div>
                <span className="font-semibold text-stone-100">{p.username}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

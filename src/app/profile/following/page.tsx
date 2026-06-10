import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/verified";

export default async function VolgendPagina() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: volgendRelaties } = await supabase
    .from("follows").select("following_id").eq("follower_id", user.id);

  const volgendIds = volgendRelaties?.map((r) => r.following_id) ?? [];

  const { data: profielen } = volgendIds.length > 0
    ? await supabase.from("profiles").select("id, username").in("id", volgendIds)
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
        <h1 className="text-xl font-bold mb-6">Following <span className="text-stone-500 font-normal text-base">({profielen?.length ?? 0})</span></h1>

        {profielen?.length === 0 ? (
          <p className="text-stone-600 text-center py-16">Not following anyone yet.</p>
        ) : (
          <div className="space-y-2">
            {profielen?.map((p) => (
              <Link key={p.id} href={`/user/${p.username}`}
                className="flex items-center gap-3 bg-stone-900 hover:bg-stone-800/80 rounded-2xl px-4 py-3.5 transition-colors border border-stone-800/40 hover:border-stone-700">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)] flex-shrink-0 shadow shadow-black/20">
                  {p.username[0].toUpperCase()}
                </div>
                <span className="flex items-center gap-1.5 font-semibold text-stone-100">
                  {p.username}
                  {isVerified(p.username) && <VerifiedBadge className="w-3.5 h-3.5 flex-shrink-0" />}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

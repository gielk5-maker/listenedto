import { redirect } from "next/navigation";
import Sterren from "@/components/Sterren";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import AlbumCover from "@/components/AlbumCover";



export default async function AlleRatingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ratings } = await supabase
    .from("ratings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/profiel" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/profiel" className="text-stone-500 hover:text-stone-200 text-sm transition-colors ml-auto">
          ← Profile
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">All ratings</h1>
          <span className="text-stone-500 text-sm">{ratings?.length ?? 0} total</span>
        </div>

        {!ratings || ratings.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-stone-600 mb-4">No ratings yet.</p>
            <Link href="/zoeken" className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-6 py-3 transition-opacity inline-block">
              Search albums
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {ratings.map((r) => (
              <Link
                key={r.id}
                href={`/album?name=${encodeURIComponent(r.album_name)}&artist=${encodeURIComponent(r.artist_name)}${r.album_image ? `&image=${encodeURIComponent(r.album_image)}` : ""}${r.album_url ? `&url=${encodeURIComponent(r.album_url)}` : ""}`}
                className="flex gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3 transition-colors border border-stone-800/40 hover:border-stone-700"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-stone-800">
                  <AlbumCover src={r.album_image} alt={r.album_name} width={48} height={48} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-stone-100">{r.album_name}</p>
                  <p className="text-stone-500 text-xs truncate">{r.artist_name}</p>
                  <Sterren rating={r.rating} />
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="text-stone-700 text-xs">
                    {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {(r.moment_wanneer || r.moment_waar) && (
                    <span className="text-[var(--accent)] text-xs">📍</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

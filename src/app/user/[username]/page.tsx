import { redirect } from "next/navigation";
import Sterren from "@/components/Sterren";
import Logo from "@/components/Logo";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { volg, ontvolg } from "@/app/actions/social";
import Image from "next/image";



export default async function GebruikerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiel } = await supabase
    .from("profiles").select("id, username, avatar_url").eq("username", username).maybeSingle();

  if (!profiel) {
    return (
      <div className="min-h-screen text-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">User not found.</p>
          <Link href="/users" className="text-[var(--accent)] text-sm">← Back</Link>
        </div>
      </div>
    );
  }

  const isZichzelf = profiel.id === user.id;

  const [
    { data: volgRelatie },
    { data: ratingsRaw },
    { data: volgers },
    { data: volgend },
    { data: favorieten },
  ] = await Promise.all([
    supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profiel.id).maybeSingle(),
    supabase.from("ratings").select("*").eq("user_id", profiel.id),
    supabase.from("follows").select("follower_id").eq("following_id", profiel.id),
    supabase.from("follows").select("following_id").eq("follower_id", profiel.id),
    supabase.from("favorites").select("*").eq("user_id", profiel.id).order("position"),
  ]);

  const volgtAl = !!volgRelatie;
  const ratings = [...(ratingsRaw ?? [])].sort((a, b) => {
    const aDate = a.listened_at ?? a.created_at.slice(0, 10);
    const bDate = b.listened_at ?? b.created_at.slice(0, 10);
    return bDate.localeCompare(aDate);
  });

  const gemiddelde = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen text-stone-50">
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/search" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Search</Link>
          <Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Profile</Link>
        </nav>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden shadow-xl shadow-black/25">
            {profiel.avatar_url ? (
              <Image src={profiel.avatar_url} alt={profiel.username} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-2xl font-bold text-[var(--accent-text)]">
                {profiel.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-stone-50">{profiel.username}</h1>
            <div className="flex gap-4 mt-1.5 text-sm text-stone-500 flex-wrap">
              <span className="text-stone-300 font-medium">{ratings?.length ?? 0} ratings</span>
              <span>{volgers?.length ?? 0} followers</span>
              <span>{volgend?.length ?? 0} following</span>
              {gemiddelde && <span className="text-[var(--accent)] font-medium">⌀ {gemiddelde} ★</span>}
            </div>
          </div>
          {!isZichzelf && (
            <form action={volgtAl ? ontvolg : volg}>
              <input type="hidden" name="following_id" value={profiel.id} />
              <button type="submit" className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
                volgtAl
                  ? "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700"
                  : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)]"
              }`}>
                {volgtAl ? "Unfollow" : "Follow"}
              </button>
            </form>
          )}
        </div>

        {/* Favourites */}
        {favorieten && favorieten.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-3 font-semibold">Favourite albums</h2>
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map((i) => {
                const fav = favorieten.find((f) => f.position === i + 1);
                if (!fav) return null;
                return (
                  <Link key={i} href={`/album?name=${encodeURIComponent(fav.album_name)}&artist=${encodeURIComponent(fav.artist_name)}${fav.album_image ? `&image=${encodeURIComponent(fav.album_image)}` : ""}${fav.album_url ? `&url=${encodeURIComponent(fav.album_url)}` : ""}`}>
                    <div className="relative rounded-xl overflow-hidden border border-stone-700/50" style={{ aspectRatio: "1" }}>
                      {fav.album_image
                        ? <Image src={fav.album_image} alt={fav.album_name} fill className="object-cover" />
                        : <div className="w-full h-full bg-stone-800" />}
                    </div>
                    <p className="text-[9px] text-stone-600 truncate mt-1 text-center">{fav.album_name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Ratings */}
        <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Ratings</h2>

        {ratings?.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-stone-600">No ratings yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ratings?.map((r) => (
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
                  {r.review && <p className="text-stone-700 text-xs mt-0.5 truncate italic">"{r.review}"</p>}
                </div>
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  <span className="text-stone-700 text-xs">
                    {new Date(r.listened_at ? r.listened_at + "T00:00:00" : r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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

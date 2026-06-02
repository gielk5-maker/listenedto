import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import FeedZoekbalk from "@/components/FeedZoekbalk";
import FeedKaart from "@/components/FeedKaart";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const eigenUsername = user.user_metadata?.username ?? user.email;

  const { data: gevolgden } = await supabase
    .from("follows").select("following_id").eq("follower_id", user.id);

  const gevolgdeIds = gevolgden?.map((f) => f.following_id) ?? [];

  if (gevolgdeIds.length === 0) {
    return (
      <div className="min-h-screen text-stone-50">
        <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
          <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
            <Logo />
            ListenedTo
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/gebruikers" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
            <Link href="/profiel" className="text-sm font-semibold text-[var(--accent)]">{eigenUsername}</Link>
            <form action={logout}><button type="submit" className="text-xs text-stone-700 hover:text-stone-400 transition-colors">Log out</button></form>
          </nav>
        </header>
        <main className="max-w-xl mx-auto px-5 py-8">
          <FeedZoekbalk />
          <div className="text-center py-20 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-stone-300 font-semibold mb-1">You're not following anyone yet</p>
            <p className="text-stone-600 text-sm mb-6">Find people to see their ratings here.</p>
            <Link href="/gebruikers" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold rounded-2xl px-6 py-3 transition-colors inline-block">
              Find people
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { data: feedRatings } = await supabase
    .from("ratings")
    .select("*")
    .in("user_id", gevolgdeIds)
    .order("created_at", { ascending: false })
    .limit(50);

  const ratingIds = feedRatings?.map((r) => r.id) ?? [];

  const { data: eigenRatingsData } = await supabase
    .from("ratings")
    .select("album_name, artist_name, rating")
    .eq("user_id", user.id);

  const eigenRatingMap: Record<string, number> = {};
  eigenRatingsData?.forEach((r) => {
    const key = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
    eigenRatingMap[key] = r.rating;
  });

  const allIds = [user.id, ...gevolgdeIds];
  const { data: profielen } = await supabase
    .from("profiles").select("id, username").in("id", allIds);
  const profielMap: Record<string, string> = {};
  profielen?.forEach((p) => { profielMap[p.id] = p.username; });
  profielMap[user.id] = profielMap[user.id] ?? eigenUsername;

  const { data: allLikes } = ratingIds.length > 0
    ? await supabase.from("likes").select("id, user_id, rating_id").in("rating_id", ratingIds)
    : { data: [] };

  const { data: allComments } = ratingIds.length > 0
    ? await supabase.from("comments").select("id, user_id, rating_id, content, created_at").in("rating_id", ratingIds).order("created_at", { ascending: true })
    : { data: [] };

  const commentIds = allComments?.map((c) => c.id) ?? [];

  const { data: allCommentLikes } = commentIds.length > 0
    ? await supabase.from("comment_likes").select("id, user_id, comment_id").in("comment_id", commentIds)
    : { data: [] };

  const commenterIds = [...new Set(allComments?.map((c) => c.user_id) ?? [])];
  const { data: commenterProfielen } = commenterIds.length > 0
    ? await supabase.from("profiles").select("id, username").in("id", commenterIds)
    : { data: [] };
  commenterProfielen?.forEach((p) => { profielMap[p.id] = p.username; });

  const { data: popularRaw } = await supabase
    .from("ratings")
    .select("album_name, artist_name, album_image, album_url, rating")
    .not("album_name", "is", null)
    .not("rating", "is", null);

  const ratingMap: Record<string, { album_name: string; artist_name: string; album_image: string | null; album_url: string | null; total: number; count: number }> = {};
  popularRaw?.forEach((r) => {
    const key = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
    if (!ratingMap[key]) ratingMap[key] = { album_name: r.album_name, artist_name: r.artist_name, album_image: r.album_image, album_url: r.album_url, total: 0, count: 0 };
    ratingMap[key].total += r.rating;
    ratingMap[key].count++;
  });
  const popularAlbums = Object.values(ratingMap)
    .filter((a) => a.count >= 1)
    .map((a) => ({ ...a, avg: Math.round((a.total / a.count) * 10) / 10 }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 10);

  return (
    <div className="min-h-screen text-stone-50">
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/gebruikers" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
          <Link href="/profiel" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)] transition-colors">{eigenUsername}</Link>
          <form action={logout}>
            <button type="submit" className="text-xs text-stone-700 hover:text-stone-400 transition-colors">Log out</button>
          </form>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <FeedZoekbalk />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Feed kolom */}
          <div className="w-full lg:max-w-xl">
            <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-5 font-semibold">Feed</h2>

            {!feedRatings || feedRatings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-stone-700 text-sm">The people you follow haven't rated anything yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedRatings.map((r) => {
                  const vriendUsername = profielMap[r.user_id] ?? "?";
                  const albumKey = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
                  const eigenRating = eigenRatingMap[albumKey] ?? null;
                  const likeCount = allLikes?.filter((l) => l.rating_id === r.id).length ?? 0;
                  const liked = allLikes?.some((l) => l.rating_id === r.id && l.user_id === user.id) ?? false;
                  const comments = (allComments?.filter((c) => c.rating_id === r.id) ?? []).map((c) => ({
                    id: c.id,
                    user_id: c.user_id,
                    username: profielMap[c.user_id] ?? "?",
                    content: c.content,
                    created_at: c.created_at,
                    likeCount: allCommentLikes?.filter((cl) => cl.comment_id === c.id).length ?? 0,
                    liked: allCommentLikes?.some((cl) => cl.comment_id === c.id && cl.user_id === user.id) ?? false,
                  }));

                  return (
                    <FeedKaart
                      key={r.id}
                      r={r}
                      vriendUsername={vriendUsername}
                      eigenUserId={user.id}
                      eigenUsername={eigenUsername}
                      eigenRating={eigenRating}
                      likeCount={likeCount}
                      liked={liked}
                      comments={comments}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Most popular — sidebar op desktop, boven feed op mobiel */}
          {popularAlbums.length > 0 && (
            <div className="w-full lg:w-56 lg:flex-shrink-0 order-first lg:order-last">
              <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Highest rated</h2>

              {/* Mobiel: horizontaal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 lg:hidden" style={{ scrollbarWidth: "none" }}>
                {popularAlbums.map((album, i) => (
                  <Link
                    key={`${album.album_name}__${album.artist_name}`}
                    href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
                    className="flex-shrink-0 w-20 group"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-800 mb-1.5 shadow-lg shadow-black/40 group-hover:opacity-80 transition-opacity">
                      {album.album_image
                        ? <img src={album.album_image} alt={album.album_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-stone-600 text-2xl">♪</div>
                      }
                      <span className="absolute top-1 left-1 text-[9px] font-bold text-stone-400 bg-stone-950/70 rounded-md px-1 py-0.5">#{i + 1}</span>
                    </div>
                    <p className="text-stone-200 text-[11px] font-semibold truncate leading-tight">{album.album_name}</p>
                    <p className="text-stone-600 text-[10px] truncate mt-0.5">{album.artist_name}</p>
                    <p className="text-[var(--accent)] text-[10px] font-medium mt-0.5">★ {album.avg} avg.</p>
                  </Link>
                ))}
              </div>

              {/* Desktop: verticale lijst */}
              <div className="hidden lg:flex flex-col gap-2">
                {popularAlbums.map((album, i) => (
                  <Link
                    key={`${album.album_name}__${album.artist_name}`}
                    href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
                    className="flex items-center gap-3 group hover:bg-stone-900 rounded-xl px-2 py-1.5 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-stone-700 w-4 text-right flex-shrink-0">#{i + 1}</span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0 group-hover:opacity-80 transition-opacity">
                      {album.album_image
                        ? <img src={album.album_image} alt={album.album_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-stone-600 text-xs">♪</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-stone-200 text-xs font-semibold truncate leading-tight">{album.album_name}</p>
                      <p className="text-stone-600 text-[10px] truncate">{album.artist_name}</p>
                      <p className="text-[var(--accent)] text-[10px]">★ {album.avg} avg.</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

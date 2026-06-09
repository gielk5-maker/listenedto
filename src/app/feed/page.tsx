import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import FeedZoekbalk from "@/components/FeedZoekbalk";
import FeedKaart from "@/components/FeedKaart";
import ConcertFeedKaart from "@/components/ConcertFeedKaart";
import ThemeApplicator from "@/components/ThemeApplicator";
import PollKaart from "@/components/PollKaart";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "popular" ? "popular" : "friends";

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
            <Link href="/users" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
            <Link href="/profile" className="text-sm font-semibold text-[var(--accent)]">{eigenUsername}</Link>
            <LogoutButton />
          </nav>
        </header>
        <main className="max-w-xl mx-auto px-5 py-8">
          <FeedZoekbalk />
          <div className="text-center py-20 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-stone-300 font-semibold mb-1">You're not following anyone yet</p>
            <p className="text-stone-600 text-sm mb-6">Find people to see their ratings here.</p>
            <Link href="/users" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold rounded-2xl px-6 py-3 transition-colors inline-block">
              Find people
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const allIds = [user.id, ...gevolgdeIds];

  const [
    { data: feedRatings },
    { data: eigenRatingsData },
    { data: profielen },
    { data: popularRaw },
    { data: eigenProfiel },
  ] = await Promise.all([
    supabase.from("ratings").select("*").in("user_id", gevolgdeIds).order("created_at", { ascending: false }).limit(50),
    supabase.from("ratings").select("album_name, artist_name, rating").eq("user_id", user.id),
    supabase.from("profiles").select("id, username").in("id", allIds),
    supabase.from("ratings").select("album_name, artist_name, album_image, album_url, rating").not("album_name", "is", null).not("rating", "is", null),
    supabase.from("profiles").select("theme").eq("id", user.id).single(),
  ]);

  const { data: feedConcertsRaw } = await supabase
    .from("concert_reviews")
    .select("id, user_id, rating, review, created_at, concert_id")
    .in("user_id", gevolgdeIds)
    .order("created_at", { ascending: false })
    .limit(30);

  // Fetch concert_events separately to avoid RLS join issues
  const feedConcertEventIds = [...new Set((feedConcertsRaw ?? []).map(c => c.concert_id))];
  const { data: feedConcertEvents } = feedConcertEventIds.length > 0
    ? await supabase.from("concert_events").select("id, artist_name, venue, city, country, concert_date").in("id", feedConcertEventIds)
    : { data: [] };
  const feedConcertEventMap: Record<string, { id: string; artist_name: string; venue: string | null; city: string; country: string; concert_date: string }> = {};
  (feedConcertEvents ?? []).forEach(e => { feedConcertEventMap[e.id] = e; });
  const feedConcerts = (feedConcertsRaw ?? []).map(c => ({ ...c, concert_events: feedConcertEventMap[c.concert_id] ?? null }));

  const ratingIds = feedRatings?.map((r) => r.id) ?? [];

  const eigenRatingMap: Record<string, number> = {};
  eigenRatingsData?.forEach((r) => {
    const key = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
    eigenRatingMap[key] = r.rating;
  });

  const profielMap: Record<string, string> = {};
  profielen?.forEach((p) => { profielMap[p.id] = p.username; });
  profielMap[user.id] = profielMap[user.id] ?? eigenUsername;

  const [
    { data: allLikes },
    { data: allComments },
  ] = await Promise.all([
    ratingIds.length > 0 ? supabase.from("likes").select("id, user_id, rating_id").in("rating_id", ratingIds) : Promise.resolve({ data: [] }),
    ratingIds.length > 0 ? supabase.from("comments").select("id, user_id, rating_id, content, created_at").in("rating_id", ratingIds).order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
  ]);

  const commentIds = allComments?.map((c) => c.id) ?? [];
  const commenterIds = [...new Set(allComments?.map((c) => c.user_id) ?? [])];

  const [
    { data: allCommentLikes },
    { data: commenterProfielen },
  ] = await Promise.all([
    commentIds.length > 0 ? supabase.from("comment_likes").select("id, user_id, comment_id").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
    commenterIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", commenterIds) : Promise.resolve({ data: [] }),
  ]);

  commenterProfielen?.forEach((p) => { profielMap[p.id] = p.username; });

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

  // Popular feed: most liked ratings with a review
  let popularFeedRatings: typeof feedRatings = [];
  let popularProfielMap: Record<string, string> = {};
  let popularLikes: { id: string; user_id: string; rating_id: string }[] = [];
  let popularComments: { id: string; user_id: string; rating_id: string; content: string; created_at: string }[] = [];
  let popularCommentLikes: { id: string; user_id: string; comment_id: string }[] = [];
  let popularConcerts: typeof feedConcerts = [];

  if (activeTab === "popular") {
    // Fetch recent ratings with reviews (last 90 days) + their like counts
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRatings } = await supabase
      .from("ratings")
      .select("*")
      .not("review", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    const recentIds = recentRatings?.map(r => r.id) ?? [];
    const { data: popLikeCounts } = recentIds.length > 0
      ? await supabase.from("likes").select("rating_id").in("rating_id", recentIds)
      : { data: [] };

    const likeCountMap: Record<string, number> = {};
    popLikeCounts?.forEach(l => { likeCountMap[l.rating_id] = (likeCountMap[l.rating_id] ?? 0) + 1; });

    // Score = likes / (ageInHours + 2)^1.5  — balances recency with popularity
    const now = Date.now();
    popularFeedRatings = (recentRatings ?? [])
      .map(r => {
        const ageHours = (now - new Date(r.created_at).getTime()) / 3600000;
        const likes = likeCountMap[r.id] ?? 0;
        const score = (likes + 0.1) / Math.pow(ageHours + 2, 1.5);
        return { ...r, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 50);

    const popUserIds = [...new Set(popularFeedRatings?.map(r => r.user_id) ?? [])];
    const { data: popProfielen } = popUserIds.length > 0
      ? await supabase.from("profiles").select("id, username").in("id", popUserIds)
      : { data: [] };
    popProfielen?.forEach(p => { popularProfielMap[p.id] = p.username; });

    const popRatingIds = popularFeedRatings?.map(r => r.id) ?? [];
    if (popRatingIds.length > 0) {
      const [{ data: pl }, { data: pc }] = await Promise.all([
        supabase.from("likes").select("id, user_id, rating_id").in("rating_id", popRatingIds),
        supabase.from("comments").select("id, user_id, rating_id, content, created_at").in("rating_id", popRatingIds).order("created_at", { ascending: true }),
      ]);
      popularLikes = pl ?? [];
      popularComments = pc ?? [];
      const popCommentIds = popularComments.map(c => c.id);
      if (popCommentIds.length > 0) {
        const { data: pcl } = await supabase.from("comment_likes").select("id, user_id, comment_id").in("comment_id", popCommentIds);
        popularCommentLikes = pcl ?? [];
        const popCommenterIds = [...new Set(popularComments.map(c => c.user_id))];
        const { data: pcp } = await supabase.from("profiles").select("id, username").in("id", popCommenterIds);
        pcp?.forEach(p => { popularProfielMap[p.id] = p.username; });
      }
    }

    // Fetch recent concert reviews for popular tab
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: popConcertsRaw } = await supabase
      .from("concert_reviews")
      .select("id, user_id, rating, review, created_at, concert_id")
      .gte("created_at", since90)
      .order("created_at", { ascending: false })
      .limit(30);
    const popConcertEventIds = [...new Set((popConcertsRaw ?? []).map(c => c.concert_id))];
    const { data: popConcertEvents } = popConcertEventIds.length > 0
      ? await supabase.from("concert_events").select("id, artist_name, venue, city, country, concert_date").in("id", popConcertEventIds)
      : { data: [] };
    const popConcertEventMap: Record<string, { id: string; artist_name: string; venue: string | null; city: string; country: string; concert_date: string }> = {};
    (popConcertEvents ?? []).forEach(e => { popConcertEventMap[e.id] = e; });
    popularConcerts = (popConcertsRaw ?? []).map(c => ({ ...c, concert_events: popConcertEventMap[c.concert_id] ?? null }));
    const popConcertUserIds = [...new Set((popConcertsRaw ?? []).map(c => c.user_id))];
    if (popConcertUserIds.length > 0) {
      const { data: pcu } = await supabase.from("profiles").select("id, username").in("id", popConcertUserIds);
      pcu?.forEach(p => { popularProfielMap[p.id] = p.username; });
    }
  }

  return (
    <div className="min-h-screen text-stone-50">
      <ThemeApplicator dbTheme={eigenProfiel?.theme ?? undefined} />
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/search" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Search</Link>
          <Link href="/profile" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)] transition-colors">{eigenUsername}</Link>
          <LogoutButton />
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <FeedZoekbalk />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900 rounded-2xl p-1 w-fit border border-stone-800/60">
          <Link href="/feed?tab=friends"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === "friends" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"}`}>
            Friends
          </Link>
          <Link href="/feed?tab=popular"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === "popular" ? "bg-stone-800 text-stone-100" : "text-stone-500 hover:text-stone-300"}`}>
            Popular
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Feed kolom */}
          <div className="w-full lg:max-w-2xl flex-1">
            <PollKaart userId={user.id} />

            {activeTab === "friends" ? (() => {
              // Merge ratings and concerts sorted by created_at
              type RatingItem = NonNullable<typeof feedRatings>[number];
              type ConcertItem = NonNullable<typeof feedConcerts>[number];
              type FeedItem = { type: "rating"; data: RatingItem; sortKey: string }
                             | { type: "concert"; data: ConcertItem; sortKey: string };
              const merged: FeedItem[] = [
                ...(feedRatings ?? []).map(r => ({ type: "rating" as const, data: r, sortKey: r.created_at })),
                ...(feedConcerts ?? []).map(c => ({ type: "concert" as const, data: c, sortKey: c.created_at })),
              ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

              return merged.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-stone-700 text-sm">The people you follow haven't posted anything yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {merged.map((item) => {
                    if (item.type === "concert") {
                      const c = item.data;
                      const event = c.concert_events as { id: string; artist_name: string; venue: string | null; city: string; country: string; concert_date: string } | null;
                      if (!event) return null;
                      return (
                        <ConcertFeedKaart
                          key={`concert-${c.id}`}
                          concertId={event.id}
                          artistName={event.artist_name}
                          venue={event.venue}
                          city={event.city}
                          country={event.country}
                          concertDate={event.concert_date}
                          username={profielMap[c.user_id] ?? "?"}
                          rating={c.rating}
                          review={c.review}
                          createdAt={c.created_at}
                        />
                      );
                    }
                    const r = item.data;
                    const vriendUsername = profielMap[r.user_id] ?? "?";
                    const albumKey = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
                    const eigenRating = eigenRatingMap[albumKey] ?? null;
                    const likeCount = allLikes?.filter((l) => l.rating_id === r.id).length ?? 0;
                    const liked = allLikes?.some((l) => l.rating_id === r.id && l.user_id === user.id) ?? false;
                    const comments = (allComments?.filter((c) => c.rating_id === r.id) ?? []).map((c) => ({
                      id: c.id, user_id: c.user_id, username: profielMap[c.user_id] ?? "?",
                      content: c.content, created_at: c.created_at,
                      likeCount: allCommentLikes?.filter((cl) => cl.comment_id === c.id).length ?? 0,
                      liked: allCommentLikes?.some((cl) => cl.comment_id === c.id && cl.user_id === user.id) ?? false,
                    }));
                    return (
                      <FeedKaart key={r.id} r={r} vriendUsername={vriendUsername} eigenUserId={user.id}
                        eigenUsername={eigenUsername} eigenRating={eigenRating} likeCount={likeCount}
                        liked={liked} comments={comments} />
                    );
                  })}
                </div>
              );
            })() : (() => {
                type PopRatingItem = NonNullable<typeof popularFeedRatings>[number];
                type PopConcertItem = NonNullable<typeof popularConcerts>[number];
                type PopItem = { type: "rating"; data: PopRatingItem; sortKey: string } | { type: "concert"; data: PopConcertItem; sortKey: string };
                const merged: PopItem[] = [
                  ...(popularFeedRatings ?? []).map(r => ({ type: "rating" as const, data: r, sortKey: r.created_at })),
                  ...(popularConcerts ?? []).map(c => ({ type: "concert" as const, data: c, sortKey: c.created_at })),
                ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
                return merged.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-stone-700 text-sm">No popular reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {merged.map(item => {
                      if (item.type === "concert") {
                        const c = item.data;
                        const event = c.concert_events as { id: string; artist_name: string; venue: string | null; city: string; country: string; concert_date: string } | null;
                        if (!event) return null;
                        return (
                          <ConcertFeedKaart key={`concert-${c.id}`} concertId={event.id} artistName={event.artist_name}
                            venue={event.venue} city={event.city} country={event.country} concertDate={event.concert_date}
                            username={popularProfielMap[c.user_id] ?? "?"} rating={c.rating} review={c.review} createdAt={c.created_at} />
                        );
                      }
                      const r = item.data;
                      const albumKey = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
                      const eigenRating = eigenRatingMap[albumKey] ?? null;
                      const likeCount = popularLikes.filter(l => l.rating_id === r.id).length;
                      const liked = popularLikes.some(l => l.rating_id === r.id && l.user_id === user.id);
                      const comments = popularComments.filter(c => c.rating_id === r.id).map(c => ({
                        id: c.id, user_id: c.user_id, username: popularProfielMap[c.user_id] ?? "?",
                        content: c.content, created_at: c.created_at,
                        likeCount: popularCommentLikes.filter(cl => cl.comment_id === c.id).length,
                        liked: popularCommentLikes.some(cl => cl.comment_id === c.id && cl.user_id === user.id),
                      }));
                      return (
                        <FeedKaart key={r.id} r={r} vriendUsername={popularProfielMap[r.user_id] ?? "?"} eigenUserId={user.id}
                          eigenUsername={eigenUsername} eigenRating={eigenRating} likeCount={likeCount}
                          liked={liked} comments={comments} />
                      );
                    })}
                  </div>
                );
              })()}
          </div>

          {/* Most popular — sidebar op desktop, boven feed op mobiel */}
          {popularAlbums.length > 0 && (
            <div className="w-full lg:w-72 lg:flex-shrink-0 order-first lg:order-last">
              <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Highest rated</h2>

              {/* Mobiel: horizontaal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-2 lg:hidden" style={{ scrollbarWidth: "none" }}>
                {popularAlbums.map((album, i) => (
                  <Link key={`${album.album_name}__${album.artist_name}`}
                    href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
                    className="flex-shrink-0 w-20 group">
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
                <Link href="/topalbums" className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors mt-1 block">See more →</Link>
              </div>

              {/* Desktop: grotere lijst */}
              <div className="hidden lg:flex flex-col gap-1">
                {popularAlbums.map((album, i) => (
                  <Link key={`${album.album_name}__${album.artist_name}`}
                    href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
                    className="flex items-center gap-3 group hover:bg-stone-900 rounded-2xl px-3 py-2.5 transition-colors">
                    <span className="text-xs font-bold text-stone-600 w-5 text-right flex-shrink-0">#{i + 1}</span>
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 group-hover:opacity-80 transition-opacity shadow-md shadow-black/30">
                      {album.album_image
                        ? <img src={album.album_image} alt={album.album_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-stone-600 text-sm">♪</div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-stone-200 text-sm font-semibold truncate leading-tight">{album.album_name}</p>
                      <p className="text-stone-500 text-xs truncate">{album.artist_name}</p>
                      <p className="text-[var(--accent)] text-xs font-medium">★ {album.avg}</p>
                    </div>
                  </Link>
                ))}
                <Link href="/topalbums" className="text-xs text-stone-600 hover:text-stone-400 transition-colors mt-2 px-3">See all →</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

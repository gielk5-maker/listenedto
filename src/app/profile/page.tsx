import { redirect } from "next/navigation";
import Sterren from "@/components/Sterren";
import Logo from "@/components/Logo";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import AlbumCover from "@/components/AlbumCover";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ThemeApplicator from "@/components/ThemeApplicator";
import AvatarUpload from "@/components/AvatarUpload";
import FavorietenSlots from "@/components/FavorietenSlots";
import LijstBeheer from "@/components/LijstBeheer";
import RatingVerdeling from "@/components/RatingVerdeling";
import ListeningStats from "@/components/ListeningStats";



export default async function ProfielPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: ratingsRaw },
    { data: volgers },
    { data: volgend },
    { data: profiel },
    { data: favorieten },
    { data: lijstenRaw },
    { data: concertReviews },
  ] = await Promise.all([
    supabase.from("ratings").select("*").eq("user_id", user.id),
    supabase.from("follows").select("follower_id").eq("following_id", user.id),
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
    supabase.from("profiles").select("username, avatar_url, theme, bio, spotify_url").eq("id", user.id).single(),
    supabase.from("favorites").select("*").eq("user_id", user.id).order("position"),
    supabase.from("lists").select("id, name, description").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("concert_reviews").select("*, concert_events(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const ratings = [...(ratingsRaw ?? [])].sort((a, b) => {
    const aDate = a.listened_at ?? a.created_at.slice(0, 10);
    const bDate = b.listened_at ?? b.created_at.slice(0, 10);
    return bDate.localeCompare(aDate);
  });

  const lijsten = await Promise.all((lijstenRaw ?? []).map(async (l) => {
    const { count } = await supabase.from("list_items").select("id", { count: "exact", head: true }).eq("list_id", l.id);
    return { ...l, _count: count ?? 0 };
  }));

  const username = profiel?.username ?? user.user_metadata?.username ?? user.email;
  const avatarUrl = profiel?.avatar_url ?? null;
  const bio = profiel?.bio ?? null;
  const spotifyUrl = profiel?.spotify_url ?? null;
  const aantalRatings = ratings?.length ?? 0;
  const gemiddelde = aantalRatings > 0
    ? (ratings!.reduce((sum, r) => sum + r.rating, 0) / aantalRatings).toFixed(1)
    : null;

  const artiestTelling: Record<string, { count: number; totalRating: number }> = {};
  ratings?.forEach((r) => {
    if (!artiestTelling[r.artist_name]) artiestTelling[r.artist_name] = { count: 0, totalRating: 0 };
    artiestTelling[r.artist_name].count++;
    artiestTelling[r.artist_name].totalRating += r.rating;
  });
  const topArtiesten = Object.entries(artiestTelling)
    .sort((a, b) => b[1].count - a[1].count || b[1].totalRating - a[1].totalRating)
    .slice(0, 5);

  const verdeling: Record<string, number> = { "5": 0, "4.5": 0, "4": 0, "3.5": 0, "3": 0, "2.5": 0, "2": 0, "1.5": 0, "1": 0, "0.5": 0 };
  ratings?.forEach((r) => { verdeling[String(r.rating)] = (verdeling[String(r.rating)] ?? 0) + 1; });
  const maxVerdeling = Math.max(...Object.values(verdeling), 1);

  return (
    <div className="min-h-screen text-stone-50">
      <ThemeApplicator dbTheme={profiel?.theme ?? undefined} />
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/search" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Search</Link>
          <Link href="/users" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
          <LogoutButton />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">

        {/* Profile header */}
        <div className="flex items-center gap-5">
          <AvatarUpload userId={user.id} username={username} avatarUrl={avatarUrl} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone-50">{username}</h1>
              {spotifyUrl && (
                <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" title="Spotify profile"
                  className="text-[#1DB954] hover:opacity-80 transition-opacity flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </a>
              )}
            </div>
            {bio && <p className="text-stone-400 text-sm mt-1 max-w-xs">{bio}</p>}
            <div className="flex gap-4 mt-1.5 text-sm text-stone-500 flex-wrap">
              <span className="text-stone-300 font-medium">{aantalRatings} ratings</span>
              <Link href="/profile/followers" className="hover:text-stone-100 transition-colors">{volgers?.length ?? 0} followers</Link>
              <Link href="/profile/following" className="hover:text-stone-100 transition-colors">{volgend?.length ?? 0} following</Link>
              {gemiddelde && <span className="text-[var(--accent)] font-medium">⌀ {gemiddelde} ★</span>}
            </div>
          </div>
        </div>

        {/* Favourites */}
        <div>
          <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-3 font-semibold">Favourite albums</h2>
          <FavorietenSlots favorieten={favorieten ?? []} bewerkbaar={true} />
        </div>

        {/* Stats */}
        {aantalRatings > 0 && (
          <ListeningStats ratings={ratings.filter(r => r.rating != null).map(r => ({ rating: r.rating, listened_at: r.listened_at, created_at: r.created_at, artist_name: r.artist_name }))} />
        )}

        {aantalRatings > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topArtiesten.length > 0 && (
              <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60">
                <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Most rated</h2>
                <div className="space-y-3">
                  {topArtiesten.map(([artiest, info], i) => (
                    <div key={artiest} className="flex items-center gap-3">
                      <span className="text-stone-700 text-xs w-4 font-medium">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={`/artist?name=${encodeURIComponent(artiest)}`} className="text-sm font-semibold truncate text-stone-100 hover:text-[var(--accent)] transition-colors block">{artiest}</Link>
                        <p className="text-stone-600 text-xs">
                          {info.count} {info.count === 1 ? "listen" : "listens"} · avg. {(info.totalRating / info.count).toFixed(1)} ★
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60">
              <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Rating distribution</h2>
              <RatingVerdeling verdeling={verdeling} totaal={aantalRatings} />
            </div>
          </div>
        )}

        {/* Lists */}
        <LijstBeheer lijsten={lijsten} bewerkbaar={true} />

        {/* Concerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold">Concerts</h2>
            <Link href="/concert/log" className="text-xs text-[var(--accent)] font-medium">+ Log concert</Link>
          </div>
          {!concertReviews || concertReviews.length === 0 ? (
            <div className="text-center py-10 bg-stone-900/60 rounded-3xl border border-stone-800">
              <p className="text-stone-600 text-sm mb-3">No concerts logged yet.</p>
              <Link href="/concert/log" className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity inline-block">
                Log your first concert
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {concertReviews.map((r) => {
                const event = r.concert_events as { id: string; artist_name: string; venue: string | null; city: string; country: string; concert_date: string } | null;
                if (!event) return null;
                return (
                  <div key={r.id}>
                    <Link href={`/concert/${event.id}`}
                      className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3.5 transition-colors border border-stone-800/40 hover:border-stone-700">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-lg flex-shrink-0">
                        🎤
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-stone-100">{event.artist_name}</p>
                        <p className="text-stone-500 text-xs truncate">{event.venue ? `${event.venue} · ` : ""}{event.city}, {event.country}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-stone-700 text-xs">{new Date(event.concert_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                        {r.rating && <p className="text-[var(--accent)] text-xs font-medium">{r.rating} ★</p>}
                      </div>
                    </Link>
                    {r.review && (
                      <p className="text-stone-500 text-xs italic px-1 mt-1 truncate">"{r.review}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ratings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold">Ratings</h2>
            <Link href="/search" className="text-xs text-[var(--accent)] font-medium">+ Add album</Link>
          </div>

          {aantalRatings === 0 ? (
            <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
              <p className="text-stone-600 mb-4">You haven't rated any albums yet.</p>
              <Link href="/search" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold rounded-2xl px-6 py-3 transition-colors inline-block">
                Search albums
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ratings!.slice(0, 3).map((r) => (
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
                      {new Date((r.listened_at ? r.listened_at + "T00:00:00" : r.created_at)).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                    {(r.moment_wanneer || r.moment_waar) && (
                      <span className="text-[var(--accent)] text-xs">📍</span>
                    )}
                  </div>
                </Link>
              ))}
              {aantalRatings > 3 && (
                <Link
                  href="/profile/ratings"
                  className="block w-full text-center py-3 rounded-2xl border border-stone-800 text-stone-500 hover:text-stone-200 hover:border-stone-600 text-sm transition-colors"
                >
                  See all {aantalRatings} ratings
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

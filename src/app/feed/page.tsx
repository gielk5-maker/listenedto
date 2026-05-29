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

      <main className="max-w-xl mx-auto px-5 py-8">
        <FeedZoekbalk />
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
      </main>
    </div>
  );
}

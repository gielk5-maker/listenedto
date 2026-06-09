export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import FeedKaart from "@/components/FeedKaart";
import AlbumCover from "@/components/AlbumCover";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: r } = await supabase
    .from("ratings")
    .select("*")
    .eq("id", id)
    .single();

  if (!r) notFound();

  const [
    { data: profiel },
    { data: likes },
    { data: comments },
    { data: eigenRatingRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", r.user_id).single(),
    supabase.from("likes").select("id, user_id, rating_id").eq("rating_id", id),
    supabase.from("comments").select("id, user_id, rating_id, content, created_at").eq("rating_id", id).order("created_at", { ascending: true }),
    user ? supabase.from("ratings").select("rating").eq("user_id", user.id).eq("album_name", r.album_name).eq("artist_name", r.artist_name).single() : Promise.resolve({ data: null }),
  ]);

  const commentIds = (comments ?? []).map(c => c.id);
  const commenterIds = [...new Set((comments ?? []).map(c => c.user_id))];

  const [
    { data: commentLikes },
    { data: commenterProfielen },
  ] = await Promise.all([
    commentIds.length > 0 ? supabase.from("comment_likes").select("id, user_id, comment_id").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
    commenterIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", commenterIds) : Promise.resolve({ data: [] }),
  ]);

  const commenterMap: Record<string, string> = {};
  (commenterProfielen ?? []).forEach(p => { commenterMap[p.id] = p.username; });

  const username = profiel?.username ?? "?";
  const eigenUsername = user
    ? ((await supabase.from("profiles").select("username").eq("id", user.id).single()).data?.username ?? user.email ?? "")
    : "";

  const likeCount = likes?.length ?? 0;
  const liked = likes?.some(l => l.user_id === user?.id) ?? false;
  const eigenRating = eigenRatingRaw?.rating ?? null;

  const commentsFormatted = (comments ?? []).map(c => ({
    id: c.id,
    user_id: c.user_id,
    username: commenterMap[c.user_id] ?? "?",
    content: c.content,
    created_at: c.created_at,
    likeCount: (commentLikes ?? []).filter(cl => cl.comment_id === c.id).length,
    liked: (commentLikes ?? []).some(cl => cl.comment_id === c.id && cl.user_id === user?.id),
  }));

  const albumHref = `/album?name=${encodeURIComponent(r.album_name)}&artist=${encodeURIComponent(r.artist_name)}${r.album_image ? `&image=${encodeURIComponent(r.album_image)}` : ""}${r.album_url ? `&url=${encodeURIComponent(r.album_url)}` : ""}`;

  return (
    <div className="min-h-screen text-stone-50">
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/feed" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Feed</Link>
      </header>

      <main className="max-w-lg mx-auto px-5 py-10">
        {/* Album header */}
        <Link href={albumHref} className="flex items-center gap-4 mb-8 group">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-800 shadow-xl shadow-black/40 flex-shrink-0 group-hover:opacity-80 transition-opacity">
            <AlbumCover src={r.album_image} alt={r.album_name} width={80} height={80} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest mb-1">Review</p>
            <p className="font-bold text-xl text-stone-50 leading-tight">{r.album_name}</p>
            <p className="text-stone-400 text-sm">{r.artist_name}</p>
          </div>
        </Link>

        {user ? (
          <FeedKaart
            r={r}
            vriendUsername={username}
            eigenUserId={user.id}
            eigenUsername={eigenUsername}
            eigenRating={eigenRating}
            likeCount={likeCount}
            liked={liked}
            comments={commentsFormatted}
          />
        ) : (
          <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800/50 text-center">
            <p className="text-stone-400 text-sm mb-4">Log in to like and comment.</p>
            <Link href="/login" className="bg-[var(--accent)] text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm">
              Log in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

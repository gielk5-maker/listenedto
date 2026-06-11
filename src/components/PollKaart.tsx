"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/verified";

type PollType = "artist_vs" | "album_vs" | "hot_take";

type Poll = {
  id: string;
  type: PollType;
  question: string;
  option_a?: string; // artist or album name
  option_b?: string;
  artist_a?: string; // for album_vs: the artist of album a
  artist_b?: string;
};

const POLLS: Poll[] = [
  // Artist vs
  { id: "drake-vs-kendrick", type: "artist_vs", question: "Who is the better artist?", option_a: "Drake", option_b: "Kendrick Lamar" },
  { id: "kanye-vs-jayz", type: "artist_vs", question: "Who is the better artist?", option_a: "Kanye West", option_b: "Jay-Z" },
  { id: "kendrick-vs-jcole", type: "artist_vs", question: "Who is the better artist?", option_a: "Kendrick Lamar", option_b: "J. Cole" },
  { id: "tyler-vs-frank", type: "artist_vs", question: "Who is the better artist?", option_a: "Tyler, the Creator", option_b: "Frank Ocean" },
  { id: "nas-vs-jayz", type: "artist_vs", question: "Who is the better artist?", option_a: "Nas", option_b: "Jay-Z" },
  { id: "beyonce-vs-rihanna", type: "artist_vs", question: "Who is the better artist?", option_a: "Beyoncé", option_b: "Rihanna" },
  { id: "eminem-vs-drake", type: "artist_vs", question: "Who is the better artist?", option_a: "Eminem", option_b: "Drake" },
  { id: "kanye-vs-kendrick", type: "artist_vs", question: "Who is the better artist?", option_a: "Kanye West", option_b: "Kendrick Lamar" },

  // Album vs
  { id: "mbdtf-vs-tpab", type: "album_vs", question: "Which is the better album?", option_a: "My Beautiful Dark Twisted Fantasy", option_b: "To Pimp a Butterfly", artist_a: "Kanye West", artist_b: "Kendrick Lamar" },
  { id: "illmatic-vs-ready", type: "album_vs", question: "Which is the better album?", option_a: "Illmatic", option_b: "Ready to Die", artist_a: "Nas", artist_b: "The Notorious B.I.G." },
  { id: "blueprint-vs-reasonable", type: "album_vs", question: "Which is the better album?", option_a: "The Blueprint", option_b: "Reasonable Doubt", artist_a: "Jay-Z", artist_b: "Jay-Z" },
  { id: "damn-vs-gkmc", type: "album_vs", question: "Which is the better album?", option_a: "DAMN.", option_b: "good kid, m.A.A.d city", artist_a: "Kendrick Lamar", artist_b: "Kendrick Lamar" },
  { id: "channel-vs-blonde", type: "album_vs", question: "Which is the better album?", option_a: "Channel Orange", option_b: "Blonde", artist_a: "Frank Ocean", artist_b: "Frank Ocean" },
  { id: "flower-vs-igor", type: "album_vs", question: "Which is the better album?", option_a: "Flower Boy", option_b: "IGOR", artist_a: "Tyler, the Creator", artist_b: "Tyler, the Creator" },
  { id: "808s-vs-yeezus", type: "album_vs", question: "Which is the better album?", option_a: "808s & Heartbreak", option_b: "Yeezus", artist_a: "Kanye West", artist_b: "Kanye West" },

  // Hot takes
  { id: "hot-drake-overrated", type: "hot_take", question: "Drake is overrated." },
  { id: "hot-albums-better-eps", type: "hot_take", question: "Album intros and outros are usually skips." },
  { id: "hot-features-ruin", type: "hot_take", question: "Features often ruin albums." },
  { id: "hot-streaming-worse", type: "hot_take", question: "Streaming has made albums worse." },
  { id: "hot-debut-best", type: "hot_take", question: "An artist's debut album is usually their best." },
  { id: "hot-lyrics-overrated", type: "hot_take", question: "Lyrics are overrated — production matters more." },
  { id: "hot-shorter-better", type: "hot_take", question: "Albums under 40 minutes are almost always better." },
  { id: "hot-kanye-goat", type: "hot_take", question: "Kanye West is the greatest artist of his generation." },
  { id: "hot-concept-albums", type: "hot_take", question: "Concept albums are rarely as good as people claim." },
  { id: "hot-new-better", type: "hot_take", question: "New music is better than old music." },
];

async function fetchArtistImage(name: string): Promise<string | null> {
  try {
    const tokenRes = await fetch("/api/spotify-token");
    const { token } = await tokenRes.json();
    if (!token) return null;
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.artists?.items?.[0]?.images?.[0]?.url ?? null;
  } catch { return null; }
}

async function fetchAlbumImage(album: string, artist: string): Promise<string | null> {
  try {
    const tokenRes = await fetch("/api/spotify-token");
    const { token } = await tokenRes.json();
    if (!token) return null;
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(`${album} ${artist}`)}&type=album&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.albums?.items?.[0]?.images?.[0]?.url ?? null;
  } catch { return null; }
}

type Comment = { id: string; user_id: string; username: string; content: string; created_at: string; likeCount: number; liked: boolean };

export default function PollKaart({ userId, canVoteUnlimited = false }: { userId: string; canVoteUnlimited?: boolean }) {
  const [pollIndex, setPollIndex] = useState(0);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [username, setUsername] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const supabase = createClient();
  const commentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function findEligiblePoll() {
      const daysSinceEpoch = Math.floor(Date.now() / 86400000);
      const baseIndex = daysSinceEpoch % POLLS.length;
      const idx = canVoteUnlimited
        ? ((baseIndex + pollIndex) % POLLS.length)
        : baseIndex;
      const p = POLLS[idx];

      const [votesRes, profileRes] = await Promise.all([
        supabase.from("poll_votes").select("poll_id, vote").eq("user_id", userId),
        supabase.from("profiles").select("username").eq("id", userId).single(),
      ]);

      setUsername(profileRes.data?.username ?? "");

      const votedMap: Record<string, string> = {};
      (votesRes.data ?? []).forEach(v => { votedMap[v.poll_id] = v.vote; });

      setPoll(p);

      // Fetch images
      if (p.type === "artist_vs") {
        const [imgA, imgB] = await Promise.all([fetchArtistImage(p.option_a!), fetchArtistImage(p.option_b!)]);
        setImageA(imgA); setImageB(imgB);
      } else if (p.type === "album_vs") {
        const [imgA, imgB] = await Promise.all([fetchAlbumImage(p.option_a!, p.artist_a!), fetchAlbumImage(p.option_b!, p.artist_b!)]);
        setImageA(imgA); setImageB(imgB);
      }

      // Load votes + comments
      const [allVotesRes, commentsRes] = await Promise.all([
        supabase.from("poll_votes").select("vote").eq("poll_id", p.id),
        supabase.from("poll_comments").select("id, user_id, content, created_at").eq("poll_id", p.id).order("created_at", { ascending: true }),
      ]);
      const a = (allVotesRes.data ?? []).filter(v => v.vote === "a").length;
      const b = (allVotesRes.data ?? []).filter(v => v.vote === "b").length;
      setCounts({ a, b });
      if (votedMap[p.id]) setVoted(votedMap[p.id]);

      // Get usernames for comments
      const commentData = commentsRes.data ?? [];
      const userIds = [...new Set(commentData.map(c => c.user_id))];
      const commentIds = commentData.map(c => c.id);

      const [profilesRes, likesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", userIds) : Promise.resolve({ data: [] }),
        commentIds.length > 0 ? supabase.from("poll_comment_likes").select("comment_id, user_id").in("comment_id", commentIds) : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, string> = {};
      (profilesRes.data ?? []).forEach(p => { profileMap[p.id] = p.username; });

      const allLikes = likesRes.data ?? [];
      setComments(commentData.map(c => ({
        id: c.id,
        user_id: c.user_id,
        username: profileMap[c.user_id] ?? "?",
        content: c.content,
        created_at: c.created_at,
        likeCount: allLikes.filter(l => l.comment_id === c.id).length,
        liked: allLikes.some(l => l.comment_id === c.id && l.user_id === userId),
      })));

      setLoading(false);
    }
    findEligiblePoll();
  }, [userId, pollIndex]);

  async function vote(choice: "a" | "b") {
    if (!poll || voting) return;
    setVoting(true);
    await supabase.from("poll_votes").insert({ user_id: userId, poll_id: poll.id, vote: choice });
    const { data: allVotes } = await supabase.from("poll_votes").select("vote").eq("poll_id", poll.id);
    const a = (allVotes ?? []).filter(v => v.vote === "a").length;
    const b = (allVotes ?? []).filter(v => v.vote === "b").length;
    setCounts({ a, b });
    setVoted(choice);
    setVoting(false);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !poll || posting) return;
    setPosting(true);
    const { data } = await supabase.from("poll_comments").insert({ user_id: userId, poll_id: poll.id, content: comment.trim() }).select("id, content, created_at").single();
    if (data) setComments(prev => [...prev, { id: data.id, user_id: userId, username, content: data.content, created_at: data.created_at, likeCount: 0, liked: false }]);
    setComment("");
    setPosting(false);
  }

  async function toggleCommentLike(commentId: string, wasLiked: boolean) {
    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, liked: !wasLiked, likeCount: wasLiked ? c.likeCount - 1 : c.likeCount + 1 }
      : c
    ));
    if (wasLiked) {
      await supabase.from("poll_comment_likes").delete().eq("comment_id", commentId).eq("user_id", userId);
    } else {
      await supabase.from("poll_comment_likes").insert({ comment_id: commentId, user_id: userId });
    }
  }

  if (loading || !poll) return null;

  const total = counts.a + counts.b;
  const pctA = total > 0 ? Math.round((counts.a / total) * 100) : 50;
  const pctB = total > 0 ? Math.round((counts.b / total) * 100) : 50;
  const isHotTake = poll.type === "hot_take";
  const labelA = isHotTake ? "Agree" : poll.option_a!;
  const labelB = isHotTake ? "Disagree" : poll.option_b!;

  return (
    <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60 mb-6 space-y-4">
      {/* Header */}
      {(() => {
        const pollDate = new Date(Date.now() + pollIndex * 86400000);
        const isToday = pollIndex === 0;
        return (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-stone-600 uppercase tracking-widest font-semibold">
              {isHotTake ? "🔥 Hot Take" : isToday ? "Daily Poll" : "Poll"}
            </p>
            <div className="flex items-center gap-2">
              {canVoteUnlimited && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={pollIndex <= -10}
                    onClick={() => { setPoll(null); setVoted(null); setImageA(null); setImageB(null); setPollIndex(i => Math.max(i - 1, -10)); }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
                  <span className="text-[10px] text-stone-600 w-8 text-center">
                    {pollIndex === 0 ? "today" : pollIndex > 0 ? `+${pollIndex}d` : `${pollIndex}d`}
                  </span>
                  <button
                    disabled={pollIndex >= 10}
                    onClick={() => { setPoll(null); setVoted(null); setImageA(null); setImageB(null); setPollIndex(i => Math.min(i + 1, 10)); }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors text-xs disabled:opacity-30 disabled:cursor-not-allowed">›</button>
                </div>
              )}
              <p className="text-[10px] text-stone-700">{pollDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
            </div>
          </div>
        );
      })()}

      <p className="text-stone-200 font-semibold">{poll.question}</p>

      {/* Voting */}
      {!voted ? (
        <div className="grid grid-cols-2 gap-3">
          {([{ choice: "a" as const, label: labelA, img: imageA, artist: poll.artist_a }, { choice: "b" as const, label: labelB, img: imageB, artist: poll.artist_b }]).map(({ choice, label, img, artist }) => {
            const href = poll.type === "artist_vs"
              ? `/artist?name=${encodeURIComponent(label)}`
              : poll.type === "album_vs"
              ? `/album?name=${encodeURIComponent(label)}&artist=${encodeURIComponent(artist ?? "")}${img ? `&image=${encodeURIComponent(img)}` : ""}`
              : null;
            return (
              <button key={choice} onClick={() => vote(choice)} disabled={voting}
                className="flex flex-col items-center gap-2 bg-stone-800 hover:bg-stone-700 border border-stone-700/60 hover:border-[var(--accent)] rounded-2xl px-4 py-4 transition-all disabled:opacity-50">
                {!isHotTake && (
                  <div className="relative">
                    {img
                      ? <img src={img} alt={label} className={`object-cover shadow-lg shadow-black/40 ${poll.type === "album_vs" ? "w-16 h-16 rounded-xl" : "w-16 h-16 rounded-full"}`} />
                      : <div className={`w-16 h-16 bg-stone-700 flex items-center justify-center text-2xl ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"}`}>🎤</div>
                    }
                    {href && (
                      <Link href={href} onClick={e => e.stopPropagation()}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 border border-stone-700 rounded-full flex items-center justify-center hover:bg-stone-700 transition-colors"
                        title={`Go to ${label}`}>
                        <svg className="w-2.5 h-2.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
                <span className={`font-semibold text-stone-200 text-center leading-tight ${isHotTake ? "text-base" : "text-sm"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {([{ choice: "a" as const, label: labelA, img: imageA, artist: poll.artist_a, pct: pctA, count: counts.a }, { choice: "b" as const, label: labelB, img: imageB, artist: poll.artist_b, pct: pctB, count: counts.b }]).map(({ choice, label, img, artist, pct, count }) => {
            const isWinner = choice === "a" ? counts.a >= counts.b : counts.b >= counts.a;
            const isVoted = voted === choice;
            const href = poll.type === "artist_vs"
              ? `/artist?name=${encodeURIComponent(label)}`
              : poll.type === "album_vs"
              ? `/album?name=${encodeURIComponent(label)}&artist=${encodeURIComponent(artist ?? "")}${img ? `&image=${encodeURIComponent(img)}` : ""}`
              : null;
            return (
              <div key={choice} className="flex items-center gap-3">
                {!isHotTake && (
                  href ? (
                    <Link href={href} className={`flex-shrink-0 hover:opacity-75 transition-opacity ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"} overflow-hidden`}>
                      {img
                        ? <img src={img} alt={label} className={`w-10 h-10 object-cover ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"}`} />
                        : <div className={`w-10 h-10 bg-stone-700 flex items-center justify-center text-lg ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"}`}>🎤</div>
                      }
                    </Link>
                  ) : (
                    img
                      ? <img src={img} alt={label} className={`w-10 h-10 object-cover flex-shrink-0 ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"}`} />
                      : <div className={`w-10 h-10 bg-stone-700 flex items-center justify-center text-lg flex-shrink-0 ${poll.type === "album_vs" ? "rounded-xl" : "rounded-full"}`}>🎤</div>
                  )
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${isVoted ? "text-[var(--accent)]" : "text-stone-300"}`}>
                      {href ? (
                        <Link href={href} className="hover:text-[var(--accent)] transition-colors">{label}</Link>
                      ) : label}
                      {isVoted && " ✓"}
                    </span>
                    <span className="text-stone-500 text-xs">{pct}% · {count}</span>
                  </div>
                  <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-[var(--accent)]" : "bg-stone-600"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between">
            <p className="text-stone-700 text-xs">{total} {total === 1 ? "vote" : "votes"}</p>
            {canVoteUnlimited && (
              <button onClick={() => setVoted(null)} className="text-[10px] text-stone-600 hover:text-stone-400 transition-colors">
                Vote again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments toggle + count */}
      <div className="border-t border-stone-800/60 pt-3 flex items-center gap-4">
        <button
          onClick={() => setCommentOpen(v => !v)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${commentOpen ? "text-[var(--accent)]" : "text-stone-600 hover:text-stone-300"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
        </button>
      </div>

      {/* Comments section */}
      {commentOpen && (
        <div className="space-y-3">
          {comments.length > 0 && (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <span className="flex items-center gap-1 text-[var(--accent)] text-xs font-semibold flex-shrink-0 mt-0.5">
                    {c.username}
                    {isVerified(c.username) && <VerifiedBadge className="w-3 h-3 flex-shrink-0" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    {editingId === c.id ? (
                      <form onSubmit={async e => {
                        e.preventDefault();
                        if (!editingText.trim()) return;
                        setComments(prev => prev.map(x => x.id === c.id ? { ...x, content: editingText.trim() } : x));
                        await supabase.from("poll_comments").update({ content: editingText.trim() }).eq("id", c.id).eq("user_id", userId);
                        setEditingId(null);
                      }} className="flex gap-1.5">
                        <input autoFocus value={editingText} onChange={e => setEditingText(e.target.value)}
                          className="flex-1 bg-stone-800 border border-stone-700/50 rounded-lg px-2 py-0.5 text-xs text-stone-200 focus:outline-none focus:border-[var(--accent)]" />
                        <button type="submit" className="text-[var(--accent)] text-xs font-semibold">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="text-stone-600 text-xs">Cancel</button>
                      </form>
                    ) : (
                      <span className="text-stone-400 text-xs">{c.content}</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-center ml-auto">
                    <button
                      onClick={() => toggleCommentLike(c.id, c.liked)}
                      className={`flex items-center gap-1 text-xs transition-colors ${c.liked ? "text-red-400" : "text-stone-700 hover:text-red-400"}`}
                    >
                      <span>{c.liked ? "♥" : "♡"}</span>
                      {c.likeCount > 0 && <span>{c.likeCount}</span>}
                    </button>
                  {c.user_id === userId && editingId !== c.id && (
                    <div className="flex gap-1.5 items-center">
                      <button onClick={() => { setEditingId(c.id); setEditingText(c.content); setConfirmDeleteId(null); }}
                        className="text-stone-700 hover:text-stone-400 text-xs transition-colors">Edit</button>
                      {confirmDeleteId === c.id ? (
                        <>
                          <button onClick={async () => {
                            setComments(prev => prev.filter(x => x.id !== c.id));
                            await supabase.from("poll_comments").delete().eq("id", c.id).eq("user_id", userId);
                            setConfirmDeleteId(null);
                          }} className="text-red-400 text-xs font-semibold">Confirm</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-stone-600 text-xs">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(c.id)} className="text-stone-700 hover:text-red-400 text-xs transition-colors">Delete</button>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={postComment} className="flex gap-2.5 items-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-text)] flex-shrink-0">
              {username[0]?.toUpperCase()}
            </div>
            <input
              ref={commentRef}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={200}
              className="flex-1 bg-stone-800 border border-stone-700/50 rounded-xl px-3 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button type="submit" disabled={posting || !comment.trim()}
              className="text-[var(--accent)] text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

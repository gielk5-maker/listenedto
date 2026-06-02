"use client";

import { useState, useTransition } from "react";
import Sterren from "@/components/Sterren";
import Link from "next/link";
import AlbumCover from "@/components/AlbumCover";
import { toggleLike, toggleCommentLike, plaatsComment } from "@/app/actions/sociale";

type Comment = {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  likeCount: number;
  liked: boolean;
};

type Props = {
  r: {
    id: string;
    user_id: string;
    album_name: string;
    artist_name: string;
    album_image: string | null;
    album_url: string | null;
    rating: number;
    review: string | null;
    moment_wanneer: string | null;
    moment_waar: string | null;
    created_at: string;
  };
  vriendUsername: string;
  eigenUserId: string;
  eigenUsername: string;
  eigenRating: number | null;
  likeCount: number;
  liked: boolean;
  comments: Comment[];
};



export default function FeedKaart({ r, vriendUsername, eigenUserId, eigenUsername, eigenRating, likeCount: initLikes, liked: initLiked, comments: initComments }: Props) {
  const [liked, setLiked] = useState(initLiked);
  const [likeCount, setLikeCount] = useState(initLikes);
  const [comments, setComments] = useState<Comment[]>(initComments);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [, startTransition] = useTransition();

  function handleLike() {
    setLiked((v) => !v);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    startTransition(() => toggleLike(r.id));
  }

  function handleCommentLike(commentId: string, wasLiked: boolean) {
    setComments((prev) => prev.map((c) =>
      c.id === commentId
        ? { ...c, liked: !wasLiked, likeCount: wasLiked ? c.likeCount - 1 : c.likeCount + 1 }
        : c
    ));
    startTransition(() => toggleCommentLike(commentId));
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const tekst = commentText.trim();
    setCommentText("");
    const nieuw: Comment = {
      id: `temp-${Date.now()}`,
      user_id: eigenUserId,
      username: eigenUsername,
      content: tekst,
      created_at: new Date().toISOString(),
      likeCount: 0,
      liked: false,
    };
    setComments((prev) => [...prev, nieuw]);
    startTransition(() => plaatsComment(r.id, tekst));
  }

  const albumHref = `/album?name=${encodeURIComponent(r.album_name)}&artist=${encodeURIComponent(r.artist_name)}${r.album_image ? `&image=${encodeURIComponent(r.album_image)}` : ""}${r.album_url ? `&url=${encodeURIComponent(r.album_url)}` : ""}`;

  return (
    <div className="bg-stone-900 rounded-3xl overflow-hidden border border-stone-800/50">
      {/* Who */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Link href={`/user/${vriendUsername}`}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-xs font-bold text-[var(--accent-text)] hover:opacity-80 transition-opacity flex-shrink-0 shadow shadow-black/25">
          {vriendUsername[0]?.toUpperCase()}
        </Link>
        <Link href={`/user/${vriendUsername}`} className="text-sm font-semibold hover:text-[var(--accent)] transition-colors">
          {vriendUsername}
        </Link>
        <span className="text-stone-700 text-xs ml-auto">
          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Album */}
      <Link href={albumHref} className="flex gap-3 px-4 pb-4 hover:opacity-80 transition-opacity">
        <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-stone-800 shadow-lg">
          <AlbumCover src={r.album_image} alt={r.album_name} width={64} height={64} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="font-semibold truncate text-stone-100">{r.album_name}</p>
          <p className="text-stone-500 text-sm truncate">{r.artist_name}</p>
          <div className="mt-1"><Sterren rating={r.rating} /></div>
        </div>
      </Link>

      {r.review && (
        <div className="px-4 pb-4 border-t border-stone-800/60 pt-3">
          <p className="text-stone-400 text-sm leading-relaxed italic">"{r.review}"</p>
        </div>
      )}

      {(r.moment_wanneer || r.moment_waar) && (
        <div className="px-4 pb-3 flex gap-4 text-xs text-stone-600">
          {r.moment_wanneer && <span>🕐 {r.moment_wanneer}</span>}
          {r.moment_waar && <span>📍 {r.moment_waar}</span>}
        </div>
      )}

      {/* Rating comparison */}
      {eigenRating != null && (
        <div className="mx-4 mb-3 bg-stone-800/60 rounded-2xl px-4 py-2.5 flex items-center gap-3 border border-stone-700/40">
          <span className="text-xs text-stone-500">You rated this</span>
          <Sterren rating={eigenRating} />
          <span className="ml-auto text-xs">
            {eigenRating > r.rating
              ? <span className="text-[var(--accent)]">You liked it more ↑</span>
              : eigenRating < r.rating
              ? <span className="text-stone-500">You liked it less ↓</span>
              : <span className="text-stone-400">Same taste ✓</span>}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-4 border-t border-stone-800/40 pt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-400" : "text-stone-600 hover:text-red-400"}`}
        >
          <span className="text-base">{liked ? "♥" : "♡"}</span>
          {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
        </button>
        <button
          onClick={() => setCommentOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${commentOpen ? "text-[var(--accent)]" : "text-stone-600 hover:text-stone-300"}`}
        >
          <span className="text-base">💬</span>
          {comments.length > 0 && <span className="text-xs">{comments.length}</span>}
        </button>
      </div>

      {/* Comments */}
      {commentOpen && (
        <div className="border-t border-stone-800/40">
          {comments.length > 0 && (
            <div className="px-4 pt-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Link href={`/user/${c.username}`}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-text)] flex-shrink-0 mt-0.5">
                    {c.username[0]?.toUpperCase()}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <Link href={`/user/${c.username}`} className="text-xs font-semibold text-stone-300 hover:text-[var(--accent)] transition-colors">
                        {c.username}
                      </Link>
                      <span className="text-stone-700 text-[10px]">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm text-stone-400 mt-0.5">{c.content}</p>
                  </div>
                  <button
                    onClick={() => handleCommentLike(c.id, c.liked)}
                    className={`flex items-center gap-1 text-xs flex-shrink-0 mt-1 transition-colors ${c.liked ? "text-red-400" : "text-stone-700 hover:text-red-400"}`}
                  >
                    <span>{c.liked ? "♥" : "♡"}</span>
                    {c.likeCount > 0 && <span>{c.likeCount}</span>}
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleComment} className="px-4 py-3 flex gap-2.5 items-center">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-text)] flex-shrink-0">
              {eigenUsername[0]?.toUpperCase()}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-stone-800 border border-stone-700/50 rounded-xl px-3 py-1.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="text-[var(--accent)] text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

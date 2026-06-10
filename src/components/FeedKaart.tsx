"use client";

import { useState, useTransition } from "react";
import Sterren from "@/components/Sterren";
import Link from "next/link";
import AlbumCover from "@/components/AlbumCover";
import { toggleLike, toggleCommentLike, plaatsComment, verwijderComment, bewerkComment } from "@/app/actions/social";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/verified";

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
    listened_at: string | null;
  };
  vriendUsername: string;
  vriendVerified?: boolean;
  eigenUserId: string;
  eigenUsername: string;
  eigenRating: number | null;
  likeCount: number;
  liked: boolean;
  comments: Comment[];
};



export default function FeedKaart({ r, vriendUsername, vriendVerified, eigenUserId, eigenUsername, eigenRating, likeCount: initLikes, liked: initLiked, comments: initComments }: Props) {
  const [liked, setLiked] = useState(initLiked);
  const [likeCount, setLikeCount] = useState(initLikes);
  const [comments, setComments] = useState<Comment[]>(initComments);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
        <Link href={`/user/${vriendUsername}`} className="flex items-center gap-1 text-sm font-semibold hover:text-[var(--accent)] transition-colors">
          {vriendUsername}
          {vriendVerified && <VerifiedBadge className="w-3.5 h-3.5 flex-shrink-0" />}
        </Link>
        <span className="text-stone-700 text-xs ml-auto">
          {new Date(r.listened_at ? r.listened_at + "T00:00:00" : r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
        <Link href={`/review/${r.id}`} className="text-stone-700 hover:text-stone-400 transition-colors" title="View review">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
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
                      <Link href={`/user/${c.username}`} className="flex items-center gap-1 text-xs font-semibold text-stone-300 hover:text-[var(--accent)] transition-colors">
                        {c.username}
                        {isVerified(c.username) && <VerifiedBadge className="w-3 h-3 flex-shrink-0" />}
                      </Link>
                      <span className="text-stone-700 text-[10px]">
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {editingCommentId === c.id ? (
                      <form onSubmit={e => {
                        e.preventDefault();
                        if (!editingText.trim()) return;
                        setComments(prev => prev.map(x => x.id === c.id ? { ...x, content: editingText.trim() } : x));
                        startTransition(() => bewerkComment(c.id, editingText.trim()));
                        setEditingCommentId(null);
                      }} className="flex gap-1.5 mt-1">
                        <input
                          autoFocus
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          className="flex-1 bg-stone-800 border border-stone-700/50 rounded-lg px-2 py-1 text-sm text-stone-200 focus:outline-none focus:border-[var(--accent)]"
                        />
                        <button type="submit" className="text-[var(--accent)] text-xs font-semibold">Save</button>
                        <button type="button" onClick={() => setEditingCommentId(null)} className="text-stone-600 text-xs">Cancel</button>
                      </form>
                    ) : (
                      <p className="text-sm text-stone-400 mt-0.5">{c.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    {c.user_id === eigenUserId && editingCommentId !== c.id && (
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => { setEditingCommentId(c.id); setEditingText(c.content); setConfirmDeleteId(null); }}
                          className="text-stone-700 hover:text-stone-400 text-xs transition-colors">Edit</button>
                        {confirmDeleteId === c.id ? (
                          <>
                            <button onClick={() => {
                              setComments(prev => prev.filter(x => x.id !== c.id));
                              startTransition(() => verwijderComment(c.id));
                              setConfirmDeleteId(null);
                            }} className="text-red-400 text-xs font-semibold">Confirm</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-stone-600 text-xs">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(c.id)} className="text-stone-700 hover:text-red-400 text-xs transition-colors">Delete</button>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleCommentLike(c.id, c.liked)}
                      className={`flex items-center gap-1 text-xs transition-colors ${c.liked ? "text-red-400" : "text-stone-700 hover:text-red-400"}`}
                    >
                      <span>{c.liked ? "♥" : "♡"}</span>
                      {c.likeCount > 0 && <span>{c.likeCount}</span>}
                    </button>
                  </div>
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

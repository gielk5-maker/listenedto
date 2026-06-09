"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: "like" | "comment";
  actor: string;
  albumName: string;
  albumArtist: string;
  preview?: string;
  createdAt: string;
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const lastSeenKey = `lt-notifs-seen-${userId}`;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get user's ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select("id, album_name, artist_name")
        .eq("user_id", userId);
      if (!ratings || ratings.length === 0) { setLoading(false); return; }

      const ratingIds = ratings.map(r => r.id);
      const ratingMap: Record<string, { album_name: string; artist_name: string }> = {};
      ratings.forEach(r => { ratingMap[r.id] = { album_name: r.album_name, artist_name: r.artist_name }; });

      // Fetch likes and comments in parallel
      const [{ data: likes }, { data: comments }] = await Promise.all([
        supabase.from("likes")
          .select("id, user_id, rating_id, created_at")
          .in("rating_id", ratingIds)
          .neq("user_id", userId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("comments")
          .select("id, user_id, rating_id, content, created_at")
          .in("rating_id", ratingIds)
          .neq("user_id", userId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      // Get actor usernames
      const actorIds = [...new Set([
        ...(likes ?? []).map(l => l.user_id),
        ...(comments ?? []).map(c => c.user_id),
      ])];
      const { data: profiles } = actorIds.length > 0
        ? await supabase.from("profiles").select("id, username").in("id", actorIds)
        : { data: [] };
      const profileMap: Record<string, string> = {};
      (profiles ?? []).forEach(p => { profileMap[p.id] = p.username; });

      const all: Notif[] = [
        ...(likes ?? []).map(l => ({
          id: `like-${l.id}`,
          type: "like" as const,
          actor: profileMap[l.user_id] ?? "Someone",
          albumName: ratingMap[l.rating_id]?.album_name ?? "",
          albumArtist: ratingMap[l.rating_id]?.artist_name ?? "",
          createdAt: l.created_at,
        })),
        ...(comments ?? []).map(c => ({
          id: `comment-${c.id}`,
          type: "comment" as const,
          actor: profileMap[c.user_id] ?? "Someone",
          albumName: ratingMap[c.rating_id]?.album_name ?? "",
          albumArtist: ratingMap[c.rating_id]?.artist_name ?? "",
          preview: c.content,
          createdAt: c.created_at,
        })),
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);

      setNotifs(all);

      const lastSeen = localStorage.getItem(lastSeenKey) ?? "0";
      const unseen = all.filter(n => n.createdAt > lastSeen).length;
      setUnread(unseen);
      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) {
      localStorage.setItem(lastSeenKey, new Date().toISOString());
      setUnread(0);
    }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-800 transition-colors text-stone-400 hover:text-stone-200"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--accent)] rounded-full text-[10px] font-bold text-[var(--accent-text)] flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-stone-900 border border-stone-700/60 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-800">
            <p className="text-sm font-semibold text-stone-200">Notifications</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 text-center text-stone-600 text-sm">No notifications yet.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-stone-800/60">
              {notifs.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-stone-800/50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5 flex-shrink-0">
                      {n.type === "like" ? "❤️" : "💬"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-200 leading-snug">
                        <Link href={`/user/${n.actor}`} className="font-semibold hover:text-[var(--accent)] transition-colors">
                          {n.actor}
                        </Link>
                        {n.type === "like" ? " liked your review of " : " commented on "}
                        <span className="font-medium text-stone-300">{n.albumName}</span>
                      </p>
                      {n.preview && (
                        <p className="text-xs text-stone-500 mt-0.5 truncate">"{n.preview}"</p>
                      )}
                      <p className="text-[11px] text-stone-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

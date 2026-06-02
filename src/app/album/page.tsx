"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Logo from "@/components/Logo";
import { useSearchParams, useRouter } from "next/navigation";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Listen = {
  id: string;
  listen_number: number;
  rating: number | null;
  review: string | null;
  listened_at: string | null;
  created_at: string;
};

type CommunityReview = {
  username: string;
  rating: number | null;
  review: string | null;
  listened_at: string | null;
  created_at: string;
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = display >= star;
        const half = !full && display >= star - 0.5;
        return (
          <div key={star} className="relative w-10 h-10 cursor-pointer select-none" onMouseLeave={() => setHover(null)}>
            <div className="absolute left-0 top-0 w-1/2 h-full z-10" onMouseEnter={() => setHover(star - 0.5)} onClick={() => onChange(star - 0.5)} />
            <div className="absolute right-0 top-0 w-1/2 h-full z-10" onMouseEnter={() => setHover(star)} onClick={() => onChange(star)} />
            <span className="text-4xl leading-none text-stone-700">★</span>
            {(full || half) && (
              <span className="absolute inset-0 text-4xl leading-none text-[var(--accent)] overflow-hidden" style={{ width: full ? "100%" : "50%" }}>★</span>
            )}
          </div>
        );
      })}
      {value > 0 && <span className="text-stone-400 text-sm self-center ml-2">{value}/5</span>}
    </div>
  );
}

function SmallStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const full = rating >= star;
        const half = !full && rating >= star - 0.5;
        return (
          <span key={star} className="relative inline-block text-xs leading-none">
            <span className="text-stone-700">★</span>
            {(full || half) && (
              <span className="absolute inset-0 overflow-hidden text-[var(--accent)]" style={{ width: full ? "100%" : "50%" }}>★</span>
            )}
          </span>
        );
      })}
      <span className="text-stone-600 text-xs ml-1">{rating}</span>
    </div>
  );
}

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const d = new Date(value + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(value + "T00:00:00");

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const blanks = (firstDay + 6) % 7;

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  }
  function nextMonth() {
    const next = view.month === 11 ? { year: view.year + 1, month: 0 } : { ...view, month: view.month + 1 };
    const firstOfNext = new Date(next.year, next.month, 1);
    if (firstOfNext <= today) setView(next);
  }

  function selectDay(day: number) {
    const d = new Date(view.year, view.month, day);
    if (d > today) return;
    const iso = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  const isNextDisabled = new Date(view.year, view.month + 1, 1) > today;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 flex items-center justify-between hover:border-stone-600 transition-colors">
        <span className="text-stone-50 text-sm">
          {selected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </span>
        <svg className="w-4 h-4 text-stone-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-stone-900 border border-stone-700/60 rounded-2xl p-4 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-stone-200">{monthNames[view.month]} {view.year}</span>
            <button type="button" onClick={nextMonth} disabled={isNextDisabled}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
              <div key={d} className="text-center text-[10px] text-stone-600 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const d = new Date(view.year, view.month, day);
              const isSelected = d.getTime() === selected.getTime();
              const isToday = d.getTime() === today.getTime();
              const isFuture = d > today;
              return (
                <button key={day} type="button" onClick={() => selectDay(day)} disabled={isFuture}
                  className={`text-xs h-8 w-full rounded-lg font-medium transition-colors
                    ${isSelected ? "bg-[var(--accent)] text-[var(--accent-text)]" : ""}
                    ${!isSelected && isToday ? "text-[var(--accent)] font-bold" : ""}
                    ${!isSelected && !isFuture ? "hover:bg-stone-800 text-stone-300" : ""}
                    ${isFuture ? "text-stone-700 cursor-not-allowed" : ""}
                  `}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AlbumPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const name = params.get("name") ?? "";
  const artist = params.get("artist") ?? "";
  const image = params.get("image") ?? null;
  const mbid = params.get("mbid") ?? null;
  const url = params.get("url") ?? null;
  const type = (params.get("type") ?? "album") as "album" | "track";

  const [listens, setListens] = useState<Listen[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [listenedAt, setListenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [communityReviews, setCommunityReviews] = useState<CommunityReview[]>([]);
  const [communityStats, setCommunityStats] = useState<{ avg: number; total: number } | null>(null);

  useEffect(() => {
    // Reset all state when album changes
    setListens([]);
    setLoaded(false);
    setShowForm(false);
    setEditingId(null);
    setRating(0);
    setReview("");
    setCommunityReviews([]);
    setCommunityStats(null);

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setLoaded(true);

      // Fetch own listens + all community ratings in parallel
      const [ownResult, communityResult] = await Promise.all([
        user ? supabase
          .from("ratings")
          .select("id, listen_number, rating, review, listened_at, created_at")
          .eq("user_id", user.id)
          .eq("album_name", name)
          .eq("artist_name", artist)
          .order("listened_at", { ascending: true })
          .order("created_at", { ascending: true }) : Promise.resolve({ data: [] }),
        supabase
          .from("ratings")
          .select("rating, review, listened_at, created_at, user_id")
          .eq("album_name", name)
          .eq("artist_name", artist),
      ]);

      const existing = ownResult.data ?? [];
      setListens(existing);

      // Community stats
      const allRatings = communityResult.data ?? [];
      const withRating = allRatings.filter(r => r.rating != null);
      if (withRating.length > 0) {
        const avg = Math.round((withRating.reduce((s, r) => s + r.rating, 0) / withRating.length) * 10) / 10;
        setCommunityStats({ avg, total: allRatings.length });
      } else if (allRatings.length > 0) {
        setCommunityStats({ avg: 0, total: allRatings.length });
      }

      // Community reviews: fetch usernames for entries with a review
      const withReview = allRatings.filter(r => r.review && (!user || r.user_id !== user.id));
      if (withReview.length > 0) {
        const userIds = [...new Set(withReview.map(r => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
        const profileMap: Record<string, string> = {};
        profiles?.forEach(p => { profileMap[p.id] = p.username; });
        setCommunityReviews(withReview.map(r => ({
          username: profileMap[r.user_id] ?? "?",
          rating: r.rating,
          review: r.review,
          listened_at: r.listened_at,
          created_at: r.created_at,
        })).sort((a, b) => (b.listened_at ?? b.created_at).localeCompare(a.listened_at ?? a.created_at)));
      }
    }
    load();
  }, [name, artist]);

  function startEdit(listen: Listen) {
    setEditingId(listen.id);
    setRating(listen.rating ?? 0);
    setReview(listen.review ?? "");
    setListenedAt(listen.listened_at ?? listen.created_at.slice(0, 10));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNewListen() {
    setEditingId(null);
    setRating(0);
    setReview("");
    setListenedAt(new Date().toISOString().slice(0, 10));
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    if (editingId) {
      const { error } = await supabase.from("ratings")
        .update({ rating: rating || null, review: review || null, listened_at: listenedAt })
        .eq("id", editingId);
      if (error) { setError(error.message); setSaving(false); return; }
      setListens(prev => prev.map(l => l.id === editingId ? { ...l, rating: rating || null, review: review || null, listened_at: listenedAt } : l).sort((a, b) => (a.listened_at ?? a.created_at).localeCompare(b.listened_at ?? b.created_at)));
    } else {
      const nextNumber = listens.length + 1;
      const { data, error } = await supabase.from("ratings").insert({
        user_id: user.id, type, album_name: name, artist_name: artist,
        album_image: image, album_mbid: mbid, album_url: url,
        rating: rating || null, review: review || null,
        listen_number: nextNumber, listened_at: listenedAt,
      }).select("id, listen_number, rating, review, listened_at, created_at").single();
      // Note: run SQL first → alter table ratings add column if not exists listen_number integer not null default 1;
      if (error) { setError(error.message); setSaving(false); return; }
      if (data) setListens(prev => [...prev, data].sort((a, b) => (a.listened_at ?? a.created_at).localeCompare(b.listened_at ?? b.created_at)));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.push("/feed");
    }, 800);
  }

  async function deleteListen(id: string) {
    await supabase.from("ratings").delete().eq("id", id);
    const updated = listens.filter(l => l.id !== id);
    if (updated.length === 0) {
      router.back();
    } else {
      setListens(updated);
      if (editingId === id) { setShowForm(false); setEditingId(null); }
    }
  }

  const currentListenNumber = editingId
    ? (listens.find(l => l.id === editingId)?.listen_number ?? 1)
    : listens.length + 1;

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/search" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Back</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10 space-y-6">
        {/* Album header */}
        <div className="flex gap-5">
          <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-stone-800 shadow-2xl shadow-black/60">
            <AlbumCover src={image} alt={name} width={128} height={128} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col justify-end pb-1 gap-2">
            <p className="text-stone-500 text-xs uppercase tracking-widest">{type === "track" ? "Track" : "Album"}</p>
            <h1 className="text-2xl font-bold leading-tight text-stone-50">{name}</h1>
            <p className="text-stone-400 font-medium">{artist}</p>
            {!showForm && (
              <button
                onClick={startNewListen}
                className="mt-1 self-start bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-xl px-4 py-2 text-sm transition-opacity"
              >
                {listens.length > 0 ? "+ Log another listen" : "Log this album"}
              </button>
            )}
          </div>
        </div>

        {/* Rating form */}
        {loaded && showForm && (
          <div className="bg-stone-900 rounded-3xl p-6 space-y-5 border border-stone-800/60">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-300">
                {ordinal(currentListenNumber)} listen
              </h2>
              {listens.length > 0 && (
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-stone-600 hover:text-stone-400 text-xs transition-colors">
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-widest mb-1.5">Date listened</label>
              <DatePicker value={listenedAt} onChange={setListenedAt} />
            </div>

            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-widest mb-3">Rating</label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-widest mb-2">
                Review <span className="normal-case text-stone-700">(optional)</span>
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder="What do you think of this album?"
                className="w-full bg-stone-800 border border-stone-700/60 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none text-sm"
              />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-2xl px-4 py-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-4 py-3 transition-opacity"
              >
                {saved ? "Saved ✓" : saving ? "Saving..." : editingId ? "Update" : "Save"}
              </button>
              {editingId && (
                <button onClick={() => deleteListen(editingId)} className="px-4 py-3 text-stone-500 hover:text-red-400 bg-stone-800 hover:bg-stone-700 rounded-2xl transition-colors text-sm">
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Listen history */}
        {listens.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold">
                {listens.length} {listens.length === 1 ? "listen" : "listens"}
              </h2>
            </div>
            <div className="space-y-2">
              {listens.map((listen) => (
                <div key={listen.id} className="bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-800/40 flex items-start gap-4 group">
                  <div className="flex-shrink-0 text-center min-w-[52px]">
                    <p className="text-[var(--accent)] text-xs font-bold">{ordinal(listen.listen_number)}</p>
                    <p className="text-stone-700 text-[10px] mt-0.5">{new Date(listen.listened_at ?? listen.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {listen.rating && <SmallStars rating={listen.rating} />}
                    {listen.review && <p className="text-stone-400 text-sm mt-1 italic">"{listen.review}"</p>}
                    {!listen.rating && !listen.review && <p className="text-stone-700 text-sm italic">No rating or review</p>}
                  </div>
                  <button
                    onClick={() => startEdit(listen)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community stats + reviews */}
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-800/40 flex items-center gap-6">
            <div>
              <p className="text-[10px] text-stone-600 uppercase tracking-widest mb-0.5">Avg. rating</p>
              {communityStats
                ? <p className="text-[var(--accent)] font-bold text-lg">{communityStats.avg > 0 ? `★ ${communityStats.avg}` : "—"}</p>
                : <div className="h-6 w-10 bg-stone-800 rounded animate-pulse mt-0.5" />
              }
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div>
              <p className="text-[10px] text-stone-600 uppercase tracking-widest mb-0.5">Total listens</p>
              {communityStats
                ? <p className="text-stone-200 font-bold text-lg">{communityStats.total}</p>
                : <div className="h-6 w-8 bg-stone-800 rounded animate-pulse mt-0.5" />
              }
            </div>
          </div>

          {/* Reviews from others */}
          <div>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-3">Reviews</h2>
            {!loaded ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-800/40 space-y-2">
                    <div className="h-3 w-24 bg-stone-800 rounded animate-pulse" />
                    <div className="h-3 w-full bg-stone-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : communityReviews.length > 0 ? (
              <div className="space-y-2">
                {communityReviews.map((r, i) => (
                  <div key={i} className="bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <Link href={`/user/${r.username}`} className="text-sm font-semibold text-stone-300 hover:text-white transition-colors">
                        {r.username}
                      </Link>
                      <div className="flex items-center gap-2">
                        {r.rating && <SmallStars rating={r.rating} />}
                        <span className="text-stone-700 text-[10px]">
                          {new Date(r.listened_at ? r.listened_at + "T00:00:00" : r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <p className="text-stone-400 text-sm italic">"{r.review}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-700 text-sm">No reviews yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AlbumPage() {
  return <Suspense><AlbumPageInner /></Suspense>;
}

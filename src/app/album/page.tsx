"use client";

import { useState, useEffect, Suspense } from "react";
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setLoaded(true);
      if (!user) { setShowForm(true); return; }
      const { data } = await supabase
        .from("ratings")
        .select("id, listen_number, rating, review, created_at")
        .eq("user_id", user.id)
        .eq("album_name", name)
        .eq("artist_name", artist)
        .order("listen_number", { ascending: true });
      const existing = data ?? [];
      setListens(existing);
      if (existing.length === 0) setShowForm(true);
    }
    load();
  }, [name, artist]);

  function startEdit(listen: Listen) {
    setEditingId(listen.id);
    setRating(listen.rating ?? 0);
    setReview(listen.review ?? "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNewListen() {
    setEditingId(null);
    setRating(0);
    setReview("");
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    if (editingId) {
      const { error } = await supabase.from("ratings")
        .update({ rating: rating || null, review: review || null })
        .eq("id", editingId);
      if (error) { setError(error.message); setSaving(false); return; }
      setListens(prev => prev.map(l => l.id === editingId ? { ...l, rating: rating || null, review: review || null } : l));
    } else {
      const nextNumber = listens.length + 1;
      const { data, error } = await supabase.from("ratings").insert({
        user_id: user.id, type, album_name: name, artist_name: artist,
        album_image: image, album_mbid: mbid, album_url: url,
        rating: rating || null, review: review || null,
        listen_number: nextNumber,
      }).select("id, listen_number, rating, review, created_at").single();
      if (error) { setError(error.message); setSaving(false); return; }
      if (data) setListens(prev => [...prev, data]);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(listens.length === 0 && !editingId ? false : false);
      setEditingId(null);
    }, 1200);
  }

  async function deleteListen(id: string) {
    await supabase.from("ratings").delete().eq("id", id);
    setListens(prev => {
      const updated = prev.filter(l => l.id !== id);
      if (updated.length === 0) setShowForm(true);
      return updated;
    });
    if (editingId === id) { setShowForm(false); setEditingId(null); }
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
        <Link href="/zoeken" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Back</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10 space-y-6">
        {/* Album header */}
        <div className="flex gap-5">
          <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-stone-800 shadow-2xl shadow-black/60">
            <AlbumCover src={image} alt={name} width={128} height={128} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <p className="text-stone-500 text-xs uppercase tracking-widest mb-1.5">{type === "track" ? "Track" : "Album"}</p>
            <h1 className="text-2xl font-bold leading-tight text-stone-50">{name}</h1>
            <p className="text-stone-400 mt-1.5 font-medium">{artist}</p>
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
              {!showForm && (
                <button onClick={startNewListen} className="text-xs text-[var(--accent)] font-medium hover:opacity-80 transition-opacity">
                  + Log another listen
                </button>
              )}
            </div>
            <div className="space-y-2">
              {[...listens].reverse().map((listen) => (
                <div key={listen.id} className="bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-800/40 flex items-start gap-4 group">
                  <div className="flex-shrink-0 text-center min-w-[52px]">
                    <p className="text-[var(--accent)] text-xs font-bold">{ordinal(listen.listen_number)}</p>
                    <p className="text-stone-700 text-[10px] mt-0.5">{new Date(listen.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {listen.rating && <SmallStars rating={listen.rating} />}
                    {listen.review && <p className="text-stone-400 text-sm mt-1 italic">"{listen.review}"</p>}
                    {!listen.rating && !listen.review && <p className="text-stone-700 text-sm italic">No rating or review</p>}
                  </div>
                  <button
                    onClick={() => startEdit(listen)}
                    className="text-stone-700 hover:text-[var(--accent)] text-xs transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AlbumPage() {
  return <Suspense><AlbumPageInner /></Suspense>;
}

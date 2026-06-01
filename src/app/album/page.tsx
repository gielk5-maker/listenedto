"use client";

import { useState, useEffect, Suspense } from "react";
import Logo from "@/components/Logo";
import { useSearchParams, useRouter } from "next/navigation";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
            {/* Click zones */}
            <div className="absolute left-0 top-0 w-1/2 h-full z-10" onMouseEnter={() => setHover(star - 0.5)} onClick={() => onChange(star - 0.5)} />
            <div className="absolute right-0 top-0 w-1/2 h-full z-10" onMouseEnter={() => setHover(star)} onClick={() => onChange(star)} />
            {/* Star visual */}
            <span className="text-4xl leading-none text-stone-700">★</span>
            {(full || half) && (
              <span
                className="absolute inset-0 text-4xl leading-none text-[var(--accent)] overflow-hidden"
                style={{ width: full ? "100%" : "50%" }}
              >
                ★
              </span>
            )}
          </div>
        );
      })}
      {value > 0 && <span className="text-stone-400 text-sm self-center ml-2">{value}/5</span>}
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

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [momentWanneer, setMomentWanneer] = useState("");
  const [momentWaar, setMomentWaar] = useState("");
  const [momentBijzonder, setMomentBijzonder] = useState("");
  const [toonMoment, setToonMoment] = useState(false);
  const [bestaandeRating, setBestaandeRating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExisting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("ratings").select("*")
        .eq("user_id", user.id).eq("album_name", name).eq("artist_name", artist).eq("type", type)
        .maybeSingle();
      if (data) {
        setBestaandeRating(data.id);
        setRating(data.rating);
        setReview(data.review ?? "");
        setMomentWanneer(data.moment_wanneer ?? "");
        setMomentWaar(data.moment_waar ?? "");
        setMomentBijzonder(data.moment_bijzonder ?? "");
        if (data.moment_wanneer || data.moment_waar || data.moment_bijzonder) setToonMoment(true);
      }
    }
    loadExisting();
  }, [name, artist]);

  async function save() {
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const ratingData = {
      user_id: user.id, type, album_name: name, artist_name: artist,
      album_image: image, album_mbid: mbid, album_url: url, rating,
      review: review || null,
      moment_wanneer: momentWanneer || null,
      moment_waar: momentWaar || null,
      moment_bijzonder: momentBijzonder || null,
    };

    let err = null;
    if (bestaandeRating) {
      const { error } = await supabase.from("ratings").update(ratingData).eq("id", bestaandeRating);
      err = error?.message ?? null;
    } else {
      const { data, error } = await supabase.from("ratings").insert(ratingData).select("id").single();
      if (data) setBestaandeRating(data.id);
      err = error?.message ?? null;
    }

    setSaving(false);
    if (err) { setError(err); } else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function remove() {
    if (!bestaandeRating) return;
    await supabase.from("ratings").delete().eq("id", bestaandeRating);
    setRating(0); setReview(""); setMomentWanneer(""); setMomentWaar(""); setMomentBijzonder("");
    setBestaandeRating(null);
  }

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/zoeken" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Back</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10">
        <div className="flex gap-5 mb-8">
          <div className="w-32 h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-stone-800 shadow-2xl shadow-black/60">
            <AlbumCover src={image} alt={name} width={128} height={128} className="object-cover w-full h-full" />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <p className="text-stone-500 text-xs uppercase tracking-widest mb-1.5">{type === "track" ? "Track" : "Album"}</p>
            <h1 className="text-2xl font-bold leading-tight text-stone-50">{name}</h1>
            <p className="text-stone-400 mt-1.5 font-medium">{artist}</p>
          </div>
        </div>

        <div className="bg-stone-900 rounded-3xl p-6 space-y-6 border border-stone-800/60">
          <div>
            <label className="block text-xs text-stone-500 uppercase tracking-widest mb-3">Your rating</label>
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

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-2xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={rating === 0 || saving}
              className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-4 py-3 transition-colors"
            >
              {saved ? "Saved ✓" : saving ? "Saving..." : bestaandeRating ? "Update" : "Save"}
            </button>
            {bestaandeRating && (
              <button onClick={remove} className="px-4 py-3 text-stone-500 hover:text-red-400 bg-stone-800 hover:bg-stone-700 rounded-2xl transition-colors text-sm">
                Delete
              </button>
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

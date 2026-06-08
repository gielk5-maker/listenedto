"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { logConcert } from "@/app/actions/concert";
import DatePicker from "@/components/DatePicker";

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

function LoggenInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [artist, setArtist] = useState(params.get("artist") ?? "");
  const [venue, setVenue] = useState(params.get("venue") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [country, setCountry] = useState(params.get("country") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!artist.trim() || !city.trim() || !country.trim() || !date) {
      setError("Please fill in artist, city, country and date.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await logConcert({ artist_name: artist, venue, city, country, concert_date: date, rating, review });
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    router.push(`/concert/${result.id}`);
  }

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-8">Log a concert</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-stone-900 rounded-3xl p-6 space-y-4 border border-stone-800/60">
            <h2 className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Concert details</h2>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Artist *</label>
              <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g. Radiohead"
                className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-500 mb-1.5">City *</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Amsterdam"
                  className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1.5">Country *</label>
                <input value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Netherlands"
                  className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Venue</label>
              <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Ziggo Dome"
                className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Date *</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
          </div>

          <div className="bg-stone-900 rounded-3xl p-6 space-y-4 border border-stone-800/60">
            <h2 className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Your review</h2>

            <div>
              <label className="block text-xs text-stone-500 mb-3">Rating <span className="text-stone-700 normal-case">(optional)</span></label>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Review <span className="text-stone-700 normal-case">(optional)</span></label>
              <textarea value={review} onChange={e => setReview(e.target.value)} rows={4}
                placeholder="How was the concert? What stood out?"
                className="w-full bg-stone-800 border border-stone-700/60 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none text-sm" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-2xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-4 py-3.5 transition-opacity">
            {saving ? "Saving..." : "Log concert"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function LoggenPage() {
  return <Suspense><LoggenInner /></Suspense>;
}

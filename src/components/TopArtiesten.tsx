"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Artiest = {
  naam: string;
  count: number;
  totalRating: number;
};

type Props = {
  artiesten: Artiest[];
};

export default function TopArtiesten({ artiesten }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [images, setImages] = useState<Record<string, string | null>>({});

  const visible = showAll ? artiesten : artiesten.slice(0, 5);

  useEffect(() => {
    const missing = visible.filter(a => !(a.naam in images));
    if (missing.length === 0) return;

    missing.forEach(async (a) => {
      try {
        const res = await fetch(`/api/artist-image?artist=${encodeURIComponent(a.naam)}`);
        const data = await res.json();
        setImages(prev => ({ ...prev, [a.naam]: data.image ?? null }));
      } catch {
        setImages(prev => ({ ...prev, [a.naam]: null }));
      }
    });
  }, [visible.length]);

  return (
    <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60">
      <h2 className="text-xs text-stone-600 uppercase tracking-widest mb-4 font-semibold">Most rated</h2>
      <div className="space-y-3">
        {visible.map((artiest, i) => (
          <div key={artiest.naam} className="flex items-center gap-3">
            <span className="text-stone-700 text-xs w-4 font-medium">{i + 1}</span>
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-stone-800">
              {images[artiest.naam]
                ? <img src={images[artiest.naam]!} alt={artiest.naam} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-stone-600 text-xs font-bold">
                    {artiest.naam[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/artist?name=${encodeURIComponent(artiest.naam)}`} className="text-sm font-semibold truncate text-stone-100 hover:text-[var(--accent)] transition-colors block">{artiest.naam}</Link>
              <p className="text-stone-600 text-xs">
                {artiest.count} {artiest.count === 1 ? "listen" : "listens"} · avg. {(artiest.totalRating / artiest.count).toFixed(1)} ★
              </p>
            </div>
          </div>
        ))}
      </div>
      {artiesten.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-4 w-full text-center text-xs text-stone-500 hover:text-stone-300 transition-colors py-1"
        >
          {showAll ? "Show less ↑" : `See all ${artiesten.length} artists ↓`}
        </button>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Artiest = {
  naam: string;
  count: number;
  totalRating: number;
};

export default function ArtistenGrid({ artiesten }: { artiesten: Artiest[] }) {
  const [images, setImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    artiesten.forEach(async (a) => {
      if (a.naam in images) return;
      try {
        const res = await fetch(`/api/artist-image?artist=${encodeURIComponent(a.naam)}`);
        const data = await res.json();
        setImages(prev => ({ ...prev, [a.naam]: data.image ?? null }));
      } catch {
        setImages(prev => ({ ...prev, [a.naam]: null }));
      }
    });
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4">
      {artiesten.map((artiest) => (
        <Link
          key={artiest.naam}
          href={`/artist?name=${encodeURIComponent(artiest.naam)}`}
          className="group"
        >
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-800 shadow-lg shadow-black/40 mb-2.5 group-hover:opacity-80 transition-opacity">
            {images[artiest.naam]
              ? <img src={images[artiest.naam]!} alt={artiest.naam} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-stone-500 text-3xl font-bold">
                  {artiest.naam[0]?.toUpperCase()}
                </div>
            }
          </div>
          <p className="text-stone-100 font-semibold text-sm truncate leading-tight">{artiest.naam}</p>
          <p className="text-stone-500 text-xs mt-0.5">{artiest.count} {artiest.count === 1 ? "listen" : "listens"}</p>
          <p className="text-[var(--accent)] text-xs font-bold mt-0.5">★ {(artiest.totalRating / artiest.count).toFixed(1)}</p>
        </Link>
      ))}
    </div>
  );
}

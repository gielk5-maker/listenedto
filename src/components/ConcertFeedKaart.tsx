"use client";

import Link from "next/link";
import Sterren from "@/components/Sterren";

type Props = {
  concertId: string;
  artistName: string;
  venue: string | null;
  city: string;
  country: string;
  concertDate: string;
  username: string;
  rating: number | null;
  review: string | null;
  createdAt: string;
};

export default function ConcertFeedKaart({ concertId, artistName, venue, city, country, concertDate, username, rating, review, createdAt }: Props) {
  const dateStr = new Date(concertDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800/60">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-lg flex-shrink-0">
          🎤
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/user/${username}`} className="text-sm font-semibold text-stone-200 hover:text-[var(--accent)] transition-colors">
              {username}
            </Link>
            <span className="text-stone-600 text-xs">went to</span>
            <Link href={`/concert/${concertId}`} className="text-sm font-semibold text-stone-100 hover:text-[var(--accent)] transition-colors">
              {artistName}
            </Link>
          </div>
          <p className="text-stone-500 text-xs mt-0.5">
            {dateStr} · {venue ? `${venue}, ` : ""}{city}, {country}
          </p>
          {rating && <div className="mt-1.5"><Sterren rating={rating} /></div>}
          {review && <p className="text-stone-400 text-sm mt-2 leading-relaxed italic">"{review}"</p>}
        </div>
        <span className="text-stone-700 text-xs flex-shrink-0">
          {new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}

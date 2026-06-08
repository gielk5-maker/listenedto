"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Sterren from "@/components/Sterren";
import { verwijderConcertReview } from "@/app/actions/concert";

type Review = {
  id: string;
  user_id: string;
  rating: number | null;
  review: string | null;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
};

export default function ConcertReviews({
  reviews,
  eigenUserId,
  concertId,
  artistName,
  venue,
  city,
  country,
  concertDate,
}: {
  reviews: Review[];
  eigenUserId: string | null;
  concertId: string;
  artistName: string;
  venue: string | null;
  city: string;
  country: string;
  concertDate: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
        <p className="text-stone-600">No reviews yet. Be the first!</p>
      </div>
    );
  }

  const editUrl = `/concert/log?artist=${encodeURIComponent(artistName)}&venue=${encodeURIComponent(venue ?? "")}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&date=${concertDate}`;

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const isEigen = r.user_id === eigenUserId;
        return (
          <div key={r.id} className="bg-stone-900 rounded-3xl p-5 border border-stone-800/50">
            <div className="flex items-center gap-3 mb-3">
              <Link href={`/user/${r.username}`} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {r.avatar_url ? (
                  <Image src={r.avatar_url} alt={r.username ?? ""} width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)]">
                    {r.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link href={`/user/${r.username}`} className="font-semibold text-sm hover:text-[var(--accent)] transition-colors">
                  {r.username ?? "?"}
                </Link>
                <p className="text-stone-700 text-xs">
                  {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {r.rating && <Sterren rating={r.rating} />}
              {isEigen && (
                <div className="flex items-center gap-1 ml-1">
                  <Link href={editUrl}
                    className="text-stone-600 hover:text-stone-200 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-stone-800">
                    Edit
                  </Link>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          setDeleting(true);
                          await verwijderConcertReview(concertId);
                        }}
                        disabled={deleting}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg bg-red-950/40 border border-red-900/50 transition-colors disabled:opacity-50">
                        {deleting ? "..." : "Confirm"}
                      </button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="text-stone-600 hover:text-stone-300 text-xs px-2 py-1 rounded-lg hover:bg-stone-800 transition-colors">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)}
                      className="text-stone-700 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-stone-800">
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
            {r.review && (
              <p className="text-stone-400 text-sm leading-relaxed italic">"{r.review}"</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

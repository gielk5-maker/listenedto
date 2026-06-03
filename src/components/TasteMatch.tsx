"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TasteMatch({ ownUserId, otherUserId }: { ownUserId: string; otherUserId: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [sharedArtists, setSharedArtists] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function calculate() {
      const [ownRes, otherRes] = await Promise.all([
        supabase.from("ratings").select("artist_name, album_name, rating").eq("user_id", ownUserId),
        supabase.from("ratings").select("artist_name, album_name, rating").eq("user_id", otherUserId),
      ]);

      const ownArtists = new Map<string, number[]>();
      (ownRes.data ?? []).forEach(r => {
        const key = r.artist_name.toLowerCase();
        if (!ownArtists.has(key)) ownArtists.set(key, []);
        ownArtists.get(key)!.push(r.rating);
      });

      const otherArtists = new Map<string, number[]>();
      (otherRes.data ?? []).forEach(r => {
        const key = r.artist_name.toLowerCase();
        if (!otherArtists.has(key)) otherArtists.set(key, []);
        otherArtists.get(key)!.push(r.rating);
      });

      // Find shared artists
      const shared: string[] = [];
      let ratingDiffTotal = 0;
      let sharedCount = 0;

      for (const [artist, ownRatings] of ownArtists) {
        if (otherArtists.has(artist)) {
          shared.push(artist);
          const ownAvg = ownRatings.reduce((s, r) => s + r, 0) / ownRatings.length;
          const otherRatings = otherArtists.get(artist)!;
          const otherAvg = otherRatings.reduce((s, r) => s + r, 0) / otherRatings.length;
          ratingDiffTotal += Math.abs(ownAvg - otherAvg);
          sharedCount++;
        }
      }

      if (shared.length === 0) { setScore(0); return; }

      // Base score: overlap %
      const totalUnique = new Set([...ownArtists.keys(), ...otherArtists.keys()]).size;
      const overlapPct = (shared.length / totalUnique) * 100;

      // Adjust for rating similarity (avg diff 0 = bonus, diff 5 = penalty)
      const avgDiff = sharedCount > 0 ? ratingDiffTotal / sharedCount : 0;
      const ratingBonus = Math.max(0, 1 - avgDiff / 5);
      const finalScore = Math.round(Math.min(100, overlapPct * 1.5 * (0.5 + 0.5 * ratingBonus)));

      setScore(finalScore);
      setSharedArtists(shared.slice(0, 3).map(a =>
        a.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      ));
    }
    calculate();
  }, [ownUserId, otherUserId]);

  if (score === null) return null;

  const color = score >= 70 ? "text-[var(--accent)]" : score >= 40 ? "text-yellow-400" : "text-stone-500";

  return (
    <div className="bg-stone-900 rounded-2xl px-4 py-3 border border-stone-800/40 flex items-center gap-3">
      <div className="text-center flex-shrink-0">
        <p className={`text-2xl font-bold ${color}`}>{score}%</p>
        <p className="text-[10px] text-stone-600">taste match</p>
      </div>
      {sharedArtists.length > 0 && (
        <div className="min-w-0">
          <p className="text-xs text-stone-500">Both listened to</p>
          <p className="text-stone-300 text-xs font-medium truncate">{sharedArtists.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

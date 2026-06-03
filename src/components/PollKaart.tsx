"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Poll = {
  id: string;
  question: string;
  artist_a: string;
  artist_b: string;
};

const POLLS: Poll[] = [
  { id: "jayz-vs-lilwayne", question: "Who is the better artist?", artist_a: "Jay-Z", artist_b: "Lil Wayne" },
  { id: "drake-vs-kendrick", question: "Who is the better artist?", artist_a: "Drake", artist_b: "Kendrick Lamar" },
  { id: "kanye-vs-jayz", question: "Who is the better artist?", artist_a: "Kanye West", artist_b: "Jay-Z" },
  { id: "eminem-vs-drake", question: "Who is the better artist?", artist_a: "Eminem", artist_b: "Drake" },
  { id: "kendrick-vs-jcole", question: "Who is the better artist?", artist_a: "Kendrick Lamar", artist_b: "J. Cole" },
  { id: "frank-vs-sza", question: "Who is the better artist?", artist_a: "Frank Ocean", artist_b: "SZA" },
  { id: "tyler-vs-childishgambino", question: "Who is the better artist?", artist_a: "Tyler, the Creator", artist_b: "Childish Gambino" },
  { id: "beyonce-vs-rihanna", question: "Who is the better artist?", artist_a: "Beyoncé", artist_b: "Rihanna" },
  { id: "kanye-vs-kendrick", question: "Who is the better artist?", artist_a: "Kanye West", artist_b: "Kendrick Lamar" },
  { id: "nas-vs-jayz", question: "Who is the better artist?", artist_a: "Nas", artist_b: "Jay-Z" },
];

async function fetchArtistImage(name: string): Promise<string | null> {
  try {
    const tokenRes = await fetch("/api/spotify-token");
    const { token } = await tokenRes.json();
    if (!token) return null;
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.artists?.items?.[0]?.images?.[0]?.url ?? null;
  } catch { return null; }
}

export default function PollKaart({ userId }: { userId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [imageA, setImageA] = useState<string | null>(null);
  const [imageB, setImageB] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function findEligiblePoll() {
      // Pick today's poll based on date — same poll for everyone each day
      const daysSinceEpoch = Math.floor(Date.now() / 86400000);

      const { data: ratings } = await supabase
        .from("ratings")
        .select("artist_name")
        .eq("user_id", userId);

      const listenedArtists = new Set(
        (ratings ?? []).map(r => r.artist_name.toLowerCase())
      );

      const { data: votes } = await supabase
        .from("poll_votes")
        .select("poll_id, vote")
        .eq("user_id", userId);

      const votedMap: Record<string, string> = {};
      (votes ?? []).forEach(v => { votedMap[v.poll_id] = v.vote; });

      function hasArtist(set: Set<string>, artist: string) {
        const a = artist.toLowerCase();
        for (const s of set) {
          if (s === a || s.includes(a) || a.includes(s) || s.startsWith(a.split(" ")[0])) return true;
        }
        return false;
      }

      // Try today's poll first, then scan forward for next eligible one
      for (let i = 0; i < POLLS.length; i++) {
        const p = POLLS[(daysSinceEpoch + i) % POLLS.length];
        const hasA = hasArtist(listenedArtists, p.artist_a);
        const hasB = hasArtist(listenedArtists, p.artist_b);

        if (hasA && hasB) {
          setPoll(p);

          const [imgA, imgB] = await Promise.all([
            fetchArtistImage(p.artist_a),
            fetchArtistImage(p.artist_b),
          ]);
          setImageA(imgA);
          setImageB(imgB);

          const { data: allVotes } = await supabase
            .from("poll_votes").select("vote").eq("poll_id", p.id);
          const a = (allVotes ?? []).filter(v => v.vote === "a").length;
          const b = (allVotes ?? []).filter(v => v.vote === "b").length;
          setCounts({ a, b });

          if (votedMap[p.id]) setVoted(votedMap[p.id]);
          break;
        }
      }
      setLoading(false);
    }
    findEligiblePoll();
  }, [userId]);

  async function vote(choice: "a" | "b") {
    if (!poll || voting) return;
    setVoting(true);
    await supabase.from("poll_votes").insert({ user_id: userId, poll_id: poll.id, vote: choice });
    const { data: allVotes } = await supabase.from("poll_votes").select("vote").eq("poll_id", poll.id);
    const a = (allVotes ?? []).filter(v => v.vote === "a").length;
    const b = (allVotes ?? []).filter(v => v.vote === "b").length;
    setCounts({ a, b });
    setVoted(choice);
    setVoting(false);
  }

  if (loading || !poll) return null;

  const total = counts.a + counts.b;
  const pctA = total > 0 ? Math.round((counts.a / total) * 100) : 50;
  const pctB = total > 0 ? Math.round((counts.b / total) * 100) : 50;

  return (
    <div className="bg-stone-900 rounded-3xl p-5 border border-stone-800/60 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-stone-600 uppercase tracking-widest font-semibold">Daily Poll</p>
        <p className="text-[10px] text-stone-700">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
      </div>
      <p className="text-stone-200 font-semibold mb-4">{poll.question}</p>

      {!voted ? (
        <div className="grid grid-cols-2 gap-3">
          {([
            { choice: "a" as const, name: poll.artist_a, img: imageA },
            { choice: "b" as const, name: poll.artist_b, img: imageB },
          ]).map(({ choice, name, img }) => (
            <button
              key={choice}
              onClick={() => vote(choice)}
              disabled={voting}
              className="flex flex-col items-center gap-3 bg-stone-800 hover:bg-stone-700 border border-stone-700/60 hover:border-[var(--accent)] rounded-2xl px-4 py-4 transition-all disabled:opacity-50"
            >
              {img ? (
                <img src={img} alt={name} className="w-16 h-16 rounded-full object-cover shadow-lg shadow-black/40" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-stone-700 flex items-center justify-center text-2xl">🎤</div>
              )}
              <span className="text-sm font-semibold text-stone-200">{name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {([
            { choice: "a" as const, name: poll.artist_a, img: imageA, pct: pctA, count: counts.a },
            { choice: "b" as const, name: poll.artist_b, img: imageB, pct: pctB, count: counts.b },
          ]).map(({ choice, name, img, pct, count }) => {
            const isWinner = choice === "a" ? counts.a >= counts.b : counts.b >= counts.a;
            const isVoted = voted === choice;
            return (
              <div key={choice} className="flex items-center gap-3">
                {img ? (
                  <img src={img} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-lg flex-shrink-0">🎤</div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${isVoted ? "text-[var(--accent)]" : "text-stone-300"}`}>
                      {name} {isVoted && "✓"}
                    </span>
                    <span className="text-stone-500 text-xs">{pct}% · {count}</span>
                  </div>
                  <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-[var(--accent)]" : "bg-stone-600"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-stone-700 text-xs mt-1">{total} {total === 1 ? "vote" : "votes"} total</p>
        </div>
      )}
    </div>
  );
}

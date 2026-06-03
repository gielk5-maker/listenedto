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

export default function PollKaart({ userId }: { userId: string }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voted, setVoted] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ a: number; b: number }>({ a: 0, b: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function findEligiblePoll() {
      // Get all user's logged artists
      const { data: ratings } = await supabase
        .from("ratings")
        .select("artist_name")
        .eq("user_id", userId);

      const listenedArtists = new Set(
        (ratings ?? []).map(r => r.artist_name.toLowerCase())
      );

      // Get already voted poll IDs
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("poll_id, vote")
        .eq("user_id", userId);

      const votedMap: Record<string, string> = {};
      (votes ?? []).forEach(v => { votedMap[v.poll_id] = v.vote; });

      // Find first eligible unvoted poll
      for (const p of POLLS) {
        const hasA = [...listenedArtists].some(a => a.includes(p.artist_a.toLowerCase()) || p.artist_a.toLowerCase().includes(a.split(" ")[0]));
        const hasB = [...listenedArtists].some(a => a.includes(p.artist_b.toLowerCase()) || p.artist_b.toLowerCase().includes(a.split(" ")[0]));

        if (hasA && hasB) {
          setPoll(p);
          if (votedMap[p.id]) {
            setVoted(votedMap[p.id]);
            // Get vote counts
            const { data: allVotes } = await supabase
              .from("poll_votes")
              .select("vote")
              .eq("poll_id", p.id);
            const a = (allVotes ?? []).filter(v => v.vote === "a").length;
            const b = (allVotes ?? []).filter(v => v.vote === "b").length;
            setCounts({ a, b });
          }
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
      <p className="text-[10px] text-stone-600 uppercase tracking-widest font-semibold mb-3">Poll</p>
      <p className="text-stone-200 font-semibold mb-4">{poll.question}</p>

      {!voted ? (
        <div className="grid grid-cols-2 gap-3">
          {(["a", "b"] as const).map(choice => (
            <button
              key={choice}
              onClick={() => vote(choice)}
              disabled={voting}
              className="bg-stone-800 hover:bg-stone-700 border border-stone-700/60 hover:border-[var(--accent)] rounded-2xl px-4 py-3.5 text-sm font-semibold text-stone-200 transition-all disabled:opacity-50"
            >
              {choice === "a" ? poll.artist_a : poll.artist_b}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(["a", "b"] as const).map(choice => {
            const name = choice === "a" ? poll.artist_a : poll.artist_b;
            const pct = choice === "a" ? pctA : pctB;
            const count = choice === "a" ? counts.a : counts.b;
            const isWinner = (choice === "a" ? counts.a : counts.b) >= (choice === "a" ? counts.b : counts.a);
            const isVoted = voted === choice;
            return (
              <div key={choice}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-semibold ${isVoted ? "text-[var(--accent)]" : "text-stone-300"}`}>
                    {name} {isVoted && "✓"}
                  </span>
                  <span className="text-stone-500 text-xs">{pct}% · {count} {count === 1 ? "vote" : "votes"}</span>
                </div>
                <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isWinner ? "bg-[var(--accent)]" : "bg-stone-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="text-stone-700 text-xs mt-2">{total} {total === 1 ? "vote" : "votes"} total</p>
        </div>
      )}
    </div>
  );
}

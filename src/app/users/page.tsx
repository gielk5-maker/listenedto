"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Gebruiker = {
  id: string;
  username: string;
};

export default function GebruikersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Gebruiker[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Profile</Link>} />

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold mb-6 text-stone-50">Find people</h1>

        <form onSubmit={search} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 bg-stone-900 border border-stone-700/60 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-text)] font-bold rounded-2xl px-6 py-3 transition-colors"
          >
            {loading ? "..." : "Search"}
          </button>
        </form>

        {searched && results.length === 0 && !loading && (
          <p className="text-stone-600 text-center py-8">No users found.</p>
        )}

        <div className="space-y-2">
          {results.map((g) => (
            <button
              key={g.id}
              onClick={() => router.push(`/user/${g.username}`)}
              className="w-full flex items-center gap-3 bg-stone-900 hover:bg-stone-800/80 rounded-2xl px-4 py-3.5 transition-colors text-left border border-stone-800/40 hover:border-stone-700"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)] flex-shrink-0 shadow shadow-black/25">
                {g.username[0].toUpperCase()}
              </div>
              <span className="font-semibold text-stone-100">{g.username}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

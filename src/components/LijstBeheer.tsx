"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { maakLijst, verwijderLijst } from "@/app/actions/profile";
import { useRouter } from "next/navigation";

type Lijst = {
  id: string;
  name: string;
  description: string | null;
  _count: number;
};

type Props = {
  lijsten: Lijst[];
  bewerkbaar: boolean;
};

export default function LijstBeheer({ lijsten: initLijsten, bewerkbaar }: Props) {
  const [lijsten, setLijsten] = useState(initLijsten);
  const [nieuwOpen, setNieuwOpen] = useState(false);
  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleMaak(e: React.FormEvent) {
    e.preventDefault();
    if (!naam.trim()) return;
    const result = await maakLijst(naam, beschrijving);
    if (result?.id) {
      setNieuwOpen(false);
      setNaam("");
      setBeschrijving("");
      router.push(`/list/${result.id}`);
    }
  }

  function handleVerwijder(id: string) {
    setLijsten((prev) => prev.filter((l) => l.id !== id));
    startTransition(() => verwijderLijst(id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold">Lists</h2>
        {bewerkbaar && (
          <button
            onClick={() => setNieuwOpen(true)}
            className="text-xs text-[var(--accent)] font-medium hover:opacity-80 transition-opacity"
          >
            + New list
          </button>
        )}
      </div>

      {lijsten.length === 0 ? (
        <div className="text-center py-10 bg-stone-900/60 rounded-3xl border border-stone-800">
          <p className="text-stone-600 text-sm mb-3">No lists yet.</p>
          {bewerkbaar && (
            <button
              onClick={() => setNieuwOpen(true)}
              className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity inline-block"
            >
              Create your first list
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {lijsten.map((lijst) => (
            <div key={lijst.id} className="group flex items-center gap-3">
              <Link
                href={`/list/${lijst.id}`}
                className="flex-1 flex items-center gap-3 bg-stone-900 hover:bg-stone-800/80 rounded-2xl px-4 py-3 transition-colors border border-stone-800/40 hover:border-stone-700"
              >
                <span className="text-lg">📋</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-stone-100 truncate">{lijst.name}</p>
                  {lijst.description && <p className="text-xs text-stone-600 truncate">{lijst.description}</p>}
                </div>
                <span className="ml-auto text-xs text-stone-700 flex-shrink-0">{lijst._count} albums</span>
              </Link>
              {bewerkbaar && (
                <button
                  onClick={() => handleVerwijder(lijst.id)}
                  className="text-stone-700 hover:text-red-400 transition-colors text-sm opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {nieuwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setNieuwOpen(false)}>
          <form
            onSubmit={handleMaak}
            className="bg-stone-900 border border-stone-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-stone-100">New list</h3>
            <input
              autoFocus
              type="text"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              placeholder="Name (e.g. Top Albums 2024)"
              className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <input
              type="text"
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setNieuwOpen(false)} className="flex-1 py-2.5 rounded-2xl border border-stone-700 text-stone-400 text-sm hover:bg-stone-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!naam.trim()} className="flex-1 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-text)] font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function Header({ username }: { username?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  function zoek(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/zoeken?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <Link href="/feed" className="text-base font-bold tracking-tight shrink-0 flex items-center gap-2">
          <Logo />
          <span className="text-stone-50">ListenedTo</span>
        </Link>

        <form onSubmit={zoek} className="flex-1 max-w-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek album of nummer..."
            className="w-full bg-stone-900 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-amber-500/70 transition-colors"
          />
        </form>

        <nav className="flex items-center gap-4 ml-auto shrink-0">
          <Link
            href="/gebruikers"
            className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block"
          >
            Mensen
          </Link>
          {username && (
            <Link
              href="/profiel"
              className={`text-sm font-medium transition-colors ${
                pathname === "/profiel" ? "text-[var(--accent)]" : "text-stone-400 hover:text-stone-100"
              }`}
            >
              {username}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

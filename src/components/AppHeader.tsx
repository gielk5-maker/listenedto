"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef } from "react";

type Props = {
  /** Content shown on the right side of the header */
  right?: React.ReactNode;
};

export default function AppHeader({ right }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery("");
    inputRef.current?.blur();
  }

  // On the search page itself the big search bar is already front-and-center
  const onSearchPage = pathname === "/search";

  return (
    <header className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold shrink-0">
          <Logo />
          <span className="hidden sm:inline text-stone-50">ListenedTo</span>
        </Link>

        {/* Search bar — hidden on search page */}
        {!onSearchPage && (
          <form onSubmit={handleSubmit} className="flex-1 max-w-sm mx-auto">
            <div className={`flex items-center gap-2 bg-stone-900 border rounded-xl px-3 py-2 transition-colors ${focused ? "border-[var(--accent)]" : "border-stone-700/60"}`}>
              <svg className="w-3.5 h-3.5 text-stone-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search album or artist…"
                className="flex-1 bg-transparent text-sm text-stone-50 placeholder-stone-600 focus:outline-none min-w-0"
              />
            </div>
          </form>
        )}

        {/* Right slot */}
        <div className="ml-auto shrink-0 flex items-center gap-3">
          {right}
        </div>
      </div>
    </header>
  );
}

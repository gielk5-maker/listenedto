"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ChatButton from "@/components/ChatButton";
import NotificationBell from "@/components/NotificationBell";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef } from "react";

type Props = {
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

  const onSearchPage = pathname === "/search";

  return (
    <header className="sticky top-0 z-20 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3">
      <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4">

        {/* Left — Logo */}
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          <span className="hidden sm:inline text-stone-50 tracking-tight">ListenedTo</span>
        </Link>

        {/* Center — Search bar */}
        {!onSearchPage ? (
          <form onSubmit={handleSubmit} className="w-64 lg:w-80">
            <div className={`flex items-center gap-2 bg-stone-900 border rounded-2xl px-4 py-2 transition-colors ${focused ? "border-[var(--accent)]" : "border-stone-800"}`}>
              <svg className="w-3.5 h-3.5 text-stone-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm text-stone-50 placeholder-stone-600 focus:outline-none min-w-0"
              />
            </div>
          </form>
        ) : <div />}

        {/* Right — fixed nav + page-specific content */}
        <div className="flex items-center gap-4 justify-end">
          <Link href="/feed" className={`text-sm transition-colors hidden sm:block ${pathname === "/feed" ? "text-stone-200 font-semibold" : "text-stone-500 hover:text-stone-200"}`}>Feed</Link>
          <Link href="/search" className={`text-sm transition-colors hidden sm:block ${pathname === "/search" ? "text-stone-200 font-semibold" : "text-stone-500 hover:text-stone-200"}`}>Search</Link>
          <ChatButton />
          <NotificationBell />
          {right}
        </div>

      </div>
    </header>
  );
}

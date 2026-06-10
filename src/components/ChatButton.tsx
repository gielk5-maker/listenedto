"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChatButton() {
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      async function fetchUnread() {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user!.id)
          .is("read_at", null);
        setUnread(count ?? 0);
      }

      fetchUnread();

      const channel = supabase
        .channel("unread-messages")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, fetchUnread)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, fetchUnread)
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }

    init();
  }, []);

  const active = pathname?.startsWith("/dm");
  if (!userId) return null;

  return (
    <Link
      href="/dm"
      className={`relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-stone-800 transition-colors ${active ? "text-[var(--accent)]" : "text-stone-400 hover:text-stone-200"}`}
      aria-label="Messages"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--accent)] rounded-full text-[10px] font-bold text-[var(--accent-text)] flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type Other = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  currentUserId: string;
  other: Other;
  initialMessages: Message[];
  isMutual: boolean;
};

export default function ChatWindow({ currentUserId, other, initialMessages, isMutual }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`dm-${[currentUserId, other.id].sort().join("-")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const incoming = payload.new as Message & { receiver_id: string };
        const relevant =
          (incoming.sender_id === currentUserId && incoming.receiver_id === other.id) ||
          (incoming.sender_id === other.id && incoming.receiver_id === currentUserId);
        if (!relevant) return;
        setMessages(prev => [...prev, incoming]);

        // Mark as read if we received it
        if (incoming.sender_id === other.id) {
          supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", incoming.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, other.id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    // Optimistic update — show immediately without waiting for realtime
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimistic]);

    const { data: inserted, error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: other.id,
      content: text,
    }).select("id, sender_id, content, created_at, read_at").single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } else if (inserted) {
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted : m));
    }
    setSending(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col flex-1 max-w-xl mx-auto w-full px-5 pb-6" style={{ minHeight: "calc(100vh - 57px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 border-b border-stone-800/60">
        <Link href={`/user/${other.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-stone-800 overflow-hidden flex-shrink-0">
            {other.avatar_url
              ? <img src={other.avatar_url} alt={other.username} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">{other.username[0].toUpperCase()}</div>
            }
          </div>
          <span className="font-semibold text-stone-100">{other.username}</span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-stone-700 text-sm py-10">No messages yet. Say hi!</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const prev = messages[i - 1];
          const showTime = !prev || new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;
          const sameSender = prev && prev.sender_id === msg.sender_id;

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[11px] text-stone-700 my-3">{formatTime(msg.created_at)}</p>
              )}
              <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${sameSender && !showTime ? "mt-0.5" : "mt-2"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe
                    ? "bg-[var(--accent)] text-[var(--accent-text)] rounded-br-md"
                    : "bg-stone-800 text-stone-100 rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isMutual ? (
        <form onSubmit={send} className="flex gap-2 pt-3 border-t border-stone-800/60">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${other.username}…`}
            maxLength={2000}
            autoFocus
            className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl px-4 py-3 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-3 text-sm transition-opacity shrink-0"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="py-4 border-t border-stone-800/60 text-center">
          <p className="text-stone-600 text-sm">You can only message mutual followers.</p>
        </div>
      )}
    </div>
  );
}

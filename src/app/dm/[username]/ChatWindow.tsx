"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/verified";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
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
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!menuId) return;
    function handler() { setMenuId(null); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuId]);

  useEffect(() => {
    const channel = supabase
      .channel(`dm-${[currentUserId, other.id].sort().join("-")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const incoming = payload.new as Message & { receiver_id: string };
        const relevant =
          (incoming.sender_id === currentUserId && incoming.receiver_id === other.id) ||
          (incoming.sender_id === other.id && incoming.receiver_id === currentUserId);
        if (!relevant) return;
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
        if (incoming.sender_id === other.id) {
          supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", incoming.id);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
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

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
      edited_at: null,
      deleted_at: null,
    };
    setMessages(prev => [...prev, optimistic]);

    const { data: inserted, error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: other.id,
      content: text,
    }).select("id, sender_id, content, created_at, read_at, edited_at, deleted_at").single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } else if (inserted) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted : m));
    }
    setSending(false);
  }

  async function saveEdit(msgId: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setEditingId(null);
    const now = new Date().toISOString();
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: trimmed, edited_at: now } : m));
    await supabase.from("messages")
      .update({ content: trimmed, edited_at: now })
      .eq("id", msgId).eq("sender_id", currentUserId);
  }

  async function deleteMsg(msgId: string) {
    setMenuId(null);
    const now = new Date().toISOString();
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: now } : m));
    await supabase.from("messages")
      .update({ deleted_at: now })
      .eq("id", msgId).eq("sender_id", currentUserId);
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
          <span className="flex items-center gap-1.5 font-semibold text-stone-100">
            {other.username}
            {isVerified(other.username) && <VerifiedBadge className="w-4 h-4 flex-shrink-0" />}
          </span>
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
          const isDeleted = !!msg.deleted_at;
          const isEditing = editingId === msg.id;

          return (
            <div key={msg.id} className={sameSender && !showTime ? "mt-0.5" : "mt-2"}>
              {showTime && (
                <p className="text-center text-[11px] text-stone-700 my-3">{formatTime(msg.created_at)}</p>
              )}

              {/* Message row — group for hover-reveal of dots */}
              <div className={`group flex items-center gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {/* Bubble */}
                <div className={`max-w-[75%] text-sm leading-relaxed break-words rounded-2xl ${
                  isDeleted
                    ? "px-4 py-2 bg-transparent text-stone-600 italic border border-stone-800"
                    : isEditing
                      ? "px-3 py-2 bg-stone-800 w-full max-w-[85%]"
                      : isMe
                        ? "px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-br-sm"
                        : "px-4 py-2 bg-stone-800 text-stone-100 rounded-bl-sm"
                }`}>
                  {isDeleted ? (
                    "This message was deleted"
                  ) : isEditing ? (
                    <form onSubmit={e => { e.preventDefault(); saveEdit(msg.id); }} className="flex gap-2 items-center">
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Escape") setEditingId(null); }}
                        maxLength={2000}
                        className="flex-1 bg-stone-700 rounded-lg px-3 py-1.5 text-stone-100 text-sm focus:outline-none"
                      />
                      <button type="submit" className="text-[var(--accent)] text-xs font-semibold shrink-0">Save</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-stone-500 text-xs shrink-0">Cancel</button>
                    </form>
                  ) : (
                    <>
                      {msg.content}
                      {msg.edited_at && (
                        <span className={`text-[10px] ml-1.5 ${isMe ? "opacity-60" : "text-stone-500"}`}>edited</span>
                      )}
                    </>
                  )}
                </div>

                {/* ··· menu — own non-deleted messages, visible on hover */}
                {isMe && !isDeleted && !isEditing && (
                  <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuId(menuId === msg.id ? null : msg.id); }}
                      className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>
                    {menuId === msg.id && (
                      <div
                        className="absolute bottom-full right-0 mb-1 bg-stone-800 border border-stone-700/60 rounded-xl shadow-2xl overflow-hidden z-20 min-w-[110px]"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => { setEditingId(msg.id); setEditText(msg.content); setMenuId(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-stone-200 hover:bg-stone-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMsg(msg.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-stone-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

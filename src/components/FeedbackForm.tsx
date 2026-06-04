"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackForm({ userId, username }: { userId: string; username: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"bug" | "idea" | "other">("idea");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from("feedback").insert({
      user_id: userId,
      username,
      type,
      message: message.trim(),
    });
    setSending(false);
    setSent(true);
    setMessage("");
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  }

  return (
    <div className="bg-stone-900 rounded-3xl border border-stone-800/60">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full px-5 py-4 flex items-center justify-between text-left group"
        >
          <div>
            <p className="text-sm font-semibold text-stone-200">Leave feedback</p>
            <p className="text-xs text-stone-600 mt-0.5">Report a bug or share an idea</p>
          </div>
          <span className="text-stone-600 group-hover:text-stone-400 transition-colors text-lg">→</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200">Leave feedback</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-stone-600 hover:text-stone-400 text-xs transition-colors">Cancel</button>
          </div>

          <div className="flex gap-2">
            {(["bug", "idea", "other"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${type === t ? "bg-[var(--accent)] text-[var(--accent-text)]" : "bg-stone-800 text-stone-400 hover:text-stone-200"}`}
              >
                {t === "bug" ? "🐛 Bug" : t === "idea" ? "💡 Idea" : "💬 Other"}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={type === "bug" ? "What went wrong?" : type === "idea" ? "What would you like to see?" : "What's on your mind?"}
            rows={4}
            maxLength={1000}
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
          />

          {sent ? (
            <p className="text-[var(--accent)] text-sm font-semibold text-center">Thanks for your feedback! ✓</p>
          ) : (
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl py-3 text-sm transition-opacity"
            >
              {sending ? "Sending..." : "Send feedback"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

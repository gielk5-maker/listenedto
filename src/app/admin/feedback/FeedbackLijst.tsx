"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FeedbackItem = {
  id: string;
  type: string;
  username: string;
  message: string;
  created_at: string;
};

const typeColor: Record<string, string> = {
  bug: "text-red-400 bg-red-950/40 border-red-900/40",
  idea: "text-yellow-400 bg-yellow-950/40 border-yellow-900/40",
  other: "text-stone-400 bg-stone-800/60 border-stone-700/40",
};
const typeLabel: Record<string, string> = { bug: "🐛 Bug", idea: "💡 Idea", other: "💬 Other" };

export default function FeedbackLijst({ initial }: { initial: FeedbackItem[] }) {
  const [items, setItems] = useState(initial);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("feedback").delete().eq("id", id);
    setItems(prev => prev.filter(f => f.id !== id));
    setConfirmId(null);
  }

  if (items.length === 0) return <p className="text-stone-600 text-center py-20">No feedback yet.</p>;

  return (
    <div className="space-y-3">
      {items.map(f => (
        <div key={f.id} className="bg-stone-900 rounded-2xl p-4 border border-stone-800/60 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor[f.type] ?? typeColor.other}`}>
              {typeLabel[f.type] ?? f.type}
            </span>
            <span className="text-stone-500 text-xs font-medium">{f.username}</span>
            <span className="text-stone-700 text-xs">
              {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {confirmId === f.id ? (
                <>
                  <button onClick={() => remove(f.id)} className="text-red-400 text-xs font-semibold hover:text-red-300 transition-colors">Confirm</button>
                  <button onClick={() => setConfirmId(null)} className="text-stone-600 text-xs hover:text-stone-400 transition-colors">Cancel</button>
                </>
              ) : (
                <button onClick={() => setConfirmId(f.id)} className="text-stone-700 hover:text-red-400 text-xs transition-colors">Delete</button>
              )}
            </div>
          </div>
          <p className="text-stone-200 text-sm leading-relaxed">{f.message}</p>
        </div>
      ))}
    </div>
  );
}

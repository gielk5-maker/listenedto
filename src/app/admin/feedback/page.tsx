import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ADMIN_EMAIL = "gielkerstens5@gmail.com";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (user.email !== ADMIN_EMAIL) redirect("/feed");

  const { data: feedback } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  const typeColor: Record<string, string> = {
    bug: "text-red-400 bg-red-950/40 border-red-900/40",
    idea: "text-yellow-400 bg-yellow-950/40 border-yellow-900/40",
    other: "text-stone-400 bg-stone-800/60 border-stone-700/40",
  };
  const typeLabel: Record<string, string> = { bug: "🐛 Bug", idea: "💡 Idea", other: "💬 Other" };

  return (
    <div className="min-h-screen text-stone-50 bg-stone-950">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/feed" className="text-base font-bold">ListenedTo</Link>
        <span className="text-stone-700">·</span>
        <span className="text-stone-400 text-sm">Feedback inbox</span>
        <span className="ml-auto text-xs text-stone-600">{feedback?.length ?? 0} items</span>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-3">
        {!feedback || feedback.length === 0 ? (
          <p className="text-stone-600 text-center py-20">No feedback yet.</p>
        ) : (
          feedback.map(f => (
            <div key={f.id} className="bg-stone-900 rounded-2xl p-4 border border-stone-800/60 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColor[f.type] ?? typeColor.other}`}>
                  {typeLabel[f.type] ?? f.type}
                </span>
                <span className="text-stone-500 text-xs font-medium">{f.username}</span>
                <span className="text-stone-700 text-xs ml-auto">
                  {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-stone-200 text-sm leading-relaxed">{f.message}</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FeedbackLijst from "./FeedbackLijst";

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

  return (
    <div className="min-h-screen text-stone-50 bg-stone-950">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/feed" className="text-base font-bold">ListenedTo</Link>
        <span className="text-stone-700">·</span>
        <span className="text-stone-400 text-sm">Feedback inbox</span>
        <span className="ml-auto text-xs text-stone-600">{feedback?.length ?? 0} items</span>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-8">
        <FeedbackLijst initial={feedback ?? []} />
      </main>
    </div>
  );
}

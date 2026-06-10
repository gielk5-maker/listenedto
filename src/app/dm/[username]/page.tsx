export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ChatWindow from "./ChatWindow";

export default async function DmConversatiePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: other } = await supabase
    .from("profiles").select("id, username, avatar_url").eq("username", username).single();
  if (!other) notFound();
  if (other.id === user.id) redirect("/dm");

  // Check mutual follow — fetch both directions separately to avoid RLS issues
  const [{ data: iFollowRows }, { data: myFollowers }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
    supabase.from("follows").select("follower_id").eq("following_id", user.id),
  ]);

  const iFollow = (iFollowRows ?? []).some(r => r.following_id === other.id);
  const theyFollow = (myFollowers ?? []).some(r => r.follower_id === other.id);
  const isMutual = iFollow && theyFollow;

  // Load initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, read_at")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true })
    .limit(100);

  // Mark received messages as read
  if (messages && messages.some(m => m.sender_id === other.id && !m.read_at)) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", other.id)
      .eq("receiver_id", user.id)
      .is("read_at", null);
  }

  return (
    <div className="min-h-screen flex flex-col text-stone-50">
      <AppHeader right={<Link href="/dm" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Messages</Link>} />

      <ChatWindow
        currentUserId={user.id}
        other={other}
        initialMessages={messages ?? []}
        isMutual={isMutual}
      />
    </div>
  );
}

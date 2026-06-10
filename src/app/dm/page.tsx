export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import VerifiedBadge from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/verified";

export default async function DmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get mutual followers
  const { data: following } = await supabase
    .from("follows").select("following_id").eq("follower_id", user.id);
  const { data: followers } = await supabase
    .from("follows").select("follower_id").eq("following_id", user.id);

  const followingIds = new Set((following ?? []).map(f => f.following_id));
  const mutualIds = (followers ?? [])
    .map(f => f.follower_id)
    .filter(id => followingIds.has(id));

  // Get profiles of mutuals
  const { data: mutualProfiles } = mutualIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", mutualIds)
    : { data: [] };

  // For each mutual, get the latest message and unread count
  const conversations = await Promise.all(
    (mutualProfiles ?? []).map(async (p) => {
      const { data: latest } = await supabase
        .from("messages")
        .select("content, created_at, sender_id, read_at")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", p.id)
        .eq("receiver_id", user.id)
        .is("read_at", null);

      return { profile: p, latest, unread: unread ?? 0 };
    })
  );

  // Sort: conversations with messages first (by recency), then the rest
  conversations.sort((a, b) => {
    if (!a.latest && !b.latest) return 0;
    if (!a.latest) return 1;
    if (!b.latest) return -1;
    return b.latest.created_at.localeCompare(a.latest.created_at);
  });

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">Profile</Link>} />

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-20 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-stone-500 text-sm">No mutual followers yet.</p>
            <p className="text-stone-700 text-xs mt-1">Follow someone back to start a conversation.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(({ profile, latest, unread }) => (
              <Link
                key={profile.id}
                href={`/dm/${profile.username}`}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-stone-900 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-stone-800 flex-shrink-0 overflow-hidden">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-stone-500 text-lg font-bold">{profile.username[0].toUpperCase()}</div>
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex items-center gap-1 text-sm font-semibold ${unread > 0 ? "text-stone-50" : "text-stone-300"}`}>
                      {profile.username}
                      {isVerified(profile.username) && <VerifiedBadge className="w-3.5 h-3.5 flex-shrink-0" />}
                    </span>
                    {latest && <span className="text-xs text-stone-600 shrink-0">{timeAgo(latest.created_at)}</span>}
                  </div>
                  {latest ? (
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-stone-300 font-medium" : "text-stone-600"}`}>
                      {latest.sender_id === user.id ? "You: " : ""}{latest.content}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-700 mt-0.5">No messages yet</p>
                  )}
                </div>

                {/* Unread badge */}
                {unread > 0 && (
                  <span className="w-5 h-5 bg-[var(--accent)] rounded-full text-[10px] font-bold text-[var(--accent-text)] flex items-center justify-center shrink-0">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

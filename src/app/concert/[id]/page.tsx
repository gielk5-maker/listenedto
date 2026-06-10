export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ConcertReviews from "./ConcertReviews";

export default async function ConcertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: concert } = await supabase
    .from("concert_events").select("*").eq("id", id).single();

  if (!concert) notFound();

  // Fetch reviews without profiles join to avoid FK issues
  const { data: reviewsRaw, error: reviewError } = await supabase
    .from("concert_reviews")
    .select("id, user_id, rating, review, created_at")
    .eq("concert_id", id)
    .order("created_at", { ascending: false });

  // Fetch profiles separately
  const userIds = [...new Set((reviewsRaw ?? []).map(r => r.user_id))];
  const { data: profielen } = userIds.length > 0
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] };

  const profielMap: Record<string, { username: string; avatar_url: string | null }> = {};
  profielen?.forEach(p => { profielMap[p.id] = { username: p.username, avatar_url: p.avatar_url }; });

  const reviews = (reviewsRaw ?? []).map(r => ({
    ...r,
    username: profielMap[r.user_id]?.username ?? null,
    avatar_url: profielMap[r.user_id]?.avatar_url ?? null,
  }));

  const eigenReview = reviews.find(r => r.user_id === user?.id);
  const gemiddelde = reviews.length > 0 && reviews.some(r => r.rating)
    ? (reviews.filter(r => r.rating).reduce((s, r) => s + r.rating!, 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : null;

  const dateFormatted = new Date(concert.concert_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const editUrl = `/concert/log?artist=${encodeURIComponent(concert.artist_name)}&venue=${encodeURIComponent(concert.venue ?? "")}&city=${encodeURIComponent(concert.city)}&country=${encodeURIComponent(concert.country)}&date=${concert.concert_date}`;

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>} />

      <main className="max-w-2xl mx-auto px-5 py-10">
        {/* Concert header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-widest mb-1.5">Concert</p>
              <h1 className="text-3xl font-bold text-stone-50">{concert.artist_name}</h1>
              <div className="mt-2 space-y-1">
                <p className="text-stone-400">{dateFormatted}</p>
                <p className="text-stone-500 text-sm">
                  {concert.venue && `${concert.venue} · `}{concert.city}, {concert.country}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-stone-600 text-sm">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
                {gemiddelde && <span className="text-[var(--accent)] font-semibold">⌀ {gemiddelde} ★</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              {eigenReview ? (
                <Link href={editUrl}
                  className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-semibold rounded-2xl px-5 py-2.5 text-sm transition-colors">
                  Edit review
                </Link>
              ) : (
                <Link href={editUrl}
                  className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity">
                  + Log this concert
                </Link>
              )}
            </div>
          </div>
        </div>

        <ConcertReviews
          reviews={reviews}
          eigenUserId={user?.id ?? null}
          concertId={id}
          artistName={concert.artist_name}
          venue={concert.venue ?? null}
          city={concert.city}
          country={concert.country}
          concertDate={concert.concert_date}
        />
      </main>
    </div>
  );
}

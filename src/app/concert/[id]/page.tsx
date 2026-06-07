import { notFound, redirect } from "next/navigation";
import Sterren from "@/components/Sterren";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Logo from "@/components/Logo";
import { verwijderConcertReview } from "@/app/actions/concert";



export default async function ConcertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: concert } = await supabase
    .from("concert_events").select("*").eq("id", id).single();

  if (!concert) notFound();

  const { data: reviews } = await supabase
    .from("concert_reviews")
    .select("*, profiles(username, avatar_url)")
    .eq("concert_id", id)
    .order("created_at", { ascending: false });

  const eigenReview = reviews?.find(r => r.user_id === user?.id);
  const gemiddelde = reviews && reviews.length > 0 && reviews.some(r => r.rating)
    ? (reviews.filter(r => r.rating).reduce((s, r) => s + r.rating, 0) / reviews.filter(r => r.rating).length).toFixed(1)
    : null;

  const dateFormatted = new Date(concert.concert_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>
      </header>

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
                <span className="text-stone-600 text-sm">{reviews?.length ?? 0} {reviews?.length === 1 ? "review" : "reviews"}</span>
                {gemiddelde && <span className="text-[var(--accent)] font-semibold">⌀ {gemiddelde} ★</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              {eigenReview ? (
                <Link href={`/concert/log?artist=${encodeURIComponent(concert.artist_name)}`}
                  className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-semibold rounded-2xl px-5 py-2.5 text-sm transition-colors">
                  Edit review
                </Link>
              ) : (
                <Link href={`/concert/log?artist=${encodeURIComponent(concert.artist_name)}`}
                  className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity">
                  + Log this concert
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-stone-600">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const profiel = r.profiles as { username: string; avatar_url: string | null } | null;
              const isEigen = r.user_id === user?.id;
              return (
                <div key={r.id} className="bg-stone-900 rounded-3xl p-5 border border-stone-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/user/${profiel?.username}`}
                      className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {profiel?.avatar_url ? (
                        <Image src={profiel.avatar_url} alt={profiel.username} width={36} height={36} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)]">
                          {profiel?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link href={`/user/${profiel?.username}`} className="font-semibold text-sm hover:text-[var(--accent)] transition-colors">
                        {profiel?.username}
                      </Link>
                      <p className="text-stone-700 text-xs">
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {r.rating && <Sterren rating={r.rating} />}
                    {isEigen && (
                      <form action={async () => {
                        "use server";
                        await verwijderConcertReview(id);
                      }}>
                        <button type="submit" className="text-stone-700 hover:text-red-400 transition-colors text-sm px-2">×</button>
                      </form>
                    )}
                  </div>
                  {r.review && (
                    <p className="text-stone-400 text-sm leading-relaxed italic">"{r.review}"</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

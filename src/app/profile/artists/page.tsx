import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import TopArtiesten from "@/components/TopArtiesten";

export default async function AlleArtiestenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ratingsRaw } = await supabase
    .from("ratings")
    .select("artist_name, rating")
    .eq("user_id", user.id)
    .not("rating", "is", null);

  const artiestTelling: Record<string, { count: number; totalRating: number }> = {};
  (ratingsRaw ?? []).forEach((r) => {
    if (!artiestTelling[r.artist_name]) artiestTelling[r.artist_name] = { count: 0, totalRating: 0 };
    artiestTelling[r.artist_name].count++;
    artiestTelling[r.artist_name].totalRating += r.rating;
  });

  const alleArtiesten = Object.entries(artiestTelling)
    .sort((a, b) => b[1].count - a[1].count || b[1].totalRating - a[1].totalRating)
    .map(([naam, info]) => ({ naam, ...info }));

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>} />

      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-xl font-bold mb-6">
          All artists <span className="text-stone-500 font-normal text-base">({alleArtiesten.length})</span>
        </h1>
        <TopArtiesten artiesten={alleArtiesten} showAll />
      </main>
    </div>
  );
}

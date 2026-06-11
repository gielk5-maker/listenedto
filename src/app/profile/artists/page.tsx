import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ArtistenGrid from "./ArtistenGrid";
import { getArtistImages } from "@/lib/artistImages";

const PER_PAGE = 24;

export default async function AlleArtiestenPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ratingsRaw } = await supabase
    .from("ratings")
    .select("artist_name, rating, album_image")
    .eq("user_id", user.id)
    .not("rating", "is", null);

  const artiestTelling: Record<string, { count: number; totalRating: number; image: string | null }> = {};
  (ratingsRaw ?? []).forEach((r) => {
    if (!artiestTelling[r.artist_name]) artiestTelling[r.artist_name] = { count: 0, totalRating: 0, image: r.album_image ?? null };
    artiestTelling[r.artist_name].count++;
    artiestTelling[r.artist_name].totalRating += r.rating;
  });

  const alleArtiesten = Object.entries(artiestTelling)
    .sort((a, b) => b[1].count - a[1].count || b[1].totalRating - a[1].totalRating)
    .map(([naam, info]) => ({ naam, ...info }));

  const totalPages = Math.ceil(alleArtiesten.length / PER_PAGE);
  const offset = (page - 1) * PER_PAGE;
  const paginaArtiesten = alleArtiesten.slice(offset, offset + PER_PAGE);

  const imageMap = await getArtistImages(paginaArtiesten.map(a => a.naam));
  const paginaMetImages = paginaArtiesten.map(a => ({ ...a, image: imageMap[a.naam] ?? null }));

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Profile</Link>} />
      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-xl font-bold mb-6">
          All artists <span className="text-stone-500 font-normal text-base">({alleArtiesten.length})</span>
        </h1>

        <ArtistenGrid artiesten={paginaMetImages} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-800/60 pt-6 mt-8">
            {page > 1 ? (
              <Link href={`/profile/artists?page=${page - 1}`}
                className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-700/60 text-stone-300 font-semibold rounded-2xl px-5 py-2.5 text-sm transition-colors">
                ← Previous page
              </Link>
            ) : <div />}

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`/profile/artists?page=${p}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${p === page ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-stone-500 hover:text-stone-200 hover:bg-stone-800"}`}>
                  {p}
                </Link>
              ))}
            </div>

            {page < totalPages ? (
              <Link href={`/profile/artists?page=${page + 1}`}
                className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-700/60 text-stone-300 font-semibold rounded-2xl px-5 py-2.5 text-sm transition-colors">
                Next page →
              </Link>
            ) : <div />}
          </div>
        )}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import AlbumCover from "@/components/AlbumCover";
import { createClient } from "@/lib/supabase/server";

export default async function TopAlbumsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raw } = await supabase
    .from("ratings")
    .select("album_name, artist_name, album_image, album_url, rating")
    .not("album_name", "is", null)
    .not("rating", "is", null);

  const map: Record<string, { album_name: string; artist_name: string; album_image: string | null; album_url: string | null; total: number; count: number }> = {};
  raw?.forEach((r) => {
    const key = `${r.album_name.toLowerCase()}__${r.artist_name.toLowerCase()}`;
    if (!map[key]) map[key] = { album_name: r.album_name, artist_name: r.artist_name, album_image: r.album_image, album_url: r.album_url, total: 0, count: 0 };
    map[key].total += r.rating;
    map[key].count++;
  });

  const albums = Object.values(map)
    .map((a) => ({ ...a, avg: Math.round((a.total / a.count) * 10) / 10 }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count);

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/feed" className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← Feed</Link>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-1">Highest rated albums</h1>
        <p className="text-stone-500 text-sm mb-8">Ranked by average rating across all users</p>

        {albums.length === 0 ? (
          <p className="text-stone-700 text-sm text-center py-20">No rated albums yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album, i) => (
              <Link
                key={`${album.album_name}__${album.artist_name}`}
                href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
                className="group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-800 shadow-lg shadow-black/40 mb-2.5 group-hover:opacity-80 transition-opacity">
                  <AlbumCover src={album.album_image} alt={album.album_name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-stone-300 bg-stone-950/70 rounded-lg px-1.5 py-0.5">#{i + 1}</span>
                </div>
                <p className="text-stone-100 font-semibold text-sm truncate leading-tight">{album.album_name}</p>
                <p className="text-stone-500 text-xs truncate mt-0.5">{album.artist_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[var(--accent)] text-xs font-bold">★ {album.avg}</p>
                  <p className="text-stone-700 text-[10px]">{album.count} {album.count === 1 ? "rating" : "ratings"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

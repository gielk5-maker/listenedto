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

      <main className="max-w-xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-1">Highest rated albums</h1>
        <p className="text-stone-500 text-sm mb-8">Ranked by average rating across all users</p>

        <div className="space-y-2">
          {albums.map((album, i) => (
            <Link
              key={`${album.album_name}__${album.artist_name}`}
              href={`/album?name=${encodeURIComponent(album.album_name)}&artist=${encodeURIComponent(album.artist_name)}&image=${encodeURIComponent(album.album_image ?? "")}&url=${encodeURIComponent(album.album_url ?? "")}`}
              className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800 rounded-2xl px-4 py-3 border border-stone-800/40 transition-colors group"
            >
              <span className="text-sm font-bold text-stone-600 w-6 text-right flex-shrink-0">#{i + 1}</span>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0 shadow-md shadow-black/40">
                <AlbumCover src={album.album_image} alt={album.album_name} width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-stone-100 font-semibold text-sm truncate">{album.album_name}</p>
                <p className="text-stone-500 text-xs truncate">{album.artist_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[var(--accent)] font-bold text-sm">★ {album.avg}</p>
                <p className="text-stone-600 text-[10px]">{album.count} {album.count === 1 ? "rating" : "ratings"}</p>
              </div>
            </Link>
          ))}

          {albums.length === 0 && (
            <p className="text-stone-700 text-sm text-center py-20">No rated albums yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

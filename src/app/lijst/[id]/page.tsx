import { notFound, redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { verwijderAlbumUitLijst } from "@/app/actions/profiel";

export default async function LijstPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lijst } = await supabase
    .from("lists").select("*, profiles(username)").eq("id", id).single();

  if (!lijst) notFound();

  const { data: items } = await supabase
    .from("list_items").select("*").eq("list_id", id).order("position", { ascending: true });

  const eigenaar = lijst.profiles as { username: string } | null;
  const isEigenaar = user?.id === lijst.user_id;

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href={isEigenaar ? "/profiel" : `/gebruiker/${eigenaar?.username}`} className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href={isEigenaar ? "/profiel" : `/gebruiker/${eigenaar?.username}`} className="text-stone-500 hover:text-stone-200 text-sm transition-colors ml-auto">
          ← {isEigenaar ? "Profile" : eigenaar?.username}
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-50">{lijst.name}</h1>
          {lijst.description && <p className="text-stone-500 mt-1">{lijst.description}</p>}
          <p className="text-stone-700 text-xs mt-2">
            by <Link href={`/gebruiker/${eigenaar?.username}`} className="hover:text-stone-400 transition-colors">{eigenaar?.username}</Link> · {items?.length ?? 0} albums
          </p>
        </div>

        {!items || items.length === 0 ? (
          <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
            <p className="text-stone-600 mb-2">No albums in this list yet.</p>
            {isEigenaar && <p className="text-stone-700 text-sm">Add albums from the album page.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id} className="group flex items-center gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3 transition-colors border border-stone-800/40 hover:border-stone-700">
                <span className="text-stone-700 text-sm w-6 text-right flex-shrink-0">{i + 1}</span>
                <Link
                  href={`/album?name=${encodeURIComponent(item.album_name)}&artist=${encodeURIComponent(item.artist_name)}${item.album_image ? `&image=${encodeURIComponent(item.album_image)}` : ""}${item.album_url ? `&url=${encodeURIComponent(item.album_url)}` : ""}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-stone-800">
                    {item.album_image
                      ? <Image src={item.album_image} alt={item.album_name} width={48} height={48} className="object-cover w-full h-full" />
                      : <div className="w-full h-full bg-stone-800" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-stone-100">{item.album_name}</p>
                    <p className="text-stone-500 text-xs truncate">{item.artist_name}</p>
                  </div>
                </Link>
                {isEigenaar && (
                  <form action={async () => {
                    "use server";
                    await verwijderAlbumUitLijst(item.id, id);
                  }}>
                    <button type="submit" className="text-stone-700 hover:text-red-400 transition-colors text-sm opacity-0 group-hover:opacity-100 px-2">×</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AlbumToevoegen from "@/components/AlbumToevoegen";
import LijstItemsBeheer from "@/components/LijstItemsBeheer";

export default async function LijstPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lijst } = await supabase
    .from("lists").select("*").eq("id", id).single();

  if (!lijst) notFound();

  const { data: items } = await supabase
    .from("list_items").select("*").eq("list_id", id).order("position", { ascending: true });

  const { data: eigenaarProfiel } = await supabase
    .from("profiles").select("username").eq("id", lijst.user_id).single();

  const eigenaar = eigenaarProfiel;
  const isEigenaar = user?.id === lijst.user_id;

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href={isEigenaar ? "/profile" : `/user/${eigenaar?.username}`} className="text-stone-500 hover:text-stone-200 text-sm transition-colors">← {isEigenaar ? "Profile" : eigenaar?.username}</Link>} />

      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-50">{lijst.name}</h1>
              {lijst.description && <p className="text-stone-500 mt-1">{lijst.description}</p>}
              <p className="text-stone-700 text-xs mt-2">
                by <Link href={`/user/${eigenaar?.username}`} className="hover:text-stone-400 transition-colors">{eigenaar?.username}</Link> · {items?.length ?? 0} albums
              </p>
            </div>
            {isEigenaar && <AlbumToevoegen listId={id} />}
          </div>
        </div>

        <LijstItemsBeheer
          listId={id}
          initialItems={items ?? []}
          isEigenaar={isEigenaar}
          isRanking={lijst.is_ranking ?? false}
        />
      </main>
    </div>
  );
}

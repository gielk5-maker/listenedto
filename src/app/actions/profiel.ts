"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function slaFavorietOp(position: number, album: {
  album_name: string;
  artist_name: string;
  album_image: string | null;
  album_url: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("favorites").upsert({
    user_id: user.id,
    position,
    ...album,
  }, { onConflict: "user_id,position" });

  revalidatePath("/profiel");
}

export async function verwijderFavoriet(position: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("favorites").delete()
    .eq("user_id", user.id)
    .eq("position", position);

  revalidatePath("/profiel");
}

export async function maakLijst(name: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const { data, error } = await supabase.from("lists").insert({
    user_id: user.id,
    name: name.trim(),
    description: description.trim() || null,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/profiel");
  return { id: data.id };
}

export async function verwijderLijst(listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("lists").delete().eq("id", listId).eq("user_id", user.id);
  revalidatePath("/profiel");
}

export async function voegAlbumToeAanLijst(listId: string, album: {
  album_name: string;
  artist_name: string;
  album_image: string | null;
  album_url: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: items } = await supabase.from("list_items")
    .select("position").eq("list_id", listId).order("position", { ascending: false }).limit(1);

  const nextPos = (items?.[0]?.position ?? -1) + 1;

  await supabase.from("list_items").insert({
    list_id: listId,
    ...album,
    position: nextPos,
  });

  revalidatePath(`/lijst/${listId}`);
}

export async function verwijderAlbumUitLijst(itemId: string, listId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("list_items").delete().eq("id", itemId);
  revalidatePath(`/lijst/${listId}`);
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  revalidatePath("/profiel");
}

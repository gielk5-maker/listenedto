"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleLike(ratingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: bestaand } = await supabase
    .from("likes").select("id").eq("user_id", user.id).eq("rating_id", ratingId).single();

  if (bestaand) {
    await supabase.from("likes").delete().eq("id", bestaand.id);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, rating_id: ratingId });
  }
  revalidatePath("/feed");
}

export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: bestaand } = await supabase
    .from("comment_likes").select("id").eq("user_id", user.id).eq("comment_id", commentId).single();

  if (bestaand) {
    await supabase.from("comment_likes").delete().eq("id", bestaand.id);
  } else {
    await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
  }
  revalidatePath("/feed");
}

export async function plaatsComment(ratingId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !content.trim()) return;

  await supabase.from("comments").insert({
    user_id: user.id,
    rating_id: ratingId,
    content: content.trim(),
  });
  revalidatePath("/feed");
}

export async function verwijderComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);
  revalidatePath("/feed");
}

export async function bewerkComment(commentId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !content.trim()) return;
  await supabase.from("comments").update({ content: content.trim() }).eq("id", commentId).eq("user_id", user.id);
  revalidatePath("/feed");
}

export async function volg(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const following_id = formData.get("following_id") as string;
  await supabase.from("follows").insert({ follower_id: user.id, following_id });
  revalidatePath("/", "layout");
}

export async function ontvolg(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const following_id = formData.get("following_id") as string;
  await supabase.from("follows").delete()
    .eq("follower_id", user.id)
    .eq("following_id", following_id);
  revalidatePath("/", "layout");
}

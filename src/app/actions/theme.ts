"use server";

import { createClient } from "@/lib/supabase/server";

export async function slaThemaOp(theme: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").update({ theme }).eq("id", user.id);
}

export async function haalThemaOp() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("theme").eq("id", user.id).single();
  return data?.theme ?? "green";
}

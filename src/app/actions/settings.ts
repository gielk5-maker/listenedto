"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function wijzigUsername(username: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const trimmed = username.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return { error: "Username must be at least 2 characters" };
  if (!/^[a-z0-9_]+$/.test(trimmed)) return { error: "Only letters, numbers and underscores allowed" };

  // Check availability
  const { data: bestaand } = await supabase
    .from("profiles").select("id").eq("username", trimmed).neq("id", user.id).maybeSingle();
  if (bestaand) return { error: "This username is already taken" };

  const { error } = await supabase
    .from("profiles").update({ username: trimmed }).eq("id", user.id);
  if (error) return { error: error.message };

  // Also update user metadata
  await supabase.auth.updateUser({ data: { username: trimmed } });

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: true };
}

export async function wijzigEmail(newEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { error: "Enter a valid email address" };
  if (trimmed === user.email) return { error: "This is already your email address" };

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { error: error.message };

  return { success: true };
}

export async function wijzigWachtwoord(huidig: string, nieuw: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  if (nieuw.length < 6) return { error: "Password must be at least 6 characters" };

  // Verify current password by re-signing in
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: huidig,
  });
  if (loginError) return { error: "Current password is incorrect" };

  const { error } = await supabase.auth.updateUser({ password: nieuw });
  if (error) return { error: error.message };

  return { success: true };
}

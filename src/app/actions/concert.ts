"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logConcert(data: {
  artist_name: string;
  venue: string;
  city: string;
  country: string;
  concert_date: string;
  rating: number;
  review: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // Upsert the shared concert event
  const { data: event, error: eventError } = await supabase
    .from("concert_events")
    .upsert({
      artist_name: data.artist_name.trim(),
      venue: data.venue.trim() || null,
      city: data.city.trim(),
      country: data.country.trim(),
      concert_date: data.concert_date,
    }, { onConflict: "artist_name,concert_date,city" })
    .select("id")
    .single();

  if (eventError || !event) return { error: eventError?.message ?? "Failed to create event" };

  // Upsert the user's review
  const { error: reviewError } = await supabase
    .from("concert_reviews")
    .upsert({
      user_id: user.id,
      concert_id: event.id,
      rating: data.rating || null,
      review: data.review.trim() || null,
    }, { onConflict: "user_id,concert_id" });

  if (reviewError) return { error: reviewError.message };

  revalidatePath("/profiel");
  revalidatePath(`/concert/${event.id}`);
  return { id: event.id };
}

export async function verwijderConcertReview(concertId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("concert_reviews")
    .delete()
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  revalidatePath("/profiel");
  revalidatePath(`/concert/${concertId}`);
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileSettings({ bio, spotifyUrl }: { bio: string; spotifyUrl: string }) {
  const [bioVal, setBioVal] = useState(bio);
  const [spotifyVal, setSpotifyVal] = useState(spotifyUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({
      bio: bioVal.trim() || null,
      spotify_url: spotifyVal.trim() || null,
    }).eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800/60 space-y-5">
      {/* Bio */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-widest mb-2">Bio</label>
        <textarea
          value={bioVal}
          onChange={e => setBioVal(e.target.value)}
          rows={3}
          maxLength={200}
          placeholder="Tell people about your music taste..."
          className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors resize-none text-sm"
        />
        <p className="text-stone-700 text-xs mt-1 text-right">{bioVal.length}/200</p>
      </div>

      {/* Spotify */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-widest mb-2">Spotify Profile URL</label>
        <div className="flex gap-2">
          <input
            value={spotifyVal}
            onChange={e => setSpotifyVal(e.target.value)}
            placeholder="https://open.spotify.com/user/..."
            className="flex-1 bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          {spotifyVal && (
            <a
              href={spotifyVal}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-[#1DB954] hover:opacity-90 text-black font-bold rounded-xl text-sm transition-opacity flex items-center gap-1.5 flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Open
            </a>
          )}
        </div>
        <p className="text-stone-600 text-xs mt-1.5">Find your URL on Spotify → Profile → ··· → Share → Copy link</p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity"
      >
        {saved ? "Saved ✓" : saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

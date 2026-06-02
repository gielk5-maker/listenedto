"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/app/actions/profile";
import Image from "next/image";

type Props = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export default function AvatarUpload({ userId, username, avatarUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      startTransition(() => updateAvatarUrl(url));
    }
    setUploading(false);
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      className="relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden group"
      title="Profielfoto wijzigen"
    >
      {preview ? (
        <Image src={preview} alt={username} fill className="object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-2xl font-bold text-[var(--accent-text)] shadow-xl shadow-black/25">
          {username?.[0]?.toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <span className="text-white text-xs font-semibold">Edit</span>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </button>
  );
}

"use client";

import { useState } from "react";
import ThemeSettings from "@/components/ThemeSettings";
import ProfileSettings from "@/components/ProfileSettings";
import AccountSettings from "@/components/AccountSettings";
import FeedbackForm from "@/components/FeedbackForm";
import AvatarUpload from "@/components/AvatarUpload";

type Props = {
  initialTab: "profile" | "preferences";
  username: string;
  email: string;
  bio: string;
  spotifyUrl: string;
  userId: string;
  avatarUrl: string | null;
};

export default function SettingsTabs({ initialTab, username, email, bio, spotifyUrl, userId, avatarUrl }: Props) {
  const [tab, setTab] = useState<"profile" | "preferences">(initialTab);

  return (
    <div>
      {/* Tabs */}
      <div className="flex w-full mb-8">
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 py-2.5 rounded-l-2xl text-sm font-semibold border-y border-l transition-colors ${tab === "profile" ? "bg-stone-800 text-stone-100 border-stone-700" : "text-stone-500 hover:text-stone-300 bg-stone-900 border-stone-800/60"}`}
        >
          Profile
        </button>
        <button
          onClick={() => setTab("preferences")}
          className={`flex-1 py-2.5 rounded-r-2xl text-sm font-semibold border-y border-r transition-colors ${tab === "preferences" ? "bg-stone-800 text-stone-100 border-stone-700" : "text-stone-500 hover:text-stone-300 bg-stone-900 border-stone-800/60"}`}
        >
          Account settings
        </button>
      </div>

      {tab === "profile" && (
        <div className="space-y-10">
          <section>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Photo</h2>
            <AvatarUpload userId={userId} username={username} avatarUrl={avatarUrl} />
          </section>
          <section>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Bio & links</h2>
            <ProfileSettings bio={bio} spotifyUrl={spotifyUrl} />
          </section>
          <section>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Theme</h2>
            <ThemeSettings />
          </section>
          <section>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-5">Feedback</h2>
            <FeedbackForm userId={userId} username={username} />
          </section>
        </div>
      )}

      {tab === "preferences" && (
        <div className="space-y-10">
          <section>
            <AccountSettings username={username} email={email} />
          </section>
        </div>
      )}
    </div>
  );
}

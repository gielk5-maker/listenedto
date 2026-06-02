"use client";

import { useState } from "react";
import { wijzigUsername, wijzigWachtwoord } from "@/app/actions/settings";

export default function AccountSettings({ username }: { username: string }) {
  const [newUsername, setNewUsername] = useState(username);
  const [usernameMsg, setUsernameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleUsername(e: React.FormEvent) {
    e.preventDefault();
    if (newUsername.trim() === username) return;
    setUsernameLoading(true);
    setUsernameMsg(null);
    const result = await wijzigUsername(newUsername);
    setUsernameLoading(false);
    if (result?.error) setUsernameMsg({ type: "err", text: result.error });
    else setUsernameMsg({ type: "ok", text: "Username updated!" });
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "Passwords don't match" }); return; }
    setPwLoading(true);
    setPwMsg(null);
    const result = await wijzigWachtwoord(currentPw, newPw);
    setPwLoading(false);
    if (result?.error) setPwMsg({ type: "err", text: result.error });
    else {
      setPwMsg({ type: "ok", text: "Password updated!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Username */}
      <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800/60">
        <h3 className="font-bold text-stone-100 mb-4">Username</h3>
        <form onSubmit={handleUsername} className="space-y-3">
          <input
            type="text"
            value={newUsername}
            onChange={(e) => { setNewUsername(e.target.value); setUsernameMsg(null); }}
            placeholder="yourusername"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          {usernameMsg && (
            <p className={`text-sm px-4 py-2.5 rounded-xl border ${
              usernameMsg.type === "ok"
                ? "text-green-400 bg-green-950/30 border-green-900/50"
                : "text-red-400 bg-red-950/30 border-red-900/50"
            }`}>{usernameMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={usernameLoading || newUsername.trim() === username || !newUsername.trim()}
            className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-xl px-5 py-2.5 text-sm transition-opacity"
          >
            {usernameLoading ? "Saving..." : "Save username"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800/60">
        <h3 className="font-bold text-stone-100 mb-4">Password</h3>
        <form onSubmit={handlePassword} className="space-y-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => { setCurrentPw(e.target.value); setPwMsg(null); }}
            placeholder="Current password"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwMsg(null); }}
            placeholder="New password"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => { setConfirmPw(e.target.value); setPwMsg(null); }}
            placeholder="Confirm new password"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
          {pwMsg && (
            <p className={`text-sm px-4 py-2.5 rounded-xl border ${
              pwMsg.type === "ok"
                ? "text-green-400 bg-green-950/30 border-green-900/50"
                : "text-red-400 bg-red-950/30 border-red-900/50"
            }`}>{pwMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-xl px-5 py-2.5 text-sm transition-opacity"
          >
            {pwLoading ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

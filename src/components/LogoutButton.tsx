"use client";

import { useState } from "react";
import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">Log out?</span>
        <form action={logout} className="inline">
          <button type="submit" className="text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
            Yes
          </button>
        </form>
        <button onClick={() => setConfirm(false)} className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} className="text-xs text-stone-700 hover:text-stone-400 transition-colors">
      Log out
    </button>
  );
}

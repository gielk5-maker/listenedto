"use client";

import { useEffect } from "react";
import { themas, type ThemaId } from "@/lib/themas";

export function pasThemaToe(id: ThemaId) {
  const vars = themas[id] ?? themas.green;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default function ThemeApplicator({ dbTheme }: { dbTheme?: string }) {
  useEffect(() => {
    // If server knows the DB theme, use it as source of truth
    if (dbTheme) {
      localStorage.setItem("theme", dbTheme);
      pasThemaToe(dbTheme as ThemaId);
    } else {
      const id = (localStorage.getItem("theme") ?? "green") as ThemaId;
      pasThemaToe(id);
    }
  }, [dbTheme]);

  return null;
}

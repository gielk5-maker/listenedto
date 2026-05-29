"use client";

import { useEffect } from "react";
import { themas, type ThemaId } from "@/lib/themas";

export function pasThemaToe(id: ThemaId) {
  const vars = themas[id] ?? themas.amber;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default function ThemeApplicator() {
  useEffect(() => {
    const id = (localStorage.getItem("theme") ?? "amber") as ThemaId;
    pasThemaToe(id);
  }, []);

  return null;
}

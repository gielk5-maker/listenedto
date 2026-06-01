"use client";

import { useState, useEffect, useTransition } from "react";
import { slaThemaOp } from "@/app/actions/theme";

const THEMAS = {
  green:  { label: "Green",  accent: "#22c55e", dark: "#15803d", text: "#0c0a09",
    vars: { "--accent":"#22c55e","--accent-hover":"#4ade80","--accent-dark":"#15803d","--accent-text":"#0c0a09","--glow-1":"rgba(34,197,94,0.45)","--glow-2":"rgba(21,128,61,0.35)","--glow-3":"rgba(20,83,45,0.18)" } },
  amber:  { label: "Amber",  accent: "#f59e0b", dark: "#ea580c", text: "#0c0a09",
    vars: { "--accent":"#f59e0b","--accent-hover":"#fbbf24","--accent-dark":"#ea580c","--accent-text":"#0c0a09","--glow-1":"rgba(251,146,60,0.45)","--glow-2":"rgba(245,158,11,0.35)","--glow-3":"rgba(234,88,12,0.18)" } },
  red:    { label: "Red",    accent: "#ef4444", dark: "#dc2626", text: "#ffffff",
    vars: { "--accent":"#ef4444","--accent-hover":"#f87171","--accent-dark":"#dc2626","--accent-text":"#ffffff","--glow-1":"rgba(239,68,68,0.45)","--glow-2":"rgba(220,38,38,0.35)","--glow-3":"rgba(185,28,28,0.18)" } },
  blue:   { label: "Blue",   accent: "#3b82f6", dark: "#1d4ed8", text: "#ffffff",
    vars: { "--accent":"#3b82f6","--accent-hover":"#60a5fa","--accent-dark":"#1d4ed8","--accent-text":"#ffffff","--glow-1":"rgba(59,130,246,0.45)","--glow-2":"rgba(29,78,216,0.35)","--glow-3":"rgba(30,64,175,0.18)" } },
  yellow: { label: "Yellow", accent: "#eab308", dark: "#ca8a04", text: "#0c0a09",
    vars: { "--accent":"#eab308","--accent-hover":"#facc15","--accent-dark":"#ca8a04","--accent-text":"#0c0a09","--glow-1":"rgba(234,179,8,0.45)","--glow-2":"rgba(202,138,4,0.35)","--glow-3":"rgba(161,110,3,0.18)" } },
  purple: { label: "Purple", accent: "#a855f7", dark: "#7e22ce", text: "#ffffff",
    vars: { "--accent":"#a855f7","--accent-hover":"#c084fc","--accent-dark":"#7e22ce","--accent-text":"#ffffff","--glow-1":"rgba(168,85,247,0.45)","--glow-2":"rgba(126,34,206,0.35)","--glow-3":"rgba(107,33,168,0.18)" } },
} as const;

type ThemaId = keyof typeof THEMAS;

export default function ThemeSettings() {
  const [active, setActive] = useState<ThemaId>("green");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = (localStorage.getItem("theme") ?? "green") as ThemaId;
    setActive(saved);
  }, []);

  function pick(id: ThemaId) {
    const vars = THEMAS[id].vars;
    const r = document.documentElement;
    for (const [k, v] of Object.entries(vars)) r.style.setProperty(k, v);
    localStorage.setItem("theme", id);
    setActive(id);
    // Save to database so it persists across devices/logins
    startTransition(() => slaThemaOp(id));
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {(Object.entries(THEMAS) as [ThemaId, typeof THEMAS[ThemaId]][]).map(([id, t]) => (
        <button
          key={id}
          onClick={() => pick(id)}
          className={`relative text-left rounded-2xl overflow-hidden border transition-all ${
            active === id
              ? "border-white/30 ring-2 ring-white/20"
              : "border-stone-800 hover:border-stone-600"
          } bg-stone-900`}
        >
          {/* Active checkmark */}
          {active === id && (
            <span className="absolute top-3 right-3 text-white text-xs font-bold">✓</span>
          )}

          <div className="p-4">
            {/* Color pill */}
            <div
              className="h-2.5 w-12 rounded-full mb-3"
              style={{ background: `linear-gradient(to right, ${t.accent}, ${t.dark})` }}
            />

            {/* Theme name */}
            <p className="font-bold text-sm mb-3" style={{ color: t.accent }}>{t.label}</p>

            {/* Mini UI preview */}
            <div className="space-y-2">
              {/* Fake radio row */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: t.accent }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent }} />
                </div>
                <div className="h-2 rounded-full bg-stone-700 flex-1" />
              </div>
              {/* Fake content lines */}
              <div className="h-2 rounded-full bg-stone-800 w-full" />
              <div className="h-2 rounded-full bg-stone-800 w-3/4" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

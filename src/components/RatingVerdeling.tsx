"use client";

import { useState } from "react";

type Props = {
  verdeling: Record<string, number>;
  totaal: number;
};

export default function RatingVerdeling({ verdeling, totaal }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const scores = ["5", "4.5", "4", "3.5", "3", "2.5", "2", "1.5", "1", "0.5"];
  const max = Math.max(...Object.values(verdeling), 1);

  return (
    <div className="space-y-1.5">
      {scores.map((score) => {
        const count = verdeling[score] ?? 0;
        const pct = Math.round((count / totaal) * 100);
        const barWidth = (count / max) * 100;
        const isHovered = hovered === score;

        return (
          <div
            key={score}
            className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setHovered(score)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="text-stone-600 text-xs w-6 text-right flex-shrink-0">{score}</span>
            <div className="flex-1 bg-stone-800 rounded-full h-2 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: isHovered ? "var(--accent-hover)" : "var(--accent)",
                }}
              />
            </div>
            <div className="w-16 flex-shrink-0 text-right">
              {count > 0 ? (
                <span className={`text-xs transition-colors ${isHovered ? "text-stone-200" : "text-stone-600"}`}>
                  {isHovered ? `${count} · ${pct}%` : count}
                </span>
              ) : (
                <span className="text-xs text-stone-800">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

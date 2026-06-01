"use client";

import { useState } from "react";

type Props = {
  verdeling: Record<string, number>;
  totaal: number;
};

export default function RatingVerdeling({ verdeling, totaal }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const scores = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];
  const max = Math.max(...scores.map(s => verdeling[s] ?? 0), 1);

  return (
    <div className="w-full">
      {/* Bars */}
      <div className="flex items-end gap-1 h-24">
        {scores.map((score) => {
          const count = verdeling[score] ?? 0;
          const heightPct = (count / max) * 100;
          const pct = totaal > 0 ? Math.round((count / totaal) * 100) : 0;
          const isHovered = hovered === score;

          return (
            <div
              key={score}
              className="flex-1 flex flex-col items-center justify-end h-full cursor-default"
              onMouseEnter={() => setHovered(score)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              <div className={`text-[10px] mb-1 transition-opacity text-center leading-tight ${isHovered && count > 0 ? "opacity-100" : "opacity-0"}`}>
                <span className="text-stone-200 font-semibold">{count}</span>
                <br />
                <span className="text-stone-500">{pct}%</span>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-150"
                style={{
                  height: count > 0 ? `${Math.max(heightPct, 4)}%` : "2px",
                  backgroundColor: count === 0
                    ? "rgb(41,37,36)"
                    : isHovered
                    ? "var(--accent-hover)"
                    : "var(--accent)",
                  opacity: count === 0 ? 0.3 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Score labels */}
      <div className="flex gap-1 mt-1.5">
        {scores.map((score) => (
          <div key={score} className="flex-1 text-center">
            <span className={`text-[9px] transition-colors ${hovered === score ? "text-stone-300" : "text-stone-700"}`}>
              {score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

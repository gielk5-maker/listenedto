"use client";

import { useState } from "react";

type Props = {
  verdeling: Record<string, number>;
  totaal: number;
};

const BAR_MAX_PX = 80;

export default function RatingVerdeling({ verdeling, totaal }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const scores = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];
  const max = Math.max(...scores.map(s => verdeling[s] ?? 0), 1);

  return (
    <div className="w-full">
      {/* Bars */}
      <div className="flex items-end gap-1" style={{ height: `${BAR_MAX_PX + 28}px` }}>
        {scores.map((score) => {
          const count = verdeling[score] ?? 0;
          const barPx = count > 0 ? Math.max(Math.round((count / max) * BAR_MAX_PX), 3) : 2;
          const pct = totaal > 0 ? Math.round((count / totaal) * 100) : 0;
          const isHovered = hovered === score;

          return (
            <div
              key={score}
              className="flex-1 flex flex-col items-center justify-end cursor-default"
              style={{ height: `${BAR_MAX_PX + 28}px` }}
              onMouseEnter={() => setHovered(score)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              <div className={`text-[10px] mb-1 transition-opacity text-center leading-tight h-7 flex flex-col items-center justify-end ${isHovered && count > 0 ? "opacity-100" : "opacity-0"}`}>
                <span className="text-stone-200 font-semibold">{count}</span>
                <span className="text-stone-500">{pct}%</span>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-150"
                style={{
                  height: `${barPx}px`,
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

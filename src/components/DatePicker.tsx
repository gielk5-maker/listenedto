"use client";

import { useState, useEffect, useRef } from "react";

export default function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + "T00:00:00") : null;

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const blanks = (firstDay + 6) % 7;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  }
  function nextMonth() {
    const next = view.month === 11 ? { year: view.year + 1, month: 0 } : { ...view, month: view.month + 1 };
    if (new Date(next.year, next.month, 1) <= today) setView(next);
  }

  function selectDay(day: number) {
    const d = new Date(view.year, view.month, day);
    if (d > today) return;
    const iso = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  }

  const isNextDisabled = new Date(view.year, view.month + 1, 1) > today;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 flex items-center justify-between hover:border-stone-600 transition-colors">
        <span className={`text-sm ${selected ? "text-stone-50" : "text-stone-600"}`}>
          {selected
            ? selected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
            : "Select a date"}
        </span>
        <svg className="w-4 h-4 text-stone-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-stone-900 border border-stone-700/60 rounded-2xl p-4 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-stone-200">{monthNames[view.month]} {view.year}</span>
            <button type="button" onClick={nextMonth} disabled={isNextDisabled}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
              <div key={d} className="text-center text-[10px] text-stone-600 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const d = new Date(view.year, view.month, day);
              const isSelected = selected && d.getTime() === selected.getTime();
              const isToday = d.getTime() === today.getTime();
              const isFuture = d > today;
              return (
                <button key={day} type="button" onClick={() => selectDay(day)} disabled={isFuture}
                  className={`text-xs h-8 w-full rounded-lg font-medium transition-colors
                    ${isSelected ? "bg-[var(--accent)] text-[var(--accent-text)]" : ""}
                    ${!isSelected && isToday ? "text-[var(--accent)] font-bold" : ""}
                    ${!isSelected && !isFuture ? "hover:bg-stone-800 text-stone-300" : ""}
                    ${isFuture ? "text-stone-700 cursor-not-allowed" : ""}
                  `}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

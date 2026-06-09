"use client";

import { useState, useTransition, useRef, useLayoutEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateListItemPositions, verwijderAlbumUitLijst, toggleRanking } from "@/app/actions/profile";

type Item = {
  id: string;
  album_name: string;
  artist_name: string;
  album_image: string | null;
  album_url: string | null;
  position: number;
};

type Props = {
  listId: string;
  initialItems: Item[];
  isEigenaar: boolean;
  isRanking: boolean;
};

export default function LijstItemsBeheer({ listId, initialItems, isEigenaar, isRanking: initRanking }: Props) {
  const [items, setItems] = useState([...initialItems].sort((a, b) => a.position - b.position));
  const [isRanking, setIsRanking] = useState(initRanking);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // FLIP animation: track DOM positions before/after reorder
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevPositions = useRef<Map<string, number>>(new Map());

  // Snapshot y-positions before state update
  const snapshotPositions = useCallback(() => {
    const map = new Map<string, number>();
    rowRefs.current.forEach((el, i) => {
      if (el && items[i]) map.set(items[i].id, el.getBoundingClientRect().top);
    });
    prevPositions.current = map;
  }, [items]);

  // After render, animate items from their old positions to new ones
  useLayoutEffect(() => {
    rowRefs.current.forEach((el, i) => {
      if (!el || !items[i]) return;
      const prev = prevPositions.current.get(items[i].id);
      if (prev === undefined) return;
      const curr = el.getBoundingClientRect().top;
      const delta = prev - curr;
      if (delta === 0) return;

      // Snap to old position instantly, then animate to 0
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px)`;
      // Force reflow
      void el.offsetHeight;
      el.style.transition = "transform 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.transform = "translateY(0)";
    });
    prevPositions.current = new Map();
  });

  function move(from: number, to: number) {
    snapshotPositions();
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    const withPos = updated.map((item, i) => ({ ...item, position: i }));
    setItems(withPos);
    startTransition(() => updateListItemPositions(withPos.map(({ id, position }) => ({ id, position }))));
  }

  function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    startTransition(() => verwijderAlbumUitLijst(id, listId));
  }

  function handleToggleRanking() {
    const next = !isRanking;
    setIsRanking(next);
    startTransition(() => toggleRanking(listId, next));
  }

  function albumHref(item: Item) {
    return `/album?name=${encodeURIComponent(item.album_name)}&artist=${encodeURIComponent(item.artist_name)}${item.album_image ? `&image=${encodeURIComponent(item.album_image)}` : ""}${item.album_url ? `&url=${encodeURIComponent(item.album_url)}` : ""}`;
  }

  return (
    <div>
      {/* Ranking toggle */}
      {isEigenaar && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleToggleRanking}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${isRanking ? "bg-[var(--accent)]" : "bg-stone-700"}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isRanking ? "left-5" : "left-1"}`} />
          </button>
          <span className="text-sm text-stone-400">Ranking</span>
          {isRanking && <span className="text-xs text-stone-600">Numbers shown — drag to reorder</span>}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 bg-stone-900/60 rounded-3xl border border-stone-800">
          <p className="text-stone-600">No albums in this list yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={item.id}
              ref={el => { rowRefs.current[i] = el; }}
              draggable={isEigenaar}
              onDragStart={e => {
                setDragIdx(i);
                // Set drag image to the whole row
                e.dataTransfer.effectAllowed = "move";
                const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
                ghost.style.cssText = "position:fixed;top:-9999px;opacity:0.85;pointer-events:none;";
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
                setTimeout(() => document.body.removeChild(ghost), 0);
              }}
              onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== i) move(dragIdx, i);
                setDragIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              className={`group flex items-center gap-3 bg-stone-900 rounded-2xl p-3 border transition-colors ${
                dragIdx === i
                  ? "border-[var(--accent)] opacity-40"
                  : dragOverIdx === i && dragIdx !== null
                  ? "border-[var(--accent)] bg-stone-800"
                  : "border-stone-800/40 hover:border-stone-700"
              } ${isEigenaar ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              {/* Position number or drag handle */}
              {isRanking ? (
                <span className="text-stone-500 text-sm w-6 text-right flex-shrink-0 font-bold">{i + 1}</span>
              ) : isEigenaar ? (
                <span className="text-stone-700 w-6 flex-shrink-0 text-center text-base select-none">⠿</span>
              ) : null}

              {/* Album — draggable=false prevents the link from hijacking drag */}
              <Link href={albumHref(item)} draggable={false} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-stone-800">
                  {item.album_image
                    ? <Image src={item.album_image} alt={item.album_name} width={48} height={48} className="object-cover w-full h-full" draggable={false} />
                    : <div className="w-full h-full bg-stone-800" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-stone-100">{item.album_name}</p>
                  <p className="text-stone-500 text-xs truncate">{item.artist_name}</p>
                </div>
              </Link>

              {/* Move buttons + delete */}
              {isEigenaar && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => i > 0 && move(i, i - 1)}
                    disabled={i === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-700 text-stone-500 hover:text-stone-200 disabled:opacity-20 transition-colors text-xs"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => i < items.length - 1 && move(i, i + 1)}
                    disabled={i === items.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-700 text-stone-500 hover:text-stone-200 disabled:opacity-20 transition-colors text-xs"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-800 text-stone-700 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { finishLagoon } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { LEVELS, walk, type Dir } from "@/lib/games/lagoon";
import { mochiSend } from "@/lib/mochi/bus";

const arrows: { dir: Dir; label: string; fr: string; en: string }[] = [
  { dir: "up", label: "↑", fr: "Haut", en: "Up" },
  { dir: "right", label: "→", fr: "Droite", en: "Right" },
  { dir: "down", label: "↓", fr: "Bas", en: "Down" },
  { dir: "left", label: "←", fr: "Gauche", en: "Left" },
];

export function LagoonPlay({ copy, lang }: { copy: Copy; lang: "fr" | "en" }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<Dir[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const level = LEVELS[levelIndex];
  const place = level ? walk(level, path).end : null;

  async function onGo() {
    if (!level) return;
    setBusy(true);
    const result = await finishLagoon(level.id, path);
    setBusy(false);
    if (!result.cleared) {
      mochiSend({ type: "wrong" });
      setPath([]);
      return;
    }
    mochiSend({ type: "correct" });
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(levelIndex + 1);
      setPath([]);
      return;
    }
    setStars(result.stars);
  }

  if (!level || stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <Link href="/kid/games" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="mx-auto grid grid-cols-4 gap-1">
        {Array.from({ length: 16 }, (_, index) => {
          const x = index % 4;
          const y = Math.floor(index / 4);
          const wall = level.walls.some((cell) => cell.x === x && cell.y === y);
          const berry = level.berry.x === x && level.berry.y === y;
          const mochi = place?.x === x && place?.y === y;
          return (
            <div key={`${x}-${y}`} className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl ${wall ? "bg-white/10" : "bg-white/25"}`}>
              {mochi ? "🐱" : berry ? "🍓" : ""}
            </div>
          );
        })}
      </div>
      <p className="text-center text-2xl">{path.map((dir) => arrows.find((arrow) => arrow.dir === dir)?.label).join(" ")}</p>
      <div className="grid grid-cols-4 gap-3">
        {arrows.map((arrow) => (
          <button
            key={arrow.dir}
            type="button"
            disabled={path.length >= 8}
            aria-label={arrow[lang]}
            onClick={() => setPath([...path, arrow.dir])}
            className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum"
          >
            {arrow.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => void onGo()} disabled={busy || path.length === 0} className="flex h-16 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.go}
      </button>
      <Link href="/kid/games" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

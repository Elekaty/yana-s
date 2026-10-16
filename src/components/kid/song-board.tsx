"use client";

import { useState } from "react";
import Link from "next/link";
import { finishSong } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { FRERE_JACQUES, PADS, playNote } from "@/lib/games/cove";

export function SongBoard({ copy, lang }: { copy: Copy; lang: "fr" | "en" }) {
  const [heard, setHeard] = useState<string[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const next = FRERE_JACQUES[heard.length];

  async function tap(id: string, freq: number) {
    playNote(freq);
    if (stars !== null || id !== next) return;
    const notes = [...heard, id];
    setHeard(notes);
    if (notes.length === FRERE_JACQUES.length) {
      const result = await finishSong(notes);
      setStars(result.stars);
    }
  }

  if (stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars} {copy.stars}
        </p>
        <Link href="/kid/games/cove" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {PADS.map((pad) => (
        <button
          key={pad.id}
          type="button"
          onClick={() => void tap(pad.id, pad.freq)}
          aria-label={pad.id === "C5" ? (lang === "en" ? "High do" : "Do aigu") : pad.label}
          className={`flex h-14 items-center justify-center rounded-2xl text-xl text-plum ${pad.id === next ? "bg-sun" : "bg-white"}`}
        >
          {pad.label}
        </button>
      ))}
      <Link href="/kid/games/cove" className="col-span-4 flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl text-white">
        {copy.back}
      </Link>
    </div>
  );
}

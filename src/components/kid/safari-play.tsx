"use client";

import { useState } from "react";
import Link from "next/link";
import { finishSafari } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { animalById, safariAt } from "@/lib/games/safari";
import { speak } from "@/lib/speak";

export function SafariPlay({ lang, copy, tags }: { lang: "fr" | "en"; copy: Copy; tags?: string[] }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const round = safariAt(index, tags);
  const answer = animalById(round.answer);

  async function choose(id: string) {
    if (id !== round.answer) return;
    const animal = animalById(id);
    if (animal) speak({ text: animal[lang], lang });
    const next = [...picks, id];
    setPicks(next);
    if (next.length < 5) {
      setIndex(index + 1);
      return;
    }
    const result = await finishSafari(next, tags);
    setStars(result.stars);
  }

  if (!answer || stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars ?? 0} {copy.stars}
        </p>
        <Link href="/kid/games/bay/more" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-3xl">{lang === "en" ? `Find: ${answer.en}` : `Trouve : ${answer.fr}`}</p>
      {round.choices.map((id) => {
        const animal = animalById(id);
        return (
          <button key={id} type="button" aria-label={animal?.[lang] ?? id} onClick={() => void choose(id)} className="flex h-14 items-center justify-center rounded-full bg-sun text-3xl">
            {animal?.emoji}
          </button>
        );
      })}
    </div>
  );
}

export const WordSafari = SafariPlay;

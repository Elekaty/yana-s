"use client";

import { useState } from "react";
import { KidBack } from "@/components/kid/kid-back";
import { finishSafari } from "@/app/kid/games/island-actions";
import { kidPlaces } from "@/lib/kid/places";
import type { Copy } from "@/lib/i18n";
import { animalById, safariAt } from "@/lib/games/safari";
import { mochiSend } from "@/lib/mochi/bus";
import { speak } from "@/lib/speak";

export function SafariPlay({ lang, copy, tags }: { lang: "fr" | "en"; copy: Copy; tags?: string[] }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const round = safariAt(index, tags);
  const answer = animalById(round.answer);

  async function choose(id: string) {
    if (id !== round.answer) {
      mochiSend({ type: "wrong" });
      return;
    }
    mochiSend({ type: "correct" });
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
        <KidBack href={kidPlaces.words} label={copy.back} />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <KidBack href={kidPlaces.words} label={copy.back} />
      <p className="text-center text-3xl">{lang === "en" ? `Find: ${answer.en}` : `Trouve : ${answer.fr}`}</p>
      {round.choices.map((id) => {
        const animal = animalById(id);
        return (
          <button key={id} type="button" aria-label={animal?.[lang] ?? id} onClick={() => void choose(id)} className="flex h-16 items-center justify-center rounded-full bg-sun text-3xl">
            {animal?.emoji}
          </button>
        );
      })}
    </div>
  );
}

export const WordSafari = SafariPlay;

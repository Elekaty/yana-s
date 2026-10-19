"use client";

import { useState } from "react";
import Link from "next/link";
import { finishStory } from "@/app/kid/games/voice/actions";
import type { Copy } from "@/lib/i18n";
import { speak } from "@/lib/speak";

export function StoryReader({
  slug,
  pages,
  lang,
  voiceOn,
  backHref,
  copy,
}: {
  slug: string;
  pages: { fr: string; en: string }[];
  lang: "fr" | "en";
  voiceOn: boolean;
  backHref: string;
  copy: Copy;
}) {
  const [page, setPage] = useState(0);
  const [stars, setStars] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const current = pages[page];

  async function onNext() {
    if (page < pages.length - 1) {
      setPage(page + 1);
      return;
    }
    setBusy(true);
    const result = await finishStory(slug);
    setStars(result.stars);
    setBusy(false);
  }

  if (!current || stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars ? `${stars} ${copy.stars}` : lang === "en" ? "A parent can mark that you read it." : "Un parent peut dire que tu l'as lue."}
        </p>
        <Link href={backHref} className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-3xl">{current[lang]}</p>
      <button
        type="button"
        disabled={!voiceOn}
        onClick={() => speak({ text: current[lang], lang })}
        className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum"
      >
        {copy.listen}
      </button>
      <button type="button" onClick={() => void onNext()} disabled={busy} className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.next}
      </button>
      <Link href={backHref} className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

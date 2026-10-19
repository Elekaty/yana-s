"use client";

import Link from "next/link";
import type { Copy } from "@/lib/i18n";
import { phrases } from "@/lib/phrases";
import { speak } from "@/lib/speak";

export function AlbumCard({
  src,
  reaction,
  lang,
  nextHref,
  backHref,
  copy,
}: {
  src: string;
  reaction: string | null;
  lang: "fr" | "en";
  nextHref: string;
  backHref: string;
  copy: Copy;
}) {
  function play() {
    const audio = new Audio(src);
    void audio.play();
    if (reaction) speak({ text: phrases.voiceLiked[lang], lang });
  }

  return (
    <div className="grid gap-4">
      {reaction ? <p className="text-center text-4xl">{reaction}</p> : null}
      <button type="button" onClick={play} className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        {copy.listen}
      </button>
      <Link href={nextHref} className="flex h-16 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.next}
      </Link>
      <Link href={backHref} className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

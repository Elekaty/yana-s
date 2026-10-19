"use client";

import Link from "next/link";
import { useState } from "react";
import { Salon } from "@/components/mochi/salon";
import { checkInNow, meetFriend } from "@/app/kid/actions";
import type { BubbleFriend } from "@/lib/mochi";
import type { Copy } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export function HomeScreen({
  childName,
  lang,
  stars,
  copy,
  voice = true,
  crew = [],
  checkedIn = false,
  helper,
}: {
  childName: string;
  lang: "fr" | "en";
  stars: number;
  copy: Copy;
  voice?: boolean;
  crew?: BubbleFriend[];
  checkedIn?: boolean;
  helper: { icon: string; text: string };
}) {
  const [balance, setBalance] = useState(stars);
  const [here, setHere] = useState(checkedIn);
  const [note, setNote] = useState("");

  async function checkIn() {
    const result = await checkInNow();
    setBalance(result.stars);
    if (result.note === "ok" || result.note === "week" || result.note === "already") setHere(true);
    setNote(result.note === "ok" || result.note === "week" || result.note === "already" ? copy.checkInDone : copy.checkInClosed);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Link href="/parent/unlock" aria-label={copy.parents} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl">
          🔒
        </Link>
        <p className="rounded-full bg-sun px-4 py-2 text-lg font-semibold text-plum shadow-[0_6px_0_#e0b520]">{balance} ★</p>
      </div>
      <div className="overflow-hidden rounded-[28px] p-1 shadow-[0_0_0_4px_#FFD23F]">
        <Salon
          forced={null}
          childName={childName}
          lang={lang}
          voice={voice}
          crew={crew}
          greet
          compact
          onMeetFriend={(friend: BubbleFriend) => {
            void meetFriend(friend).then((result) => {
              if (result.fresh) setBalance(result.stars);
            });
          }}
        />
      </div>
      <Link data-primary="true" href="/kid/homework" className="flex h-16 items-center justify-center gap-2 rounded-full bg-grape text-2xl text-white shadow-[0_6px_0_#5b21b6]">
        <span aria-hidden>✏️</span>
        {copy.homework}
      </Link>
      <Link data-primary="true" href="/kid/games" className="flex h-16 items-center justify-center gap-2 rounded-full bg-hot text-2xl text-white shadow-[0_6px_0_#c4186e]">
        <span aria-hidden>🎮</span>
        {copy.play}
      </Link>
      <Link data-primary="true" href={kidPlaces.words} className="flex h-16 items-center justify-center gap-2 rounded-full bg-sun text-2xl text-plum shadow-[0_6px_0_#e0b520]">
        <span aria-hidden>🗣️</span>
        {copy.words}
      </Link>
      <div className="flex items-center gap-3">
        <Link href={kidPlaces.corner} className="flex h-16 flex-1 items-center justify-center rounded-full bg-white/15 text-sm">
          🎒 {copy.corner}
        </Link>
        <p className="flex h-16 flex-1 items-center justify-center rounded-full bg-white/10 text-sm" aria-label={lang === "en" ? "Tonight" : "Ce soir"}>
          {helper.icon} {helper.text}
        </p>
        {here ? null : (
          <button type="button" onClick={() => void checkIn()} className="flex h-16 flex-1 items-center justify-center rounded-full bg-white/15 text-sm">
            {note || `✋ ${copy.checkIn}`}
          </button>
        )}
      </div>
    </div>
  );
}

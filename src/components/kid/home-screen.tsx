"use client";

import Link from "next/link";
import { useState } from "react";
import { Salon } from "@/components/mochi/salon";
import { checkInNow, meetFriend } from "@/app/kid/actions";
import type { BubbleFriend } from "@/lib/mochi";
import type { Copy } from "@/lib/i18n";

export function HomeScreen({
  childName,
  lang,
  stars,
  today,
  copy,
  nudge,
}: {
  childName: string;
  lang: "fr" | "en";
  stars: number;
  today: string;
  copy: Copy;
  nudge?: string;
}) {
  const [balance, setBalance] = useState(stars);
  const [note, setNote] = useState("");

  async function checkIn() {
    const result = await checkInNow();
    setBalance(result.stars);
    setNote(result.note === "ok" || result.note === "week" ? copy.checkInDone : result.note === "already" ? copy.checkInDone : copy.checkInClosed);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-sun">{copy.hello}</p>
          <h1 className="text-4xl leading-none">{childName || "Yana"}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="rounded-full bg-sun px-4 py-2 text-lg font-semibold text-plum shadow-[0_6px_0_#e0b520]">{balance} ★</p>
          <button type="button" onClick={() => void checkIn()} className="h-14 rounded-full bg-white/15 px-4 text-lg">
            {copy.checkIn}
          </button>
        </div>
      </div>
      {note ? <p className="rounded-2xl bg-white/10 px-4 py-3 text-xl">{note}</p> : null}
      {nudge ? <p className="rounded-2xl bg-hot/90 px-4 py-3 text-xl">{nudge}</p> : null}
      <div className="rounded-[32px] p-1 shadow-[0_0_0_4px_#FFD23F]">
        <Salon
          forced={null}
          childName={childName}
          lang={lang}
          onMeetFriend={(friend: BubbleFriend) => {
            void meetFriend(friend).then((result) => {
              if (result.fresh) setBalance(result.stars);
            });
          }}
        />
      </div>
      <section className="rounded-[28px] bg-sun px-4 py-4 text-plum shadow-[0_8px_0_#e0b520]">
        <p className="text-sm font-semibold">{copy.today}</p>
        <p className="text-2xl">{today || copy.noHomework}</p>
        <Link href="/kid/homework" className="mt-3 flex h-14 items-center justify-center rounded-full bg-plum text-lg text-white">
          {copy.homeworkGo}
        </Link>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/kid/store" className="flex h-16 items-center justify-center rounded-full bg-hot text-lg shadow-[0_6px_0_#c4186e]">
          {copy.store}
        </Link>
        <Link href="/parent/unlock" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-lg ring-2 ring-white/30">
          {copy.parents}
        </Link>
      </div>
    </div>
  );
}

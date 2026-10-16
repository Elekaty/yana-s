"use client";

import Link from "next/link";
import { useState } from "react";
import { Salon } from "@/components/mochi/salon";
import { meetFriend } from "@/app/kid/actions";
import type { BubbleFriend } from "@/lib/mochi";
import type { Copy } from "@/lib/i18n";

export function HomeScreen({
  childName,
  lang,
  stars,
  today,
  copy,
}: {
  childName: string;
  lang: "fr" | "en";
  stars: number;
  today: string;
  copy: Copy;
}) {
  const [balance, setBalance] = useState(stars);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xl">
        {balance} {copy.stars}
      </p>
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
      <section className="rounded-3xl bg-sun px-4 py-4 text-plum">
        <p className="text-sm">{copy.today}</p>
        <p className="text-2xl">{today || copy.noHomework}</p>
        <Link href="/kid/homework" className="mt-3 flex h-14 items-center justify-center rounded-full bg-plum text-lg text-white">
          {copy.homeworkGo}
        </Link>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/kid/store" className="flex h-14 items-center justify-center rounded-full bg-hot text-lg">
          {copy.store}
        </Link>
        <Link href="/parent/unlock" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-lg">
          {copy.parents}
        </Link>
      </div>
    </div>
  );
}

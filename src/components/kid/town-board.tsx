"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { buyPlot } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { phrases } from "@/lib/phrases";
import { speak } from "@/lib/speak";
import { TOWN_ITEMS, townItem } from "@/lib/games/town";

const friendColor: Record<string, string> = {
  bunny: "#f7c6d8",
  panda: "#f4f4f5",
  fox: "#fb923c",
  corgi: "#f6c453",
  hamster: "#e7c39a",
};

export function TownBoard({
  lang,
  copy,
  balance,
  plots,
  friends,
}: {
  lang: "fr" | "en";
  copy: Copy;
  balance: number;
  plots: { slot: number; item: string }[];
  friends: string[];
}) {
  const reduced = useReducedMotion();
  const [stars, setStars] = useState(balance);
  const [placed, setPlaced] = useState(plots);
  const [slot, setSlot] = useState<number | null>(firstEmpty(plots));
  const [itemIndex, setItemIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const item = TOWN_ITEMS[itemIndex];
  const full = placed.length >= 12;

  async function buy() {
    if (slot === null || busy) return;
    setBusy(true);
    const result = await buyPlot(slot, item.id);
    setBusy(false);
    if (!result.ok) return;
    const next = [...placed, { slot, item: item.id }];
    setPlaced(next);
    setStars(result.balance);
    setSlot(firstEmpty(next));
    if (next.length >= 12) speak({ text: phrases.townDone[lang], lang });
  }

  function press(index: number) {
    const found = placed.find((plot) => plot.slot === index);
    if (!found) {
      setSlot(index);
      return;
    }
    const named = townItem(found.item);
    if (named) speak({ text: named[lang], lang });
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-xl">
        {stars} {copy.stars}
      </p>
      {full ? <p className="text-center text-2xl">{phrases.townDone[lang]}</p> : null}
      <div className="relative grid grid-cols-4 gap-2">
        {friends.map((friend, index) => (
          <motion.span
            key={friend}
            className="pointer-events-none absolute h-4 w-4 rounded-full"
            style={{ background: friendColor[friend] ?? "#fff", top: 8 }}
            animate={reduced ? { left: 8 + index * 16 } : { left: [8, 180, 8] }}
            transition={reduced ? undefined : { duration: 8, delay: index, repeat: Infinity }}
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => {
          const found = placed.find((plot) => plot.slot === index);
          const named = found ? townItem(found.item) : null;
          return (
            <button
              key={index}
              type="button"
              onClick={() => press(index)}
              className={`flex h-14 items-center justify-center rounded-xl text-sm ${slot === index ? "bg-sun text-plum" : "bg-white/20"}`}
            >
              {named ? named[lang] : index + 1}
            </button>
          );
        })}
      </div>
      <p className="text-center text-2xl">
        {item[lang]} · {item.cost}
      </p>
      <button type="button" onClick={() => void buy()} disabled={busy || full || slot === null} className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.buy}
      </button>
      <button type="button" onClick={() => setItemIndex((itemIndex + 1) % TOWN_ITEMS.length)} className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.next}
      </button>
      <Link href="/kid/store" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

function firstEmpty(plots: { slot: number }[]) {
  for (let slot = 0; slot < 12; slot += 1) {
    if (!plots.some((plot) => plot.slot === slot)) return slot;
  }
  return null;
}

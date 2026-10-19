"use client";

import { useState } from "react";
import Link from "next/link";
import { finishKitchen } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { kitchenFoods } from "@/lib/dictionary";
import { emptyPlate, orderAt, orderText, plateMatches, type Food, type Plate } from "@/lib/games/kitchen";
import { playNote } from "@/lib/games/cove";
import { mochiSend } from "@/lib/mochi/bus";

export function KitchenPlay({ lang, copy, tags }: { lang: "fr" | "en"; copy: Copy; tags?: string[] }) {
  const foods = kitchenFoods(tags);
  const [customer, setCustomer] = useState(0);
  const [plate, setPlate] = useState<Plate>(emptyPlate(tags));
  const [done, setDone] = useState<Plate[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const order = orderAt(customer, tags);

  async function add(food: Food) {
    playNote(520);
    const next = { ...plate, [food]: (plate[food] ?? 0) + 1 };
    if ((next[food] ?? 0) > 3) {
      mochiSend({ type: "wrong" });
      setPlate(emptyPlate(tags));
      return;
    }
    if (!plateMatches(order, next, tags)) {
      setPlate(next);
      return;
    }
    mochiSend({ type: "correct" });
    const plates = [...done, next];
    setDone(plates);
    setPlate(emptyPlate(tags));
    if (plates.length < 5) {
      setCustomer(customer + 1);
      return;
    }
    const result = await finishKitchen(plates, tags);
    setStars(result.stars);
  }

  if (stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars} {copy.stars}
        </p>
        <Link href="/kid/games/bay" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-3xl">{orderText(order, lang, tags)}</p>
      <p className="text-center text-2xl">
        {foods.map((food) => `${food.emoji} ${plate[food.id] ?? 0}`).join("  ")}
      </p>
      {foods.map((food) => (
        <button key={food.id} type="button" aria-label={food[lang]} onClick={() => void add(food.id)} className="flex h-14 items-center justify-center rounded-full bg-sun text-3xl">
          {food.emoji}
        </button>
      ))}
    </div>
  );
}

export const MochisKitchen = KitchenPlay;

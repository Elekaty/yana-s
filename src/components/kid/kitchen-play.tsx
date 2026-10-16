"use client";

import { useState } from "react";
import Link from "next/link";
import { finishKitchen } from "@/app/kid/games/island-actions";
import type { Copy } from "@/lib/i18n";
import { emptyPlate, orderAt, orderText, plateMatches, type Food, type Plate } from "@/lib/games/kitchen";
import { playNote } from "@/lib/games/cove";

const foods: { id: Food; emoji: string; fr: string; en: string }[] = [
  { id: "pomme", emoji: "🍎", fr: "pomme", en: "apple" },
  { id: "biscuit", emoji: "🍪", fr: "biscuit", en: "biscuit" },
  { id: "jus", emoji: "🧃", fr: "jus", en: "juice" },
];

export function KitchenPlay({ lang, copy }: { lang: "fr" | "en"; copy: Copy }) {
  const [customer, setCustomer] = useState(0);
  const [plate, setPlate] = useState<Plate>(emptyPlate());
  const [done, setDone] = useState<Plate[]>([]);
  const [stars, setStars] = useState<number | null>(null);
  const order = orderAt(customer);

  async function add(food: Food) {
    playNote(520);
    const next = { ...plate, [food]: plate[food] + 1 };
    if (next[food] > 3) {
      setPlate(emptyPlate());
      return;
    }
    if (!plateMatches(order, next)) {
      setPlate(next);
      return;
    }
    const plates = [...done, next];
    setDone(plates);
    setPlate(emptyPlate());
    if (plates.length < 5) {
      setCustomer(customer + 1);
      return;
    }
    const result = await finishKitchen(plates);
    setStars(result.stars);
  }

  if (stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars} {copy.stars}
        </p>
        <Link href="/kid/games/bay/more" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-3xl">{orderText(order, lang)}</p>
      <p className="text-center text-2xl">
        {foods.map((food) => `${food.emoji} ${plate[food.id]}`).join("  ")}
      </p>
      {foods.map((food) => (
        <button key={food.id} type="button" aria-label={food[lang]} onClick={() => void add(food.id)} className="flex h-14 items-center justify-center rounded-full bg-sun text-3xl">
          {food.emoji}
        </button>
      ))}
    </div>
  );
}

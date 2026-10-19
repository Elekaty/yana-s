"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { finishRound } from "@/app/kid/games/actions";
import { mochiSend } from "@/lib/mochi/bus";
import { FRUIT_LEVELS, questionAt, type FruitLevel } from "@/lib/games/questions";
import type { Copy } from "@/lib/i18n";

type Fruit = { choice: number; x: number; y: number; vy: number; born: number };

export function TimesRound({
  game,
  level,
  tables,
  copy,
}: {
  game: "bulles" | "fruit";
  level: FruitLevel;
  tables: number[];
  copy: Copy;
}) {
  const count = game === "fruit" && level === "medium" ? 4 : 3;
  const motion = FRUIT_LEVELS[level];
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [done, setDone] = useState<{ stars: number; balance: number } | null>(null);
  const [wrong, setWrong] = useState(false);
  const reduced = useReducedMotion();
  const fruitNodes = useRef<(HTMLButtonElement | null)[]>([]);
  const question = questionAt(tables, index, count);
  const choiceKey = question.choices.join(",");

  useEffect(() => {
    if (game !== "fruit" || reduced || done) return;
    const choices = choiceKey.split(",").map(Number);
    const bodies: Fruit[] = choices.map((choice, slot) => ({
      choice,
      x: 12 + slot * (76 / Math.max(choices.length, 1)),
      y: 300,
      vy: -motion.launch,
      born: slot * motion.stagger * 1000,
    }));
    let frame = 0;
    let last = 0;
    let started = 0;
    const tick = (now: number) => {
      if (started === 0) started = now;
      const dt = Math.min(0.05, last === 0 ? 0.016 : (now - last) / 1000);
      last = now;
      bodies.forEach((fruit, slot) => {
        const node = fruitNodes.current[slot];
        if (!node) return;
        node.style.left = `${fruit.x}%`;
        if (now - started < fruit.born) {
          node.style.top = "300px";
          return;
        }
        fruit.vy += motion.gravity * dt;
        fruit.y += fruit.vy * dt;
        if (fruit.y > 300) {
          fruit.y = 300;
          fruit.vy = -motion.launch;
        }
        node.style.top = `${fruit.y}px`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [game, reduced, done, choiceKey, motion.gravity, motion.launch, motion.stagger]);

  async function choose(choice: number) {
    if (done) return;
    if (choice !== question.answer) {
      setWrong(true);
      mochiSend({ type: "wrong" });
      return;
    }
    setWrong(false);
    mochiSend({ type: "correct" });
    beep();
    const nextPicks = [...picks, choice];
    if (nextPicks.length >= 5) {
      const result = await finishRound({ game, level, picks: nextPicks });
      setDone({ stars: result.stars, balance: result.balance });
      return;
    }
    setPicks(nextPicks);
    setIndex(index + 1);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-4xl">{copy.doneTitle}</p>
        <p className="text-2xl">
          {done.balance} {copy.stars}
        </p>
        <Link href="/kid/games/bay" className="flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-sun text-xl text-plum">
          {copy.again}
        </Link>
      </div>
    );
  }

  const buttons = question.choices.map((choice, slot) => (
    <button
      key={`${index}-${choice}`}
      ref={(node) => {
        fruitNodes.current[slot] = node;
      }}
      type="button"
      onClick={() => choose(choice)}
      className={`flex items-center justify-center rounded-full bg-sun text-2xl text-plum ${count === 4 ? "h-14 w-14" : "h-20 w-20"}`}
      style={game === "fruit" && !reduced ? { position: "absolute", left: `${12 + slot * (76 / count)}%`, top: 300 } : undefined}
    >
      {choice}
    </button>
  ));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm">{copy.which}</p>
      <p className="text-center text-5xl">
        {question.left} × {question.right}
      </p>
      {wrong ? <p className="text-center text-lg">{copy.again}</p> : <p className="text-center text-lg">{picks.length} / 5</p>}
      {game === "fruit" && !reduced ? <div className="relative h-[420px]">{buttons}</div> : <div className="flex flex-wrap justify-center gap-4">{buttons}</div>}
    </div>
  );
}

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function beep() {
  const audio = new AudioContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = 660;
  gain.gain.value = 0.04;
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.12);
  osc.onended = () => audio.close();
}

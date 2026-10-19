"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Copy } from "@/lib/i18n";

type Animal = "cat" | "dog" | "penguin";
type Part = "body" | "head" | "left" | "right" | "feet" | "tail";

const animals: Animal[] = ["cat", "dog", "penguin"];

const pieceList: Record<Animal, Part[]> = {
  cat: ["body", "head", "left", "right", "feet", "tail"],
  dog: ["body", "head", "left", "right", "feet", "tail"],
  penguin: ["body", "head", "left", "right", "feet"],
};

const slots: Record<Part, { left: string; top: string }> = {
  body: { left: "50%", top: "58%" },
  head: { left: "50%", top: "27%" },
  left: { left: "22%", top: "50%" },
  right: { left: "78%", top: "50%" },
  feet: { left: "50%", top: "84%" },
  tail: { left: "14%", top: "66%" },
};

const pieceName = {
  fr: { body: "corps", head: "tête", left: "gauche", right: "droite", feet: "pattes", tail: "queue" },
  en: { body: "body", head: "head", left: "left", right: "right", feet: "feet", tail: "tail" },
} as const;

export function StickerPlay({ copy, lang }: { copy: Copy; lang: "fr" | "en" }) {
  const reduced = useReducedMotion();
  const [animal, setAnimal] = useState<Animal>("cat");
  const [stuck, setStuck] = useState<Part[]>([]);
  const pieces = pieceList[animal];
  const done = pieces.every((part) => stuck.includes(part));

  function choose(next: Animal) {
    setAnimal(next);
    setStuck([]);
  }

  function stick(part: Part) {
    setStuck((current) => (current.includes(part) ? current : [...current, part]));
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-3" role="group" aria-label={copy.stickers}>
        {animals.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={animal === id}
            onClick={() => choose(id)}
            className={animal === id ? "h-16 rounded-full bg-sun text-lg text-plum ring-4 ring-white" : "h-16 rounded-full bg-white/15 text-lg"}
          >
            {copy[id]}
          </button>
        ))}
      </div>
      <motion.div
        className="relative h-80 overflow-hidden rounded-[28px] bg-white"
        style={{ boxShadow: "0 0 0 4px #FFD23F" }}
        animate={done && !reduced ? { y: [0, -8, 0] } : { y: 0 }}
        transition={done && !reduced ? { duration: 0.7, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        {pieces.map((part) =>
          stuck.includes(part) ? (
            <motion.div
              key={`${animal}-${part}`}
              className="absolute h-24 w-24"
              style={{ left: slots[part].left, top: slots[part].top, x: "-50%", y: "-50%" }}
              initial={reduced ? false : { scale: 0.2, rotate: part === "tail" ? -20 : 8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 460, damping: 14 }}
            >
              <Piece animal={animal} part={part} />
            </motion.div>
          ) : (
            <div
              key={`${animal}-ghost-${part}`}
              className="absolute h-16 w-16 rounded-full border-2 border-dashed border-[#2A0B4A]/25"
              style={{ left: slots[part].left, top: slots[part].top, transform: "translate(-50%, -50%)" }}
            />
          ),
        )}
        {done ? <p className="absolute right-3 bottom-3 rounded-full bg-sun px-3 py-1 text-sm font-semibold text-plum">{copy.doneTitle}</p> : null}
      </motion.div>
      <div className="flex flex-wrap justify-center gap-3">
        {pieces
          .filter((part) => !stuck.includes(part))
          .map((part) => (
            <button
              key={part}
              type="button"
              aria-label={`${copy[animal]}, ${pieceName[lang][part]}`}
              onClick={() => stick(part)}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-white"
            >
              <span className="h-16 w-16">
                <Piece animal={animal} part={part} />
              </span>
            </button>
          ))}
      </div>
      {done ? (
        <button type="button" onClick={() => setStuck([])} className="flex h-16 items-center justify-center rounded-full bg-hot text-2xl">
          {copy.again}
        </button>
      ) : null}
    </div>
  );
}

function Piece({ animal, part }: { animal: Animal; part: Part }) {
  if (animal === "cat") return <Cat part={part} />;
  if (animal === "dog") return <Dog part={part} />;
  return <Penguin part={part} />;
}

function Cat({ part }: { part: Part }) {
  if (part === "head") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <path d="M16 28 L24 10 L34 26" fill="#F4A259" />
        <path d="M64 28 L56 10 L46 26" fill="#F4A259" />
        <path d="M22 18 L26 12 L30 20" fill="#FFD0E4" />
        <path d="M58 18 L54 12 L50 20" fill="#FFD0E4" />
        <circle cx="40" cy="44" r="24" fill="#F4A259" />
        <ellipse cx="40" cy="50" rx="14" ry="10" fill="#FFF3E0" />
        <path d="M22 36 q6 6 0 14" fill="none" stroke="#E07A3D" strokeWidth="3" />
        <path d="M58 36 q-6 6 0 14" fill="none" stroke="#E07A3D" strokeWidth="3" />
        <circle cx="32" cy="44" r="4" fill="#2A0B4A" />
        <circle cx="48" cy="44" r="4" fill="#2A0B4A" />
        <circle cx="33" cy="43" r="1.4" fill="#fff" />
        <circle cx="49" cy="43" r="1.4" fill="#fff" />
        <path d="M40 50 l-3 4 h6 z" fill="#FF8A9A" />
      </svg>
    );
  }
  if (part === "body") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="40" cy="42" rx="28" ry="24" fill="#F4A259" />
        <ellipse cx="40" cy="48" rx="16" ry="14" fill="#FFF3E0" />
        <path d="M22 30 q8 8 2 16" fill="none" stroke="#E07A3D" strokeWidth="3" />
        <path d="M58 30 q-8 8 -2 16" fill="none" stroke="#E07A3D" strokeWidth="3" />
        <path d="M34 28 q4 10 0 16" fill="none" stroke="#E07A3D" strokeWidth="3" />
      </svg>
    );
  }
  if (part === "feet") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="28" cy="46" rx="12" ry="16" fill="#F4A259" />
        <ellipse cx="52" cy="46" rx="12" ry="16" fill="#F4A259" />
        <ellipse cx="28" cy="56" rx="10" ry="6" fill="#E07A3D" />
        <ellipse cx="52" cy="56" rx="10" ry="6" fill="#E07A3D" />
      </svg>
    );
  }
  if (part === "tail") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <path d="M58 20 C30 20 20 48 34 62" fill="none" stroke="#F4A259" strokeWidth="12" strokeLinecap="round" />
        <path d="M58 20 C36 24 28 46 36 58" fill="none" stroke="#E07A3D" strokeWidth="3" />
      </svg>
    );
  }
  const flip = part === "right";
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M48 16 C28 24 22 48 34 66" fill="none" stroke="#F4A259" strokeWidth="14" strokeLinecap="round" />
      <path d="M46 22 C32 30 30 46 36 58" fill="none" stroke="#E07A3D" strokeWidth="3" />
    </svg>
  );
}

function Dog({ part }: { part: Part }) {
  if (part === "head") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="22" cy="46" rx="12" ry="16" fill="#E8B15A" />
        <ellipse cx="58" cy="46" rx="12" ry="16" fill="#E8B15A" />
        <circle cx="40" cy="40" r="22" fill="#E8B15A" />
        <ellipse cx="40" cy="50" rx="14" ry="10" fill="#FFF6E4" />
        <circle cx="32" cy="38" r="3.5" fill="#2A0B4A" />
        <circle cx="48" cy="38" r="3.5" fill="#2A0B4A" />
        <ellipse cx="40" cy="48" rx="4" ry="3" fill="#2A0B4A" />
        <path d="M36 54 q4 6 8 0" fill="#FF8A9A" />
      </svg>
    );
  }
  if (part === "body") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="40" cy="42" rx="28" ry="22" fill="#E8B15A" />
        <ellipse cx="40" cy="48" rx="16" ry="12" fill="#FFF6E4" />
        <path d="M24 34 q6 4 4 12" fill="none" stroke="#D0923A" strokeWidth="3" />
        <path d="M56 34 q-6 4 -4 12" fill="none" stroke="#D0923A" strokeWidth="3" />
      </svg>
    );
  }
  if (part === "feet") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="28" cy="48" rx="11" ry="14" fill="#E8B15A" />
        <ellipse cx="52" cy="48" rx="11" ry="14" fill="#E8B15A" />
        <ellipse cx="28" cy="58" rx="9" ry="5" fill="#D0923A" />
        <ellipse cx="52" cy="58" rx="9" ry="5" fill="#D0923A" />
      </svg>
    );
  }
  if (part === "tail") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <path d="M20 58 C28 30 52 24 62 40" fill="none" stroke="#E8B15A" strokeWidth="12" strokeLinecap="round" />
      </svg>
    );
  }
  const flip = part === "right";
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <ellipse cx="36" cy="46" rx="12" ry="18" fill="#E8B15A" transform="rotate(-18 36 46)" />
    </svg>
  );
}

function Penguin({ part }: { part: Part }) {
  if (part === "head") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <circle cx="40" cy="42" r="22" fill="#4E5D6C" />
        <ellipse cx="40" cy="50" rx="12" ry="10" fill="#fff" />
        <circle cx="32" cy="40" r="4" fill="#fff" />
        <circle cx="48" cy="40" r="4" fill="#fff" />
        <circle cx="33" cy="41" r="2" fill="#2A0B4A" />
        <circle cx="49" cy="41" r="2" fill="#2A0B4A" />
        <path d="M34 52 l6 8 l6 -8 z" fill="#FF9F43" />
      </svg>
    );
  }
  if (part === "body") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="40" cy="40" rx="26" ry="30" fill="#4E5D6C" />
        <ellipse cx="40" cy="46" rx="16" ry="20" fill="#fff" />
      </svg>
    );
  }
  if (part === "feet") {
    return (
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <ellipse cx="30" cy="48" rx="14" ry="8" fill="#FF9F43" />
        <ellipse cx="50" cy="48" rx="14" ry="8" fill="#FF9F43" />
      </svg>
    );
  }
  if (part === "tail") return null;
  const flip = part === "right";
  return (
    <svg viewBox="0 0 80 80" className="h-full w-full" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <ellipse cx="34" cy="42" rx="14" ry="22" fill="#5C6B7A" transform="rotate(-24 34 42)" />
    </svg>
  );
}

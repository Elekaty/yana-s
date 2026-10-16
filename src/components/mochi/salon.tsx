"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { fillPhrase, greetPhrase, phrases } from "@/lib/phrases";
import { BUBBLE_FRIENDS, MOCHI_STATES, type BubbleFriend, type MochiState } from "@/lib/mochi";
import { speak } from "@/lib/speak";

const friendColor: Record<BubbleFriend, string> = {
  bunny: "#f7c6d8",
  panda: "#f4f4f5",
  fox: "#fb923c",
  corgi: "#f6c453",
  hamster: "#e7c39a",
};

export function SalonLab() {
  const [forced, setForced] = useState<MochiState | null>(null);
  return (
    <div className="kid min-h-dvh bg-plum px-4 py-6 text-white" style={{ fontFamily: "var(--font-fredoka), system-ui, sans-serif" }}>
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <h1 className="text-3xl">Mochi in the salon</h1>
        <p className="text-white/80">Tap a state, the yarn, or the sofa. She pauses when this tab is hidden.</p>
        <Salon forced={forced} childName="Yana" lang="fr" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="h-14 rounded-full bg-white/15 px-4" onClick={() => setForced(null)}>
            auto
          </button>
          {MOCHI_STATES.map((state) => (
            <button
              key={state}
              type="button"
              className="h-14 rounded-full bg-hot px-4"
              onClick={() => {
                setForced(state);
                speak({ text: lineFor(state, "fr", "Yana"), lang: "fr" });
              }}
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Salon({
  forced,
  childName,
  lang,
  onMeetFriend,
}: {
  forced: MochiState | null;
  childName: string;
  lang: "fr" | "en";
  onMeetFriend?: (friend: BubbleFriend) => void;
}) {
  const reduce = useReducedMotion();
  const [auto, setAuto] = useState<MochiState>("greet");
  const [paused, setPaused] = useState(false);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<BubbleFriend | null>(null);
  const [beside, setBeside] = useState<BubbleFriend | null>(null);
  const [note, setNote] = useState<{ state: MochiState; text: string } | null>(null);
  const state = forced ?? auto;
  const line = note?.state === state ? note.text : lineFor(state, lang, childName);
  const eyesClosed = state === "nap" || state === "sleepy-at-bedtime";

  useEffect(() => {
    const onHide = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useEffect(() => {
    if (forced || paused || reduce) return;
    const wait = 6000 + Math.random() * 1000;
    const id = window.setTimeout(() => {
      const pool: MochiState[] = [...MOCHI_STATES];
      setAuto(pool[Math.floor(Math.random() * pool.length)] ?? "idle");
    }, wait);
    return () => window.clearTimeout(id);
  }, [auto, forced, paused, reduce]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setBubble(BUBBLE_FRIENDS[Math.floor(Math.random() * BUBBLE_FRIENDS.length)] ?? "bunny");
    }, 9000);
    return () => window.clearInterval(id);
  }, [paused]);

  const flip = state === "wander";

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-[#3a1468]"
      onPointerMove={(event) => {
        if (eyesClosed) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const dy = (event.clientY - rect.top - rect.height * 0.55) / rect.height;
        setPupil({
          x: Math.max(-1, Math.min(1, dx)) * 3.5,
          y: Math.max(-1, Math.min(1, dy)) * 2.5,
        });
      }}
    >
      <svg viewBox="0 0 800 480" className="h-auto w-full" role="img" aria-label="Mochi in the living room">
        <rect width="800" height="480" fill="#4a1d7a" />
        <g data-p="window">
          <rect x="300" y="36" width="200" height="140" rx="12" fill="#8ec7ff" />
          <path d="M310 150c40-30 70-10 100-28 20 24 50 20 70 8v46H310z" fill="#d7f3c8" />
          <rect x="396" y="36" width="8" height="140" fill="#fff6" />
          <rect x="300" y="100" width="200" height="8" fill="#fff6" />
        </g>
        <g data-p="curtains">
          <path d="M270 24h50l-10 180h-40z" fill="#FF2E93" />
          <path d="M480 24h50l10 180h-40z" fill="#FF2E93" />
        </g>
        <g data-p="frames">
          <rect x="70" y="70" width="90" height="70" rx="6" fill="#FFD23F" />
          <rect x="80" y="80" width="70" height="50" fill="#fff" />
          <circle cx="115" cy="105" r="12" fill="#7C3AED" />
          <rect x="620" y="80" width="80" height="64" rx="6" fill="#fff" />
          <path d="M632 128l18-22 14 16 10-12 14 18z" fill="#7C3AED" />
        </g>
        <g data-p="plant">
          <rect x="660" y="250" width="36" height="40" rx="6" fill="#c47b4a" />
          <ellipse cx="678" cy="240" rx="28" ry="16" fill="#3fbf6a" />
          <ellipse cx="650" cy="230" rx="18" ry="12" fill="#2f9d55" />
          <ellipse cx="706" cy="228" rx="16" ry="11" fill="#57d07d" />
        </g>
        <g data-p="rug">
          <ellipse cx="400" cy="430" rx="250" ry="28" fill="#FFD23F" />
          <ellipse cx="400" cy="430" rx="190" ry="16" fill="#ff8c42" />
        </g>
        <g
          data-p="sofa"
          role="button"
          tabIndex={0}
          aria-label="Sofa, Mochi naps"
          onClick={() => setAuto("nap")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setAuto("nap");
          }}
        >
          <rect x="80" y="280" width="250" height="90" rx="28" fill="#7C3AED" />
          <rect x="100" y="250" width="70" height="70" rx="20" fill="#9b6cf0" />
          <rect x="240" y="250" width="70" height="70" rx="20" fill="#9b6cf0" />
        </g>
        <motion.g
          animate={
            reduce || paused
              ? { x: 0, y: 0 }
              : state === "wander"
                ? { x: [0, 90, -70, 0], y: 0 }
                : state === "chase-yarn"
                  ? { x: [0, 140, 0], y: [0, -10, 0] }
                  : state === "cheer"
                    ? { x: 0, y: [0, -18, 0] }
                    : { x: 0, y: 0 }
          }
          transition={{ duration: state === "cheer" ? 0.6 : 6, repeat: !reduce && !paused && (state === "wander" || state === "chase-yarn" || state === "cheer") ? Infinity : 0, ease: "easeInOut" }}
        >
          <g
            data-p="cat"
            role="button"
            tabIndex={0}
            aria-label={lang === "en" ? "Tap Mochi for the next move" : "Touche Mochi pour le mouvement suivant"}
            transform={flip ? "translate(760 0) scale(-1 1)" : undefined}
            onClick={() => setAuto(MOCHI_STATES[(MOCHI_STATES.indexOf(state) + 1) % MOCHI_STATES.length] ?? "greet")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setAuto(MOCHI_STATES[(MOCHI_STATES.indexOf(state) + 1) % MOCHI_STATES.length] ?? "greet");
              }
            }}
          >
            <ellipse cx="430" cy="360" rx="78" ry="48" fill="#fff" />
            <ellipse cx="430" cy="368" rx="60" ry="28" fill="#f3f0ff" />
            <motion.g
              animate={state === "purr" && !reduce ? { scale: [1, 1.08, 0.96, 1] } : { scale: 1 }}
              transition={{ duration: 0.45, repeat: state === "purr" && !reduce ? Infinity : 0 }}
            >
              <circle cx="390" cy="250" r="28" fill="#fff" />
              <circle cx="470" cy="250" r="28" fill="#fff" />
              <circle cx="390" cy="250" r="14" fill="#ffd0e4" />
              <circle cx="470" cy="250" r="14" fill="#ffd0e4" />
              <ellipse cx="430" cy="300" rx="70" ry="58" fill="#fff" />
              {eyesClosed ? (
                <g>
                  <path d="M400 292c8 8 16 8 24 0" fill="none" stroke="#2A0B4A" strokeWidth="3" strokeLinecap="round" />
                  <path d="M436 292c8 8 16 8 24 0" fill="none" stroke="#2A0B4A" strokeWidth="3" strokeLinecap="round" />
                  {state === "nap" ? (
                    <text x="500" y="250" fontSize="28">
                      💤
                    </text>
                  ) : null}
                </g>
              ) : (
                <g>
                  <ellipse cx="408" cy="292" rx="14" ry="16" fill="#fff" stroke="#2A0B4A" strokeWidth="2" />
                  <ellipse cx="452" cy="292" rx="14" ry="16" fill="#fff" stroke="#2A0B4A" strokeWidth="2" />
                  <circle cx={408 + pupil.x} cy={294 + pupil.y} r="6" fill="#2A0B4A" />
                  <circle cx={452 + pupil.x} cy={294 + pupil.y} r="6" fill="#2A0B4A" />
                  <circle cx={411 + pupil.x} cy={291 + pupil.y} r="2" fill="#fff" />
                  <circle cx={455 + pupil.x} cy={291 + pupil.y} r="2" fill="#fff" />
                </g>
              )}
              <path d="M418 318c8 10 18 10 26 0" fill="none" stroke="#FF2E93" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="400" cy="314" rx="8" ry="5" fill="#ffb3d1" opacity="0.8" />
              <ellipse cx="462" cy="314" rx="8" ry="5" fill="#ffb3d1" opacity="0.8" />
              {state === "purr" ? (
                <text x="500" y="280" fontSize="22">
                  ♥
                </text>
              ) : null}
              {state === "think" ? (
                <text x="500" y="240" fontSize="22">
                  …
                </text>
              ) : null}
            </motion.g>
          </g>
        </motion.g>
        <g
          data-p="yarn"
          role="button"
          tabIndex={0}
          aria-label="Yarn ball"
          onClick={() => setAuto("chase-yarn")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setAuto("chase-yarn");
          }}
        >
          <circle cx={state === "chase-yarn" ? 560 : 180} cy="400" r="22" fill="#FF2E93" />
          <path
            d={state === "chase-yarn" ? "M560 400c20-16 28 8 40-4" : "M180 400c-20-16-8 10-24-2"}
            fill="none"
            stroke="#FFD23F"
            strokeWidth="3"
          />
        </g>
        {beside ? (
          <g data-p="friend">
            <circle cx="560" cy="340" r="26" fill={friendColor[beside]} stroke="#2A0B4A" strokeWidth="3" />
            <circle cx="550" cy="334" r="3" fill="#2A0B4A" />
            <circle cx="570" cy="334" r="3" fill="#2A0B4A" />
          </g>
        ) : null}
      </svg>
      <p className="absolute top-3 left-3 rounded-full bg-sun px-3 py-1 text-sm font-semibold text-plum">{moveLabel(state, lang)}</p>
      {bubble ? (
        <button
          type="button"
          className="absolute top-16 right-8 h-16 w-16 rounded-full border-4 border-white text-xs font-bold text-plum"
          style={{ background: friendColor[bubble] }}
          onClick={() => {
            const greeting = fillPhrase(phrases.bubble[lang], childName);
            setBeside(bubble);
            setBubble(null);
            setNote({ state, text: greeting });
            speak({ text: greeting, lang });
            onMeetFriend?.(bubble);
            window.setTimeout(() => setBeside(null), 4000);
          }}
        >
          {bubble}
        </button>
      ) : null}
      <p className="px-4 pb-4 text-center text-lg">{line}</p>
    </div>
  );
}

function moveLabel(state: MochiState, lang: "fr" | "en") {
  const labels: Record<MochiState, { fr: string; en: string }> = {
    idle: { fr: "Mochi attend", en: "Mochi waits" },
    wander: { fr: "Mochi se promène", en: "Mochi walks" },
    "chase-yarn": { fr: "Mochi court après la laine", en: "Mochi chases the yarn" },
    nap: { fr: "Mochi fait la sieste", en: "Mochi naps" },
    purr: { fr: "Mochi ronronne", en: "Mochi purrs" },
    cheer: { fr: "Mochi applaudit", en: "Mochi cheers" },
    think: { fr: "Mochi réfléchit", en: "Mochi thinks" },
    "sleepy-at-bedtime": { fr: "Mochi a sommeil", en: "Mochi is sleepy" },
    greet: { fr: "Mochi dit bonjour", en: "Mochi says hello" },
  };
  return labels[state][lang];
}

function lineFor(state: MochiState, lang: "fr" | "en", name: string) {
  if (state === "greet" || state === "sleepy-at-bedtime") return greetPhrase(lang, name, new Date().getHours());
  if (state === "purr") return phrases.purr[lang];
  if (state === "nap") return phrases.nap[lang];
  if (state === "cheer") return fillPhrase(phrases.cheer[lang], name);
  if (state === "think") return phrases.think[lang];
  if (state === "chase-yarn") return phrases.yarn[lang];
  return greetPhrase(lang, name, new Date().getHours());
}

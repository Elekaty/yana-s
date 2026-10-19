"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { postponeStudy, saveClock, skipBreak } from "@/app/kid/actions";
import { Mochi } from "@/components/mochi/Mochi";
import { StudyClockContext } from "@/components/kid/study-clock";
import { phrases } from "@/lib/phrases";
import { speak } from "@/lib/speak";
import { formatClock, IDLE_MS, tickClock, type StudyClock, type StudySettings } from "@/lib/study/clock";
import { playTune, stopTune } from "@/lib/study/tunes";
import type { Copy } from "@/lib/i18n";

const FAMILY_GAMES = [
  { fr: "Jacques a dit : touche ton nez.", en: "Simon says: touch your nose. Move only after Jacques a dit." },
  { fr: "Pierre, feuille, ciseaux.", en: "Rock, paper, scissors. Play one round together." },
  { fr: "Trouve 5 choses rouges.", en: "Find 5 red things in the room." },
  { fr: "Danse, puis stop !", en: "Dance, then freeze when the music stops." },
];

export function BreakGate({
  settings,
  initial,
  hasPin,
  lang,
  voice,
  copy,
  paused,
  children,
}: {
  settings: StudySettings | null;
  initial: (StudyClock & { updatedAt: string }) | null;
  hasPin: boolean;
  lang: "fr" | "en";
  voice: boolean;
  copy: Copy;
  paused?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [clock, setClock] = useState<StudyClock | null>(initial);
  const [activity, setActivity] = useState<"menu" | "song" | "bubbles" | "family">("menu");
  const [game, setGame] = useState(0);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [asking, setAsking] = useState(false);
  const [idle, setIdle] = useState(false);
  const lastTouch = useRef(0);
  const clockRef = useRef<StudyClock | null>(initial);
  const finishing = useRef(false);

  useEffect(() => {
    if (!settings) return;
    lastTouch.current = Date.now();
    const id = window.setInterval(() => {
      const active = !document.hidden && Date.now() - lastTouch.current < IDLE_MS;
      setIdle(!active);
      const current = clockRef.current;
      const result = current ? tickClock(current, settings, active, paused) : null;
      const next = result?.clock ?? current;
      clockRef.current = next;
      setClock(next);
      if (result?.finishedBreak && !finishing.current) {
        finishing.current = true;
        void saveClock(0).then((saved) => {
          finishing.current = false;
          if (!saved || saved.mode === "break") return;
          clockRef.current = saved;
          setClock(saved);
          stopTune();
          router.refresh();
        });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [settings, paused, router]);

  useEffect(() => {
    if (!settings) return;
    if (paused) return;
    const id = window.setInterval(() => {
      const current = clockRef.current;
      if (!current || finishing.current || (current.mode === "break" && current.remainingSec <= 0)) return;
      void saveClock(current.remainingSec).then((saved) => {
        if (!saved || finishing.current) return;
        if (clockRef.current?.mode === "study" && saved.mode === "break") return;
        clockRef.current = saved;
        setClock(saved);
        if (saved.mode === "study" && current.mode === "break") router.refresh();
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [settings, router, paused]);

  useEffect(() => {
    const resting = Boolean(!paused && clock && clock.mode === "break" && clock.remainingSec > 0);
    document.documentElement.dataset.mochiBusy = resting ? "1" : "";
    return () => {
      document.documentElement.dataset.mochiBusy = "";
    };
  }, [clock, paused]);

  if (paused || !settings || !clock) return <StudyClockContext.Provider value={clock}>{children}</StudyClockContext.Provider>;

  const canPostpone = clock.mode === "heads_up" && clock.postponements < settings.maxPostponements;

  async function addMinutes(minutes: 5 | 10) {
    const saved = await postponeStudy(minutes);
    if (!saved) return;
    clockRef.current = saved;
    setClock(saved);
  }

  const ended = clock.mode === "break" && clock.remainingSec <= 0;

  return (
    <StudyClockContext.Provider value={clock}>
    <div className="contents" onPointerDownCapture={() => (lastTouch.current = Date.now())}>
      {clock.mode === "heads_up" ? (
        <div className="border-b border-white/20 bg-sun px-4 py-3 text-plum">
          <p className="text-lg">
            {copy.pauseIn} {formatClock(clock.remainingSec)}
          </p>
          {canPostpone ? (
            <div className="mt-2 flex gap-3">
              <button type="button" className={choice} onClick={() => void addMinutes(5)}>
                {copy.later5}
              </button>
              <button type="button" className={choice} onClick={() => void addMinutes(10)}>
                {copy.later10}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {idle && clock.mode !== "break" ? <p className="px-4 pt-3 text-center text-lg text-white/80">{copy.touch}</p> : null}
      {children}
      {clock.mode === "break" ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-plum px-4 py-6 text-white">
          <p className="text-center text-3xl">{copy.breakTitle}</p>
          <p className="mt-1 text-center text-xl text-sun">{formatClock(clock.remainingSec)}</p>
          {ended ? <p className="mt-8 text-center text-3xl text-sun">{copy.breakStar}</p> : null}
          {!ended && activity === "menu" ? (
            <div className="mx-auto mt-8 flex w-full max-w-sm flex-1 flex-col gap-3">
              <button type="button" className={choice} onClick={() => setActivity("song")}>
                {copy.song}
              </button>
              <button type="button" className={choice} onClick={() => setActivity("bubbles")}>
                {copy.bubbles}
              </button>
              <button type="button" className={choice} onClick={() => setActivity("family")}>
                {copy.familyGame}
              </button>
            </div>
          ) : null}
          {!ended && activity === "song" ? (
            <SongActivity
              copy={copy}
              lang={lang}
              voice={voice}
              onBack={() => {
                stopTune();
                setActivity("menu");
              }}
            />
          ) : null}
          {!ended && activity === "bubbles" ? <BubbleActivity copy={copy} onBack={() => setActivity("menu")} /> : null}
          {!ended && activity === "family" ? (
            <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-3">
              <p className="text-2xl">{FAMILY_GAMES[game]?.fr}</p>
              <p className="text-base text-white/75">{FAMILY_GAMES[game]?.en}</p>
              <button
                type="button"
                className={choice}
                onClick={() => {
                  const line = FAMILY_GAMES[game]?.fr ?? "";
                  if (voice && line) speak({ text: line, lang: "fr" });
                }}
              >
                {copy.listen}
              </button>
              <button type="button" className={choice} onClick={() => setGame((value) => (value + 1) % FAMILY_GAMES.length)}>
                {copy.another}
              </button>
              <button type="button" className={quiet} onClick={() => setActivity("menu")}>
                {copy.back}
              </button>
            </div>
          ) : null}
          {ended || activity === "menu" ? (
          <form
            className="mx-auto mt-4 w-full max-w-sm"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await skipBreak(pin);
              if (result.error) {
                setPinError(result.error);
                return;
              }
              if (result.clock) {
                clockRef.current = result.clock;
                setClock(result.clock);
              }
              setAsking(false);
              setPin("");
              stopTune();
              setActivity("menu");
            }}
          >
            {asking ? (
              <div className="flex flex-col gap-3">
                <label className="text-sm text-white/70" htmlFor="break-pin">
                  {copy.pinLabel}
                </label>
                <input
                  id="break-pin"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-16 rounded-full bg-white px-4 text-lg text-plum"
                />
                {pinError ? <p className="text-sm text-sun">{pinError}</p> : null}
                <button type="submit" className={quiet}>
                  {copy.skip}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={quiet}
                onClick={() => {
                  setAsking(true);
                  if (!hasPin) setPinError(copy.needPin);
                }}
              >
                {copy.parentSkip}
              </button>
            )}
          </form>
          ) : null}
        </div>
      ) : null}
    </div>
    </StudyClockContext.Provider>
  );
}

function SongActivity({ copy, lang, voice, onBack }: { copy: Copy; lang: "fr" | "en"; voice: boolean; onBack: () => void }) {
  const [dancing, setDancing] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function play(id: "frere" | "lune") {
    playTune(id);
    setDancing(true);
    if (voice) speak({ text: phrases.dance[lang], lang });
  }
  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col gap-3">
      {dancing ? (
        <div className="mx-auto h-36 w-36">
          <Mochi action="happy" mood="alert" look={{ x: 0, y: 0 }} paused={false} reduced={reduced} waving label="Mochi" />
        </div>
      ) : (
        <p className="text-center text-2xl">{voice ? phrases.dance[lang] : copy.song}</p>
      )}
      <button
        type="button"
        className={choice}
        onClick={() => play("frere")}
      >
        Frère Jacques
      </button>
      <button
        type="button"
        className={choice}
        onClick={() => play("lune")}
      >
        Au clair de la lune
      </button>
      <button type="button" className={quiet} onClick={onBack}>
        {copy.back}
      </button>
    </div>
  );
}

function BubbleActivity({ copy, onBack }: { copy: Copy; onBack: () => void }) {
  const [popped, setPopped] = useState<number[]>([]);
  const spots = [
    [18, 30],
    [70, 22],
    [40, 55],
    [78, 62],
    [24, 74],
    [55, 40],
  ];
  return (
    <div className="mx-auto mt-4 flex w-full max-w-sm flex-1 flex-col">
      <div className="relative min-h-64 flex-1">
        {spots.map(([left, top], index) =>
          popped.includes(index) ? null : (
            <button
              key={index}
              type="button"
              aria-label={copy.bubbles}
              className="absolute h-16 w-16 rounded-full border-4 border-white bg-hot/80"
              style={{ left: `${left}%`, top: `${top}%` }}
              onClick={() => setPopped((current) => [...current, index])}
            />
          ),
        )}
      </div>
      <button type="button" className={quiet} onClick={onBack}>
        {copy.back}
      </button>
    </div>
  );
}

const choice = "flex h-16 items-center justify-center rounded-full bg-hot px-4 text-lg";
const quiet = "flex h-16 items-center justify-center rounded-full bg-white/15 px-4 text-lg";

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useState } from "react";
import { Mochi } from "@/components/mochi/Mochi";
import { setSpeakMuted, speak } from "@/lib/speak";
import { BUBBLE_FRIENDS, MOCHI_STATES, type BubbleFriend, type MochiState } from "@/lib/mochi";
import { FRIEND_CAST } from "@/lib/mochi/friends";
import { actionMs, initialMochi, nextMochi, type MochiAction } from "@/lib/mochi/machine";
import { FriendMark } from "@/components/mochi/friend-mark";
import { clockTime, greetingKey, phraseAt, pickPhrase, type PhraseKey } from "@/lib/mochi/phrases";

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
        <Salon forced={forced} childName="Yana" lang="fr" voice />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="h-14 rounded-full bg-white/15 px-4" onClick={() => setForced(null)}>
            auto
          </button>
          {MOCHI_STATES.map((state) => (
            <button key={state} type="button" className="h-14 rounded-full bg-hot px-4" onClick={() => setForced(state)}>
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
  voice = true,
  busy = false,
  crew = [],
  onMeetFriend,
}: {
  forced: MochiState | null;
  childName: string;
  lang: "fr" | "en";
  voice?: boolean;
  busy?: boolean;
  crew?: BubbleFriend[];
  onMeetFriend?: (friend: BubbleFriend) => void;
}) {
  const router = useRouter();
  const [machine, dispatch] = useReducer(nextMochi, initialMochi(12));
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<BubbleFriend | null>(null);
  const [beside, setBeside] = useState<BubbleFriend | null>(null);
  const [spoken, setSpoken] = useState<{ action: MochiAction; text: string } | null>(null);
  const [sky, setSky] = useState<"real" | "rain" | "night" | "sun">("real");
  const [lamp, setLamp] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [bubbles, setBubbles] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [muted, setMuted] = useState(false);
  const action = forced ? forcedAction(forced) : machine.action;
  const mood = forced === "sleepy-at-bedtime" ? "sleepy" : machine.mood;
  const hour = clock?.getHours() ?? 12;
  const realSky = hour < 7 || hour >= 20 ? "#1b1464" : hour >= 17 ? "#f4a261" : "#8ec7ff";
  const skyFill = sky === "real" ? realSky : sky === "rain" ? "#6b7c93" : sky === "night" ? "#1b1464" : "#ffe08a";
  const dark = sky === "night" || (sky === "real" && (hour < 7 || hour >= 20));

  useEffect(() => {
    setSpeakMuted(!voice || muted);
  }, [voice, muted]);

  useEffect(() => {
    const onHide = () => dispatch({ type: "visibility", hidden: document.hidden });
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => dispatch({ type: "reduced", value: media.matches });
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const read = () => dispatch({ type: "busy", value: busy || document.documentElement.dataset.mochiBusy === "1" });
    read();
    const watcher = new MutationObserver(read);
    watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mochi-busy"] });
    return () => watcher.disconnect();
  }, [busy]);

  useEffect(() => {
    if (forced) return;
    if (machine.hidden || machine.reduced || machine.busy) return;
    if (machine.action !== "idle") {
      const ms = actionMs(machine.action);
      if (!ms) return;
      const id = window.setTimeout(() => dispatch({ type: "actionDone", roll: Math.random() }), ms);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => dispatch({ type: "idleTick", roll: Math.random() }), 6000 + Math.random() * 1000);
    return () => window.clearTimeout(id);
  }, [forced, machine.action, machine.hidden, machine.reduced, machine.busy]);

  useEffect(() => {
    if (machine.hidden) return;
    const id = window.setInterval(() => {
      setBubble(BUBBLE_FRIENDS[Math.floor(Math.random() * BUBBLE_FRIENDS.length)] ?? "bunny");
    }, 9000);
    return () => window.clearInterval(id);
  }, [machine.hidden]);

  useEffect(() => {
    const apply = () => {
      const now = new Date();
      setClock(now);
      dispatch({ type: "hour", hour: now.getHours() });
      setLamp(now.getHours() >= 17 && now.getHours() < 21);
    };
    const start = window.setTimeout(apply, 0);
    const id = window.setInterval(apply, 30000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, []);

  const script = useMemo(() => phraseAt(lineKey(action, hour), lang, childName), [action, hour, lang, childName]);
  const line = spoken?.action === action ? spoken.text : script;
  const yarnX = action === "chasing" ? 560 : 180;

  function say(text: string) {
    setSpoken({ action, text });
    if (voice && !muted) speak({ text, lang });
  }

  function press(run: () => void) {
    if (!forced) run();
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-[#3a1468]"
      onPointerMove={(event) => {
        if (action === "napping") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const dy = (event.clientY - rect.top - rect.height * 0.55) / rect.height;
        setLook({ x: Math.max(-1, Math.min(1, dx)) * 4, y: Math.max(-1, Math.min(1, dy)) * 3 });
      }}
    >
      <svg viewBox="0 0 800 480" className="h-auto w-full" role="img" aria-label={lang === "en" ? "Living room" : "Salon"}>
        <rect width="800" height="480" fill="#4a1d7a" />
        {dark && !lamp ? <rect width="800" height="480" fill="#000" opacity="0.28" /> : null}
        <g className="m-lights">
          {Array.from({ length: 8 }, (_, index) => (
            <circle key={index} cx={120 + index * 80} cy={18} r="5" fill="#FFD23F" opacity={0.35 + (index % 2) * 0.4}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.6 + index * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
        <g
          data-p="window"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Window" : "Fenêtre"}
          onClick={() => setSky((current) => (current === "real" ? "rain" : current === "rain" ? "night" : current === "night" ? "sun" : "real"))}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setSky((current) => (current === "real" ? "rain" : current === "rain" ? "night" : current === "night" ? "sun" : "real"));
          }}
        >
          <rect x="300" y="36" width="200" height="140" rx="12" fill={skyFill} />
          {sky === "sun" ? <polygon points="340,150 400,70 460,150" fill="#fff59a" opacity="0.45" /> : null}
          {sky === "night" || (sky === "real" && dark) ? <circle cx="450" cy="70" r="14" fill="#fff6c2" /> : null}
          {sky !== "night" && !(sky === "real" && dark) ? <path d="M310 150c40-30 70-10 100-28 20 24 50 20 70 8v46H310z" fill="#d7f3c8" /> : null}
          {sky === "rain"
            ? [0, 1, 2, 3, 4].map((drop) => <line key={drop} x1={330 + drop * 32} y1={60} x2={324 + drop * 32} y2={100} stroke="#dbe7ff" strokeWidth="3" />)
            : null}
          <rect x="396" y="36" width="8" height="140" fill="#fff6" />
          <rect x="300" y="100" width="200" height="8" fill="#fff6" />
        </g>
        <g data-p="curtains">
          <path d="M270 24h50l-10 180h-40z" fill="#FF2E93" />
          <path d="M480 24h50l10 180h-40z" fill="#FF2E93" />
        </g>
        <g
          data-p="clock"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Clock" : "Horloge"}
          onClick={() => {
            if (!clock) return;
            say(pickPhrase("clock", lang, childName).text.replaceAll("{time}", clockTime(lang, clock.getHours(), clock.getMinutes())));
          }}
          onKeyDown={(event) => {
            if (!clock) return;
            if (event.key === "Enter" || event.key === " ") say(pickPhrase("clock", lang, childName).text.replaceAll("{time}", clockTime(lang, clock.getHours(), clock.getMinutes())));
          }}
        >
          <circle cx="210" cy="90" r="28" fill="#fff" />
          <text x="210" y="96" textAnchor="middle" fontSize="14" fill="#2A0B4A">{clock ? `${clock.getHours()}:${String(clock.getMinutes()).padStart(2, "0")}` : "·:··"}</text>
        </g>
        <g
          data-p="books"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Bookshelf" : "Livres"}
          onClick={() => {
            say(pickPhrase("story", lang, childName).text);
            router.push("/kid/games/stories");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") router.push("/kid/games/stories");
          }}
        >
          <rect x="70" y="150" width="90" height="70" rx="6" fill="#5b2a86" />
          <rect x="78" y="160" width="16" height="50" fill="#FFD23F" />
          <rect x="98" y="166" width="16" height="44" fill="#FF2E93" />
          <rect x="118" y="158" width="16" height="52" fill="#fff" />
          <rect x="138" y="164" width="14" height="46" fill="#7C3AED" />
        </g>
        <g
          data-p="lamp"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Lamp" : "Lampe"}
          onClick={() => setLamp((on) => !on)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setLamp((on) => !on);
          }}
        >
          <rect x="600" y="180" width="10" height="90" fill="#2A0B4A" />
          <polygon points="570,190 640,190 625,140 585,140" fill={lamp ? "#FFD23F" : "#6b5a86"} />
          {lamp ? <ellipse cx="605" cy="200" rx="40" ry="16" fill="#FFD23F" opacity="0.35" /> : null}
        </g>
        <g
          data-p="plant"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Plant" : "Plante"}
          onClick={() => {
            setWiggle(true);
            window.setTimeout(() => setWiggle(false), 700);
          }}
        >
          <g style={{ transformOrigin: "678px 250px", transform: wiggle ? "rotate(8deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
            <rect x="660" y="250" width="36" height="40" rx="6" fill="#c47b4a" />
            <ellipse cx="678" cy="240" rx="28" ry="16" fill="#3fbf6a" />
            <ellipse cx="650" cy="230" rx="18" ry="12" fill="#2f9d55" />
            <ellipse cx="706" cy="228" rx="16" ry="11" fill="#57d07d" />
          </g>
        </g>
        <g
          data-p="fish"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Fish bowl" : "Bocal"}
          onClick={() => {
            setBubbles(true);
            say(pickPhrase("fish", lang, childName).text);
            window.setTimeout(() => setBubbles(false), 1600);
          }}
        >
          <ellipse cx="150" cy="300" rx="36" ry="28" fill="#9ad7ff" stroke="#fff" strokeWidth="3" />
          <ellipse cx="150" cy="292" rx="10" ry="6" fill="#ff8c42" />
          {bubbles ? <circle cx="160" cy="270" r="5" fill="#fff" /> : null}
          {bubbles ? <circle cx="142" cy="260" r="3" fill="#fff" /> : null}
        </g>
        <g data-p="rug">
          <ellipse cx="400" cy="430" rx="250" ry="28" fill="#FFD23F" />
          <ellipse cx="400" cy="430" rx="190" ry="16" fill="#ff8c42" />
        </g>
        <g
          data-p="sofa"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Sofa, Mochi naps" : "Canapé, Mochi fait dodo"}
          onClick={() => press(() => dispatch({ type: "sofaTap" }))}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") press(() => dispatch({ type: "sofaTap" }));
          }}
        >
          <rect x="80" y="330" width="220" height="70" rx="28" fill="#7C3AED" />
          <rect x="90" y="310" width="60" height="50" rx="16" fill="#9b6cf0" />
          <rect x="220" y="310" width="60" height="50" rx="16" fill="#9b6cf0" />
        </g>
        <g
          data-p="yarn"
          role="button"
          tabIndex={0}
          aria-label={lang === "en" ? "Yarn ball" : "Pelote"}
          onClick={() => press(() => {
            dispatch({ type: "yarnTap" });
            say(pickPhrase("yarn", lang, childName).text);
          })}
        >
          <circle cx={yarnX} cy="400" r="22" fill="#FF2E93" />
          <path d={`M${yarnX} 400c20-16 28 8 40-4`} fill="none" stroke="#FFD23F" strokeWidth="3" />
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-[18%] left-[34%] w-[34%] max-w-[240px]">
        <Mochi
          action={action}
          mood={mood}
          look={look}
          paused={machine.hidden}
          reduced={machine.reduced}
          label={lang === "en" ? "Mochi the cat" : "Mochi le chat"}
        />
      </div>
      <button
        type="button"
        className="absolute bottom-[22%] left-[34%] h-40 w-[34%] max-w-[240px] rounded-full"
        aria-label={lang === "en" ? "Pet Mochi" : "Caresse Mochi"}
        onClick={() => press(() => {
          dispatch({ type: "pet" });
          say(pickPhrase("purr", lang, childName).text);
        })}
      />
      <div className="absolute bottom-16 right-3 flex gap-1">
        {crew.map((friend) => (
          <button
            key={friend}
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15"
            aria-label={FRIEND_CAST[friend].name}
            onClick={() => say(lang === "en" ? FRIEND_CAST[friend].en : FRIEND_CAST[friend].fr)}
          >
            <FriendMark friend={friend} />
          </button>
        ))}
      </div>
      {beside ? (
        <p className="absolute right-6 bottom-24 rounded-full px-3 py-2 text-sm font-semibold text-plum" style={{ background: friendColor[beside] }}>
          {FRIEND_CAST[beside].name}
        </p>
      ) : null}
      {voice ? (
        <button
          type="button"
          className="absolute top-3 right-3 h-10 rounded-full bg-white/20 px-3 text-sm"
          aria-pressed={muted}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      ) : null}
      <p className="absolute top-3 left-3 rounded-full bg-sun px-3 py-1 text-sm font-semibold text-plum">{moveLabel(action, lang)}</p>
      {bubble ? (
        <button
          type="button"
          className="absolute top-16 right-8 h-16 w-16 rounded-full border-4 border-white text-xs font-bold text-plum"
          style={{ background: friendColor[bubble] }}
          onClick={() => {
            const friend = bubble;
            const greeting = lang === "en" ? FRIEND_CAST[friend].en : FRIEND_CAST[friend].fr;
            setBeside(friend);
            setBubble(null);
            press(() => dispatch({ type: "friendPop" }));
            say(greeting);
            onMeetFriend?.(friend);
            window.setTimeout(() => setBeside(null), 4000);
          }}
        >
          {FRIEND_CAST[bubble].name}
        </button>
      ) : null}
      <p className="px-4 pb-4 text-center text-lg">{line}</p>
    </div>
  );
}

function forcedAction(state: MochiState): MochiAction {
  if (state === "wander") return "walking";
  if (state === "chase-yarn") return "chasing";
  if (state === "nap" || state === "sleepy-at-bedtime") return "napping";
  if (state === "purr") return "happy";
  if (state === "cheer") return "cheering";
  return "idle";
}

function lineKey(action: MochiAction, hour: number): PhraseKey {
  if (action === "napping") return hour >= 20 ? "bedtime" : "nap";
  if (action === "happy") return "purr";
  if (action === "cheering") return "cheer";
  if (action === "chasing") return "yarn";
  if (action === "surprised") return "cheer";
  return greetingKey(hour);
}

function moveLabel(action: MochiAction, lang: "fr" | "en") {
  const labels: Record<MochiAction, { fr: string; en: string }> = {
    idle: { fr: "Mochi attend", en: "Mochi waits" },
    walking: { fr: "Mochi se promène", en: "Mochi walks" },
    chasing: { fr: "Mochi court après la laine", en: "Mochi chases the yarn" },
    napping: { fr: "Mochi fait la sieste", en: "Mochi naps" },
    stretching: { fr: "Mochi s'étire", en: "Mochi stretches" },
    yawning: { fr: "Mochi bâille", en: "Mochi yawns" },
    licking: { fr: "Mochi se lèche", en: "Mochi licks a paw" },
    pouncing: { fr: "Mochi bondit", en: "Mochi pounces" },
    happy: { fr: "Mochi ronronne", en: "Mochi purrs" },
    surprised: { fr: "Mochi est surprise", en: "Mochi is surprised" },
    cheering: { fr: "Mochi applaudit", en: "Mochi cheers" },
    listening: { fr: "Mochi écoute", en: "Mochi listens" },
  };
  return labels[action][lang];
}

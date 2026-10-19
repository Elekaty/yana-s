"use client";

import { useEffect, useState } from "react";
import { FriendMark } from "@/components/mochi/friend-mark";
import { GARDEN, gardenKind, gardenTheme } from "@/lib/garden/kinds";
import type { BubbleFriend } from "@/lib/mochi";
import { speak } from "@/lib/speak";
import styles from "./garden.module.css";

export function GardenBed({
  planted,
  fullAt,
  friends,
  lang,
  voice,
  fullLabel,
}: {
  planted: { slot: number; kind: string }[];
  fullAt: string | null;
  friends: BubbleFriend[];
  lang: "fr" | "en";
  voice: boolean;
  fullLabel: string;
}) {
  const [said, setSaid] = useState("");
  const [hidden, setHidden] = useState(false);
  const grown = new Map(planted.map((item) => [item.slot, item.kind]));
  const newest = planted.reduce((slot, item) => Math.max(slot, item.slot), -1);
  const theme = gardenTheme(fullAt, new Date());
  useEffect(() => {
    const onHide = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
  return (
    <div className={`rounded-[28px] p-3 ${hidden ? styles.paused : ""} ${theme === "night" ? "bg-[#14243f]" : "bg-[#1f6b3a]"}`}>
      <div className="grid grid-cols-4 justify-items-center gap-2">
        {GARDEN.map((item, slot) => {
          const kind = grown.get(slot);
          const plant = kind ? gardenKind(kind) : null;
          if (!plant) {
            return (
              <span key={slot} data-sway="true" className={`flex h-16 w-16 items-center justify-center text-3xl ${styles.sway}`} aria-hidden>
                🌱
              </span>
            );
          }
          const name = lang === "en" ? plant.en : plant.fr;
          return (
            <button
              key={slot}
              type="button"
              aria-label={name}
              data-sway="true"
              data-pop={slot === newest ? "true" : "false"}
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl ${styles.sway} ${slot === newest ? styles.pop : ""}`}
              onClick={() => {
                setSaid(name);
                if (!voice) return;
                blip();
                speak({ text: name, lang });
              }}
            >
              {plant.emoji}
            </button>
          );
        })}
      </div>
      <div className={styles.bed}>
        <span className={`${styles.bug} ${styles.bee}`} data-bug="bee" aria-hidden>🐝</span>
        <span className={`${styles.bug} ${styles.butterfly}`} data-bug="butterfly" aria-hidden>🦋</span>
        {friends.map((friend, index) => (
          <span key={friend} className={styles.walker} style={{ left: `${index * 12}px`, animationDelay: `${index * 0.8}s` }}>
            <FriendMark friend={friend} />
          </span>
        ))}
      </div>
      {said ? <p className="text-center text-2xl">{said}</p> : null}
      {fullAt ? <p className="text-center text-3xl">{fullLabel}</p> : null}
    </div>
  );
}

function blip() {
  const audio = new AudioContext();
  const tone = audio.createOscillator();
  const level = audio.createGain();
  tone.frequency.value = 620;
  level.gain.value = 0.04;
  tone.connect(level).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.12);
  window.setTimeout(() => void audio.close(), 200);
}

"use client";

import { useId } from "react";
import type { MochiAction, MochiMood } from "@/lib/mochi/machine";
import styles from "./mochi.module.css";

const poseClass: Record<MochiAction, string> = {
  idle: "",
  walking: styles.walk,
  chasing: styles.walk,
  napping: styles.nap,
  stretching: styles.stretch,
  yawning: styles.yawn,
  licking: styles.lick,
  pouncing: styles.pounce,
  happy: styles.happy,
  surprised: styles.surprised,
  cheering: styles.cheer,
  listening: styles.listen,
};

export function Mochi({
  action,
  mood,
  look,
  paused,
  reduced,
  waving = false,
  label,
}: {
  action: MochiAction;
  mood: MochiMood;
  look: { x: number; y: number };
  paused: boolean;
  reduced: boolean;
  waving?: boolean;
  label: string;
}) {
  const shade = useId().replace(/:/g, "");
  const moodClass = mood === "lazy" ? styles.lazy : mood === "sleepy" ? styles.sleepy : "";
  return (
    <svg
      viewBox="0 0 240 232"
      role="img"
      aria-label={label}
      className={`${styles.rig} ${poseClass[action]} ${moodClass} ${waving ? styles.wave : ""} ${reduced ? styles.calm : ""} ${paused ? styles.paused : ""}`}
      style={{ ["--lx" as string]: `${look.x}px`, ["--ly" as string]: `${look.y}px` }}
    >
      <defs>
        <radialGradient id={shade} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#e3d6fb" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="225" rx="84" ry="7" fill="#0003" />
      <g className={styles.tl}>
        <path d="M186 178Q216 176 222 150" stroke="#d9c6f2" strokeWidth="24" fill="none" strokeLinecap="round" />
        <path d="M186 178Q216 176 222 150" stroke="#fff" strokeWidth="19" fill="none" strokeLinecap="round" />
        <g className={styles.tp}>
          <path d="M222 150Q230 126 212 112" stroke="#d9c6f2" strokeWidth="21" fill="none" strokeLinecap="round" />
          <path d="M222 150Q230 126 212 112" stroke="#fff" strokeWidth="16" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g className={styles.h1}>
        <ellipse cx="72" cy="198" rx="30" ry="26" fill={`url(#${shade})`} stroke="#d9c6f2" strokeWidth="2.5" />
        <ellipse cx="66" cy="219" rx="20" ry="9" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
      </g>
      <g className={styles.h2}>
        <ellipse cx="168" cy="198" rx="30" ry="26" fill={`url(#${shade})`} stroke="#d9c6f2" strokeWidth="2.5" />
        <ellipse cx="174" cy="219" rx="20" ry="9" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
      </g>
      <g className={styles.bd}>
        <ellipse cx="120" cy="170" rx="76" ry="54" fill={`url(#${shade})`} stroke="#d9c6f2" strokeWidth="2.5" />
        <ellipse cx="120" cy="184" rx="46" ry="34" fill="#fff0f7" />
      </g>
      <g className={styles.f1}>
        <ellipse cx="96" cy="198" rx="15" ry="26" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
        <ellipse cx="96" cy="219" rx="18" ry="9" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
        <path d="M90 222v-4M96 223v-4M102 222v-4" stroke="#d9c6f2" strokeWidth="2" />
      </g>
      <g className={styles.f2}>
        <ellipse cx="144" cy="198" rx="15" ry="26" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
        <ellipse cx="144" cy="219" rx="18" ry="9" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" />
        <path d="M138 222v-4M144 223v-4M150 222v-4" stroke="#d9c6f2" strokeWidth="2" />
      </g>
      <g className={styles.hd}>
        <g className={styles.e1}>
          <path d="M60 78L68 24L108 58Z" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M72 64L75 40L94 57Z" fill="#ffb3d9" />
        </g>
        <g className={styles.e2}>
          <path d="M180 78L172 24L132 58Z" fill="#fff" stroke="#d9c6f2" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M168 64L165 40L146 57Z" fill="#ffb3d9" />
        </g>
        <ellipse cx="120" cy="100" rx="70" ry="55" fill={`url(#${shade})`} stroke="#d9c6f2" strokeWidth="2.5" />
        <path d="M54 106q-14 6-8 18q8 4 14-4Z M186 106q14 6 8 18q-8 4-14-4Z" fill="#fff" stroke="#d9c6f2" strokeWidth="2" />
        <path d="M112 46v12M120 44v14M128 46v12" stroke="#e9d5ff" strokeWidth="4" strokeLinecap="round" />
        <g className={styles.ey}>
          <ellipse className={styles.scl} cx="90" cy="99" rx="17" ry="19" fill="#fff" stroke="#d9c6f2" strokeWidth="2" />
          <ellipse className={styles.scl} cx="150" cy="99" rx="17" ry="19" fill="#fff" stroke="#d9c6f2" strokeWidth="2" />
          <g className={styles.pup}>
            <circle cx="91" cy="101" r="12" fill="#6ee7f9" />
            <ellipse cx="91" cy="101" rx="6.5" ry="9" fill="#2a0b4a" />
            <circle cx="95" cy="95" r="4.5" fill="#fff" />
            <circle cx="151" cy="101" r="12" fill="#6ee7f9" />
            <ellipse cx="151" cy="101" rx="6.5" ry="9" fill="#2a0b4a" />
            <circle cx="155" cy="95" r="4.5" fill="#fff" />
          </g>
          <ellipse className={styles.lid} cx="90" cy="99" rx="18" ry="20" fill="#f7f1ff" stroke="#d9c6f2" strokeWidth="2" />
          <ellipse className={styles.lid} cx="150" cy="99" rx="18" ry="20" fill="#f7f1ff" stroke="#d9c6f2" strokeWidth="2" />
        </g>
        <g className={styles.hp}>
          <path d="M74 102q16-18 32 0M134 102q16-18 32 0" stroke="#2a0b4a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
        <circle cx="64" cy="118" r="9" fill="#ff5fa2" opacity="0.4" />
        <circle cx="176" cy="118" r="9" fill="#ff5fa2" opacity="0.4" />
        <ellipse className={styles.mo} cx="120" cy="132" rx="12" ry="13" fill="#8a1d44" />
        <path d="M113 114h14l-7 9z" fill="#ff7aa8" />
        <path d="M120 123Q112 135 100 128M120 123Q128 135 140 128" stroke="#2a0b4a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse className={styles.tg} cx="120" cy="141" rx="6" ry="4" fill="#ff7aa8" />
        <g className={styles.wh} stroke="#2a0b4a" strokeOpacity="0.4" strokeWidth="2.4" strokeLinecap="round">
          <path d="M56 120l-34-6M56 128l-34 4M184 120l34-6M184 128l34 4" />
        </g>
      </g>
      <path d="M76 152Q120 176 164 152" stroke="#ff5fa2" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="120" cy="168" r="9" fill="#ffd23f" stroke="#e0a800" strokeWidth="2" />
    </svg>
  );
}

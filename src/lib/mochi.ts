export const MOCHI_STATES = [
  "idle",
  "wander",
  "chase-yarn",
  "nap",
  "purr",
  "cheer",
  "think",
  "sleepy-at-bedtime",
  "greet",
] as const;

export type MochiState = (typeof MOCHI_STATES)[number];

export const BUBBLE_FRIENDS = ["bunny", "panda", "fox", "corgi", "hamster"] as const;
export type BubbleFriend = (typeof BUBBLE_FRIENDS)[number];

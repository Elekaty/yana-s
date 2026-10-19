export const MOCHI_ACTIONS = [
  "idle",
  "walking",
  "chasing",
  "napping",
  "stretching",
  "yawning",
  "licking",
  "pouncing",
  "happy",
  "surprised",
  "cheering",
  "listening",
] as const;

export type MochiAction = (typeof MOCHI_ACTIONS)[number];
export type MochiMood = "alert" | "lazy" | "sleepy";

export type MochiMachine = {
  action: MochiAction;
  mood: MochiMood;
  hidden: boolean;
  busy: boolean;
  reduced: boolean;
};

export type MochiEvent =
  | { type: "tap" }
  | { type: "pet" }
  | { type: "friendPop" }
  | { type: "correct" }
  | { type: "wrong" }
  | { type: "hint" }
  | { type: "levelUp" }
  | { type: "micLevel"; level: number }
  | { type: "yarnTap" }
  | { type: "sofaTap" }
  | { type: "idleTick"; roll: number }
  | { type: "actionDone"; roll: number }
  | { type: "visibility"; hidden: boolean }
  | { type: "busy"; value: boolean }
  | { type: "reduced"; value: boolean }
  | { type: "hour"; hour: number };

export function initialMochi(hour = 12): MochiMachine {
  return { action: "idle", mood: moodForHour(hour), hidden: false, busy: false, reduced: false };
}

export function moodForHour(hour: number): MochiMood {
  if (hour >= 20 || hour < 6) return "sleepy";
  if (hour >= 18) return "lazy";
  return "alert";
}

export function bedtimeStep(mood: MochiMood, action: MochiAction, stretched: boolean, yawned: boolean): "stretch" | "yawn" | null {
  if (mood !== "sleepy" || action !== "idle" || yawned) return null;
  if (!stretched) return "stretch";
  return "yawn";
}

export function idleAction(roll: number): MochiAction {
  if (roll < 0.28) return "walking";
  if (roll < 0.42) return "chasing";
  if (roll < 0.52) return "napping";
  if (roll < 0.64) return "stretching";
  if (roll < 0.76) return "yawning";
  if (roll < 0.88) return "licking";
  return "pouncing";
}

const ACTION_MS: Partial<Record<MochiAction, number>> = {
  walking: 2400,
  chasing: 3000,
  napping: 6000,
  stretching: 2200,
  yawning: 2400,
  licking: 2800,
  pouncing: 1100,
  happy: 1500,
  surprised: 700,
  cheering: 600,
};

export function actionMs(action: MochiAction) {
  return ACTION_MS[action] ?? 0;
}

export function nextMochi(state: MochiMachine, event: MochiEvent): MochiMachine {
  if (event.type === "visibility") return { ...state, hidden: event.hidden };
  if (event.type === "busy") return { ...state, busy: event.value };
  if (event.type === "reduced") return { ...state, reduced: event.value, action: event.value ? "idle" : state.action };
  if (event.type === "hour") return { ...state, mood: moodForHour(event.hour) };
  if (event.type === "idleTick") {
    if (state.hidden || state.busy || state.reduced || state.action !== "idle") return state;
    return { ...state, action: idleAction(event.roll) };
  }
  if (event.type === "actionDone") {
    if (state.action === "yawning" && event.roll < 0.5) return { ...state, action: "napping", mood: "lazy" };
    if (state.action === "yawning") return { ...state, action: "idle", mood: "lazy" };
    if (state.action === "listening") return state;
    return { ...state, action: "idle" };
  }
  if (event.type === "micLevel") {
    if (event.level >= 0.4) return { ...state, action: "listening" };
    if (state.action === "listening") return { ...state, action: "idle" };
    return state;
  }
  if (event.type === "friendPop") return { ...state, action: "surprised" };
  if (event.type === "correct" || event.type === "levelUp") return { ...state, action: "cheering" };
  if (event.type === "yarnTap") return { ...state, action: "chasing" };
  if (event.type === "sofaTap") return { ...state, action: "napping" };
  if (event.type === "wrong" || event.type === "hint") return { ...state, action: "idle" };
  return { ...state, action: "happy" };
}

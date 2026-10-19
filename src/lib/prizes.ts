import { createHash } from "crypto";

export function imageHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export type PrizeSettings = {
  onTimeStars: number;
  chestEverySec: number;
  chestDailyCap: number;
};

export type PrizeState = {
  checkins: string[];
  perfectWeeks: string[];
  activeSec: number;
  chestsToday: number;
  chestDay: string;
  stickers: string[];
  dances: number;
  friends: string[];
  lastChest: string;
};

export type ChestPrize =
  | { kind: "stars"; amount: number }
  | { kind: "sticker"; id: string }
  | { kind: "dance" }
  | { kind: "friend"; friend: string };

const CHEST_KINDS = ["stars", "stars", "sticker", "dance", "friend"] as const;
const STICKERS = ["sun", "heart", "moon", "yarn", "flower"];
const CHEST_FRIENDS = ["bunny", "panda", "fox", "corgi", "hamster"];

export type StarAward = { amount: number; reason: string };

export function prizeSettings(raw: unknown): PrizeSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    onTimeStars: clamp(source.on_time_stars, 1, 5, 2),
    chestEverySec: clamp(source.chest_minutes, 5, 60, 10) * 60,
    chestDailyCap: clamp(source.chest_daily_cap, 0, 5, 3),
  };
}

export function readPrizeState(raw: unknown): PrizeState {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const prizes = source.prizes && typeof source.prizes === "object" ? (source.prizes as Record<string, unknown>) : {};
  return {
    checkins: strings(prizes.checkins),
    perfectWeeks: strings(prizes.perfectWeeks),
    activeSec: clamp(prizes.activeSec, 0, 100_000, 0),
    chestsToday: clamp(prizes.chestsToday, 0, 5, 0),
    chestDay: typeof prizes.chestDay === "string" ? prizes.chestDay : "",
    stickers: strings(prizes.stickers),
    dances: clamp(prizes.dances, 0, 100, 0),
    friends: strings(prizes.friends),
    lastChest: typeof prizes.lastChest === "string" ? prizes.lastChest : "",
  };
}

export function openChest(day: string, index: number, takenFriends: string[]): ChestPrize {
  const roll = chestRoll(day, index);
  const kind = CHEST_KINDS[roll % CHEST_KINDS.length] ?? "stars";
  if (kind === "sticker") return { kind, id: STICKERS[roll % STICKERS.length] ?? "sun" };
  if (kind === "dance") return { kind };
  if (kind === "friend") {
    const friend = CHEST_FRIENDS.find((name) => !takenFriends.includes(name));
    if (friend) return { kind, friend };
  }
  return { kind: "stars", amount: chestStars(day, index) };
}

export function chestStars(day: string, index: number) {
  return (chestRoll(day, index) % 3) + 1;
}

function chestRoll(day: string, index: number) {
  return [...`${day}:${index}`].reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function addStudySeconds(state: PrizeState, day: string, seconds: number, settings: PrizeSettings) {
  const next: PrizeState = {
    ...state,
    checkins: [...state.checkins],
    perfectWeeks: [...state.perfectWeeks],
    stickers: [...state.stickers],
    friends: [...state.friends],
  };
  if (next.chestDay !== day) {
    next.chestDay = day;
    next.chestsToday = 0;
    next.activeSec = 0;
  }
  next.activeSec += Math.max(0, Math.floor(seconds));
  const awards: StarAward[] = [];
  const prizes: ChestPrize[] = [];
  while (settings.chestDailyCap > 0 && next.activeSec >= settings.chestEverySec && next.chestsToday < settings.chestDailyCap) {
    next.activeSec -= settings.chestEverySec;
    next.chestsToday += 1;
    const prize = openChest(day, next.chestsToday, next.friends);
    prizes.push(prize);
    if (prize.kind === "stars") {
      awards.push({ amount: prize.amount, reason: `chest:${day}:${next.chestsToday}` });
      next.lastChest = `stars:${prize.amount}`;
    } else if (prize.kind === "sticker") {
      if (!next.stickers.includes(prize.id)) next.stickers.push(prize.id);
      next.lastChest = `sticker:${prize.id}`;
    } else if (prize.kind === "dance") {
      next.dances += 1;
      next.lastChest = "dance";
    } else {
      next.friends.push(prize.friend);
      next.lastChest = `friend:${prize.friend}`;
    }
  }
  return { state: next, awards, prizes };
}

export function markCheckIn(state: PrizeState, day: string, weekDays: string[], weekKey: string, open: boolean, settings: PrizeSettings, freeDays: string[] = []) {
  if (freeDays.includes(day)) return { state, awards: [] as StarAward[], status: "paused" as const };
  if (!open) return { state, awards: [] as StarAward[], status: "closed" as const };
  if (state.checkins.includes(day)) return { state, awards: [] as StarAward[], status: "already" as const };
  const checkins = [...state.checkins, day];
  const awards: StarAward[] = [{ amount: settings.onTimeStars, reason: `checkin:${day}` }];
  const perfectWeeks = [...state.perfectWeeks];
  const perfect = weekDays.every((item) => checkins.includes(item) || freeDays.includes(item));
  if (perfect && !perfectWeeks.includes(weekKey)) {
    perfectWeeks.push(weekKey);
    awards.push({ amount: 5, reason: `week:${weekKey}:a` }, { amount: 5, reason: `week:${weekKey}:b` });
  }
  return { state: { ...state, checkins, perfectWeeks }, awards, status: perfect && awards.length > 1 ? ("week" as const) : ("ok" as const) };
}

export function weekDays(monday: string) {
  const date = new Date(`${monday}T12:00:00Z`);
  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(date);
    day.setUTCDate(date.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function mondayKey(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const weekday = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
  return date.toISOString().slice(0, 10);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

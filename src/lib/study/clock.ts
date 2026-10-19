export type ClockMode = "study" | "heads_up" | "break";

export type StudySettings = {
  studyMinutes: number;
  breakMinutes: number;
  headsUpMinutes: number;
  maxPostponements: number;
};

export type StudyClock = {
  mode: ClockMode;
  remainingSec: number;
  postponements: number;
  breakAwarded: boolean;
};

export const DEFAULT_STUDY: StudySettings = {
  studyMinutes: 20,
  breakMinutes: 15,
  headsUpMinutes: 5,
  maxPostponements: 2,
};

export const IDLE_MS = 30_000;

export function studySettings(raw: unknown): StudySettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const studyMinutes = clampInt(source.study_minutes, 5, 60, DEFAULT_STUDY.studyMinutes);
  const headsUpMinutes = Math.min(
    studyMinutes - 1,
    clampInt(source.heads_up_minutes, 1, 15, DEFAULT_STUDY.headsUpMinutes),
  );
  return {
    studyMinutes,
    breakMinutes: clampInt(source.break_minutes, 5, 40, DEFAULT_STUDY.breakMinutes),
    headsUpMinutes,
    maxPostponements: clampInt(source.max_postponements, 0, 4, DEFAULT_STUDY.maxPostponements),
  };
}

export function initialClock(settings: StudySettings): StudyClock {
  return {
    mode: "study",
    remainingSec: settings.studyMinutes * 60,
    postponements: 0,
    breakAwarded: false,
  };
}

export function tickClock(clock: StudyClock, settings: StudySettings, active: boolean, paused = false) {
  if (paused || !active) return { clock, finishedBreak: false };
  if (clock.mode === "break" && clock.remainingSec <= 0) {
    return { clock, finishedBreak: !clock.breakAwarded };
  }
  return step(clock, settings, 1);
}

export function applyClientTick(input: {
  saved: StudyClock;
  savedAt: number;
  proposedRemaining: number;
  now: number;
  settings: StudySettings;
  paused?: boolean;
}) {
  if (input.paused) return { clock: input.saved, finishedBreak: false };
  const elapsed = Math.max(0, Math.floor((input.now - input.savedAt) / 1000));
  if (input.saved.mode === "break" && input.saved.remainingSec <= 0) {
    return { clock: input.saved, finishedBreak: !input.saved.breakAwarded };
  }
  const proposed = Math.min(input.saved.remainingSec, Math.max(0, Math.floor(input.proposedRemaining)));
  const floor = Math.max(0, input.saved.remainingSec - elapsed);
  const remainingSec = Math.max(floor, proposed);
  if (remainingSec > 0) {
    return {
      clock: withMode({ ...input.saved, remainingSec }, input.settings),
      finishedBreak: false,
    };
  }
  if (input.saved.remainingSec > elapsed) {
    return {
      clock: withMode({ ...input.saved, remainingSec: floor }, input.settings),
      finishedBreak: false,
    };
  }
  return step({ ...input.saved, remainingSec: 1 }, input.settings, 1);
}

export function postponeClock(clock: StudyClock, settings: StudySettings, extraMinutes: number): StudyClock {
  if (clock.mode === "break") return clock;
  if (extraMinutes !== 5 && extraMinutes !== 10) return clock;
  if (clock.postponements >= settings.maxPostponements) return clock;
  return withMode(
    {
      ...clock,
      remainingSec: clock.remainingSec + extraMinutes * 60,
      postponements: clock.postponements + 1,
    },
    settings,
  );
}

export function skipBreakClock(clock: StudyClock, settings: StudySettings): StudyClock {
  if (clock.mode !== "break") return clock;
  return initialClock(settings);
}

export function focusMeter(clock: StudyClock, studyMinutes: number) {
  if (clock.mode === "break") return null;
  const total = Math.max(1, studyMinutes * 60);
  const remaining = Math.max(0, clock.remainingSec);
  return { remaining, ratio: Math.min(1, remaining / total) };
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function rewardAmount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

function step(clock: StudyClock, settings: StudySettings, seconds: number) {
  const remainingSec = clock.remainingSec - seconds;
  if (remainingSec > 0) {
    return { clock: withMode({ ...clock, remainingSec }, settings), finishedBreak: false };
  }
  if (clock.mode === "break") {
    return { clock: { ...clock, remainingSec: 0 }, finishedBreak: !clock.breakAwarded };
  }
  return {
    clock: {
      mode: "break" as const,
      remainingSec: settings.breakMinutes * 60,
      postponements: clock.postponements,
      breakAwarded: false,
    },
    finishedBreak: false,
  };
}

function withMode(clock: StudyClock, settings: StudySettings): StudyClock {
  if (clock.mode === "break") return clock;
  const mode = clock.remainingSec <= settings.headsUpMinutes * 60 ? "heads_up" : "study";
  return { ...clock, mode };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

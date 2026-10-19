import { describe, expect, it } from "vitest";
import {
  applyClientTick,
  DEFAULT_STUDY,
  focusMeter,
  formatClock,
  initialClock,
  postponeClock,
  rewardAmount,
  skipBreakClock,
  studySettings,
  tickClock,
} from "@/lib/study/clock";
import { hintText, stepsFromGames } from "@/lib/study/homework";

const settings = DEFAULT_STUDY;

describe("study clock", () => {
  it("reads parent timings and keeps the defaults", () => {
    expect(studySettings({ study_minutes: 25, break_minutes: 10, heads_up_minutes: 4, max_postponements: 1 })).toEqual({
      studyMinutes: 25,
      breakMinutes: 10,
      headsUpMinutes: 4,
      maxPostponements: 1,
    });
    expect(studySettings(null)).toEqual(settings);
  });

  it("counts a second only while she is active", () => {
    const clock = { ...initialClock(settings), remainingSec: 301 };
    expect(tickClock(clock, settings, false).clock.remainingSec).toBe(301);
    expect(tickClock(clock, settings, true, true).clock.remainingSec).toBe(301);
    const next = tickClock(clock, settings, true);
    expect(next.clock.remainingSec).toBe(300);
    expect(next.clock.mode).toBe("heads_up");
  });

  it("starts the break when study time runs out", () => {
    const started = tickClock({ mode: "heads_up", remainingSec: 1, postponements: 1, breakAwarded: false }, settings, true);
    expect(started.finishedBreak).toBe(false);
    expect(started.clock.mode).toBe("break");
    expect(started.clock.remainingSec).toBe(15 * 60);
  });

  it("finishes the break once, and a skip does not", () => {
    const ending = tickClock({ mode: "break", remainingSec: 1, postponements: 2, breakAwarded: false }, settings, true);
    expect(ending.finishedBreak).toBe(true);
    expect(ending.clock.remainingSec).toBe(0);
    const again = tickClock({ ...ending.clock, breakAwarded: true }, settings, true);
    expect(again.finishedBreak).toBe(false);
    const skipped = skipBreakClock(ending.clock, settings);
    expect(skipped.mode).toBe("study");
    expect(skipped.remainingSec).toBe(20 * 60);
  });

  it("allows two postponements of five or ten minutes", () => {
    const headsUp = { mode: "heads_up" as const, remainingSec: 120, postponements: 0, breakAwarded: false };
    const plus5 = postponeClock(headsUp, settings, 5);
    expect(plus5.remainingSec).toBe(420);
    expect(plus5.mode).toBe("study");
    const plus10 = postponeClock({ ...plus5, mode: "heads_up", remainingSec: 30 }, settings, 10);
    expect(plus10.postponements).toBe(2);
    expect(plus10.remainingSec).toBe(630);
    expect(postponeClock(plus10, settings, 5)).toEqual(plus10);
    expect(postponeClock({ ...headsUp, mode: "break" }, settings, 5).mode).toBe("break");
  });

  it("refuses a clock jump faster than the time since the last save", () => {
    const saved = { mode: "study" as const, remainingSec: 1000, postponements: 0, breakAwarded: false };
    const now = 10_000;
    const cheated = applyClientTick({ saved, savedAt: now - 1000, proposedRemaining: 0, now, settings });
    expect(cheated.clock.remainingSec).toBe(999);
    expect(cheated.clock.mode).toBe("study");
    const honest = applyClientTick({ saved, savedAt: now - 5000, proposedRemaining: 995, now, settings });
    expect(honest.clock.remainingSec).toBe(995);
  });

  it("formats the focus bar", () => {
    expect(focusMeter({ mode: "study", remainingSec: 600, postponements: 0, breakAwarded: false }, 20)).toEqual({ remaining: 600, ratio: 0.5 });
    expect(focusMeter({ mode: "break", remainingSec: 30, postponements: 0, breakAwarded: false }, 20)).toBeNull();
    expect(formatClock(125)).toBe("2:05");
    expect(rewardAmount(9)).toBe(5);
    expect(rewardAmount(0)).toBe(1);
  });
});

describe("homework steps", () => {
  it("orders the mini-tasks and clamps the star reward", () => {
    const steps = stepsFromGames(
      [
        { game_data: { id: 2, instruction_fr: "Deux", instruction_en: "Two", hint_1: "h", hint_2: "i", expected_answer: "2", reward_stars: 9 } },
        { game_data: { id: 1, instruction_fr: "Un", instruction_en: "One", hint_1: "a", hint_2: "b", expected_answer: "1", reward_stars: 2 } },
      ],
      "fr",
    );
    expect(steps.map((step) => step.instruction)).toEqual(["Un", "Deux"]);
    expect(steps[1]?.reward).toBe(5);
    expect(hintText(steps[0]!, 0)).toBe("");
    expect(hintText(steps[0]!, 1)).toBe("a");
    expect(hintText(steps[0]!, 3)).toBe("1");
  });
});

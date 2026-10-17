import { describe, expect, it } from "vitest";
import { addStudySeconds, chestStars, imageHash, markCheckIn, mondayKey, readPrizeState, weekDays } from "@/lib/prizes";

const settings = { onTimeStars: 2, chestEverySec: 600, chestDailyCap: 3 };

describe("photo hash", () => {
  it("is stable for the same bytes", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(imageHash(bytes)).toBe(imageHash(bytes));
    expect(imageHash(new Uint8Array([1, 2, 4]))).not.toBe(imageHash(bytes));
  });
});

describe("study chest", () => {
  it("opens one chest every ten active minutes and stops at the daily cap", () => {
    const start = readPrizeState({});
    const first = addStudySeconds(start, "2026-10-17", 600, settings);
    expect(first.awards).toHaveLength(1);
    expect(first.awards[0]?.amount).toBeGreaterThanOrEqual(1);
    expect(first.awards[0]?.amount).toBeLessThanOrEqual(3);
    const capped = addStudySeconds(first.state, "2026-10-17", 600 * 5, settings);
    expect(capped.state.chestsToday).toBe(3);
    expect(capped.awards).toHaveLength(2);
  });

  it("does not count a new day toward yesterday's cap", () => {
    const opened = addStudySeconds(readPrizeState({}), "2026-10-17", 600, settings);
    const next = addStudySeconds(opened.state, "2026-10-18", 600, settings);
    expect(next.state.chestsToday).toBe(1);
  });
});

describe("check-in", () => {
  it("awards the day once and a perfect week as two fives", () => {
    const monday = mondayKey("2026-10-16");
    const days = weekDays(monday);
    let state = readPrizeState({});
    for (const day of days.slice(0, 4)) {
      const marked = markCheckIn(state, day, days, monday, true, settings);
      state = marked.state;
      expect(marked.awards.map((award) => award.amount)).toEqual([2]);
    }
    const last = markCheckIn(state, days[4] ?? "", days, monday, true, settings);
    expect(last.awards.map((award) => award.amount)).toEqual([2, 5, 5]);
    expect(markCheckIn(last.state, days[4] ?? "", days, monday, true, settings).status).toBe("already");
    expect(markCheckIn(state, "2026-10-17", days, monday, false, settings).status).toBe("closed");
    expect(chestStars("2026-10-17", 1)).toBeGreaterThanOrEqual(1);
  });
});

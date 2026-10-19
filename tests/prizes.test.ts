import { describe, expect, it } from "vitest";
import { addStudySeconds, chestStars, imageHash, markCheckIn, mondayKey, openChest, readPrizeState, weekDays } from "@/lib/prizes";

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
    expect(first.prizes).toHaveLength(1);
    const prize = first.prizes[0];
    if (prize?.kind === "stars") {
      expect(first.awards.map((award) => award.amount)).toEqual([prize.amount]);
      expect(prize.amount).toBeGreaterThanOrEqual(1);
      expect(prize.amount).toBeLessThanOrEqual(3);
    } else {
      expect(first.awards).toEqual([]);
    }
    const capped = addStudySeconds(first.state, "2026-10-17", 600 * 5, settings);
    expect(capped.state.chestsToday).toBe(3);
    expect(capped.prizes).toHaveLength(2);
    expect(capped.awards.every((award) => award.amount >= 1 && award.amount <= 3)).toBe(true);
  });

  it("can open stars, a sticker, a dance, or a friend", () => {
    const seen = new Set<string>();
    let friendIndex = 0;
    for (let index = 1; index <= 40; index += 1) {
      const prize = openChest("2026-10-17", index, []);
      seen.add(prize.kind);
      if (prize.kind === "friend") friendIndex = index;
      if (prize.kind === "stars") expect(prize.amount).toBe(chestStars("2026-10-17", index));
    }
    expect([...seen].sort()).toEqual(["dance", "friend", "stars", "sticker"]);
    expect(openChest("2026-10-17", friendIndex, ["bunny", "panda", "fox", "corgi", "hamster"]).kind).toBe("stars");
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

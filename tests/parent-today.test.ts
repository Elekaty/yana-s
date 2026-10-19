import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { homeworkLabel, tonightLine } from "@/lib/parent/labels";
import { breakBannerText, noticeHoliday, togetherSuggestion, visibleBlocks, weekHasActivity, type WeekGlance } from "@/lib/parent/today";
import type { Holiday } from "@/lib/calendar/plan";

describe("today labels", () => {
  it("names the homework state", () => {
    expect(homeworkLabel(null, null, false)).toBe("Not scanned");
    expect(homeworkLabel(null, null, false, null, true)).toBe("No scan needed on this break");
    expect(tonightLine({ leaderName: "Break", start: "10:00", duration: 10, voiceNote: false, role: "break" })).toBe("Break: 10 min of games and reading");
    expect(homeworkLabel("ready", null, false)).toBe("Scanned, not started");
    expect(homeworkLabel("ready", "started", false)).toBe("In progress");
    expect(homeworkLabel("ready", "done", false)).toBe("Done");
    expect(homeworkLabel("ready", "started", true)).toBe("Stuck, needs you");
  });

  it("writes the tonight line", () => {
    expect(tonightLine({ leaderName: "Dad", start: "19:30", duration: 10, voiceNote: false })).toBe("Dad, 19:30, 10 min");
    expect(tonightLine({ leaderName: "Yana", start: "18:00", duration: 5, voiceNote: true })).toBe("Yana solo, 5 min, plus a voice note");
  });

  it("names the homework step", () => {
    expect(homeworkLabel("ready", "doing", false, { current: 2, total: 3 })).toBe("In progress (step 2 of 3)");
  });
});

const toussaint: Holiday = {
  family_id: null,
  label: "Toussaint break",
  starts_on: "2026-10-17",
  ends_on: "2026-11-01",
  zone: null,
  kind: "holiday",
};

const winterA: Holiday = {
  family_id: null,
  label: "Winter break",
  starts_on: "2027-02-13",
  ends_on: "2027-03-01",
  zone: "A",
  kind: "holiday",
};

const emptyWeek: WeekGlance = {
  homework: 0,
  games: 0,
  logic: 0,
  voice: 0,
  stories: 0,
  studyMinutes: 0,
  stars: 0,
  hints: 0,
  strong: 0,
  practicing: 0,
};

describe("today blocks", () => {
  it("shows only the first three blocks when nothing else is waiting", () => {
    expect(visibleBlocks({ comingUp: 0, breakBanner: false, week: false, rewards: 0, recordings: 0, setup: 0 })).toEqual(["needs", "tonight", "homework"]);
    expect(weekHasActivity(emptyWeek)).toBe(false);
  });

  it("keeps later blocks in order when they have something to show", () => {
    expect(visibleBlocks({ comingUp: 2, breakBanner: true, week: true, rewards: 1, recordings: 1, setup: 1 })).toEqual([
      "needs",
      "tonight",
      "homework",
      "coming",
      "break",
      "week",
      "rewards",
      "recordings",
      "setup",
    ]);
    expect(togetherSuggestion({ homework: 0, stories: 1, games: 1 })).toBe("Sit with her for one homework page.");
  });

  it("names the Toussaint banner and the three school days before it", () => {
    expect(breakBannerText(toussaint)).toBe("Toussaint break: back Mon 2 Nov. Here is what to expect in November.");
    expect(noticeHoliday("2026-10-18", [toussaint], "A")?.label).toBe("Toussaint break");
    expect(noticeHoliday("2026-10-14", [toussaint], "A")?.label).toBe("Toussaint break");
    expect(noticeHoliday("2026-10-13", [toussaint], "A")).toBeNull();
    expect(noticeHoliday("2027-02-10", [winterA], "A")?.zone).toBe("A");
    expect(noticeHoliday("2027-02-10", [winterA], "B")).toBeNull();
  });

  it("keeps the first three blocks in their own group on the page", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/parent/(gate)/page.tsx"), "utf8");
    const primary = page.slice(page.indexOf("data-today-primary"), page.indexOf("data-today-rest"));
    expect(primary.indexOf("Needs you")).toBeGreaterThan(-1);
    expect(primary.indexOf("Needs you")).toBeLessThan(primary.indexOf(">Tonight<"));
    expect(primary.indexOf(">Tonight<")).toBeLessThan(primary.indexOf("Homework today"));
    expect(primary).toContain("All caught up. Nothing is waiting for you.");
    expect(primary).toContain("py-2");
    expect(primary).not.toContain("Coming up");
    expect(primary).not.toContain("This week");
  });
});

import { describe, expect, it } from "vitest";
import { playDropped, scanUsage, suggestedNext, weeklyDigest } from "../src/lib/parent/progress";

describe("progress view", () => {
  it("suggests the first skills that have not started", () => {
    expect(suggestedNext([
      { key: "reading", level: 0 },
      { key: "tables", level: 1 },
      { key: "add", level: 0 },
      { key: "time", level: 0 },
      { key: "money", level: 0 },
    ])).toEqual(["reading", "add", "time"]);
  });

  it("flags a week that fell by a third", () => {
    expect(playDropped(4, 9)).toBe(true);
    expect(playDropped(7, 9)).toBe(false);
    expect(playDropped(0, 2)).toBe(false);
  });

  it("splits saved readings from new AI reads", () => {
    expect(scanUsage([true, false, true])).toEqual({ cache: 2, ai: 1 });
  });

  it("writes a plain weekly note", () => {
    expect(weeklyDigest({
      childName: "Yana",
      homework: 1,
      games: 2,
      logic: 0,
      voice: 1,
      stories: 1,
      stars: 4,
      hints: 2,
      strong: 1,
      practicing: 3,
    })).toBe("Yana this week: 1 homework, 2 games, 0 logic, 1 voice, 1 stories. 4 stars earned. 2 hints used. 1 strong, 3 practicing.");
  });
});

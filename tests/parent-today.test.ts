import { describe, expect, it } from "vitest";
import { homeworkLabel, tonightLine } from "@/lib/parent/labels";

describe("today labels", () => {
  it("names the homework state", () => {
    expect(homeworkLabel(null, null, false)).toBe("Not scanned");
    expect(homeworkLabel("ready", null, false)).toBe("Scanned, not started");
    expect(homeworkLabel("ready", "started", false)).toBe("In progress");
    expect(homeworkLabel("ready", "done", false)).toBe("Done");
    expect(homeworkLabel("ready", "started", true)).toBe("Stuck, needs you");
  });

  it("writes the tonight line", () => {
    expect(tonightLine({ leaderName: "Dad", start: "19:30", duration: 10, voiceNote: false })).toBe("Dad, 19:30, 10 min");
    expect(tonightLine({ leaderName: "Yana", start: "18:00", duration: 5, voiceNote: true })).toBe("Yana solo, 5 min, plus a voice note");
  });
});

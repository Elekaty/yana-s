import { describe, expect, it } from "vitest";
import { speakMs } from "@/lib/mochi/bus";
import { bedtimeStep, initialMochi, nextMochi } from "@/lib/mochi/machine";

describe("talking and bedtime", () => {
  it("keeps a spoken line between a short blip and eight seconds", () => {
    expect(speakMs("hi")).toBe(400);
    expect(speakMs("a".repeat(20))).toBe(1600);
    expect(speakMs("a".repeat(200))).toBe(8000);
  });

  it("stretches and then yawns once when she is idle and sleepy", () => {
    expect(bedtimeStep("alert", "idle", false, false)).toBeNull();
    expect(bedtimeStep("sleepy", "walking", false, false)).toBeNull();
    expect(bedtimeStep("sleepy", "idle", false, false)).toBe("stretch");
    const sleepy = initialMochi(22);
    const stretching = nextMochi(sleepy, { type: "idleTick", roll: 0.6 });
    expect(stretching.action).toBe("stretching");
    const rested = nextMochi(stretching, { type: "actionDone", roll: 0.9 });
    expect(rested.action).toBe("idle");
    expect(rested.mood).toBe("sleepy");
    expect(bedtimeStep(rested.mood, rested.action, true, false)).toBe("yawn");
    expect(nextMochi(rested, { type: "idleTick", roll: 0.7 }).action).toBe("yawning");
    expect(bedtimeStep("sleepy", "idle", true, true)).toBeNull();
    expect(nextMochi(rested, { type: "wrong" }).action).toBe("idle");
  });
});

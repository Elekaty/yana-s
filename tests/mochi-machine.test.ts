import { describe, expect, it } from "vitest";
import { PHRASE_KEYS, pickPhrase } from "@/lib/mochi/phrases";
import { idleAction, initialMochi, nextMochi } from "@/lib/mochi/machine";

describe("Mochi actions", () => {
  it("picks one idle action and does not start another until it ends", () => {
    const idle = initialMochi(10);
    const walking = nextMochi(idle, { type: "idleTick", roll: 0.1 });
    expect(walking.action).toBe("walking");
    expect(nextMochi(walking, { type: "idleTick", roll: 0.9 }).action).toBe("walking");
    expect(nextMochi(walking, { type: "actionDone", roll: 0.9 }).action).toBe("idle");
    expect(nextMochi(walking, { type: "pet" }).action).toBe("happy");
  });

  it("follows the idle weights and pauses when hidden, busy, or calm", () => {
    expect(idleAction(0)).toBe("walking");
    expect(idleAction(0.3)).toBe("chasing");
    expect(idleAction(0.45)).toBe("napping");
    expect(idleAction(0.6)).toBe("stretching");
    expect(idleAction(0.7)).toBe("yawning");
    expect(idleAction(0.8)).toBe("licking");
    expect(idleAction(0.95)).toBe("pouncing");
    const idle = initialMochi(10);
    expect(nextMochi({ ...idle, hidden: true }, { type: "idleTick", roll: 0 }).action).toBe("idle");
    expect(nextMochi({ ...idle, busy: true }, { type: "idleTick", roll: 0 }).action).toBe("idle");
    expect(nextMochi({ ...idle, reduced: true }, { type: "idleTick", roll: 0 }).action).toBe("idle");
  });

  it("lets a tap, a friend, a right answer, the yarn, and the sofa interrupt", () => {
    const walking = nextMochi(initialMochi(10), { type: "idleTick", roll: 0 });
    expect(nextMochi(walking, { type: "friendPop" }).action).toBe("surprised");
    expect(nextMochi(walking, { type: "correct" }).action).toBe("cheering");
    expect(nextMochi(walking, { type: "yarnTap" }).action).toBe("chasing");
    expect(nextMochi(walking, { type: "sofaTap" }).action).toBe("napping");
    expect(nextMochi(walking, { type: "wrong" }).action).toBe("idle");
    const yawn = nextMochi(initialMochi(15), { type: "idleTick", roll: 0.7 });
    expect(nextMochi(yawn, { type: "actionDone", roll: 0.2 }).action).toBe("napping");
    expect(nextMochi(yawn, { type: "actionDone", roll: 0.8 }).mood).toBe("lazy");
  });

  it("listens only while the microphone is loud", () => {
    const idle = initialMochi(22);
    expect(idle.mood).toBe("sleepy");
    const listening = nextMochi(idle, { type: "micLevel", level: 0.8 });
    expect(listening.action).toBe("listening");
    expect(nextMochi(listening, { type: "actionDone", roll: 0 }).action).toBe("listening");
    expect(nextMochi(listening, { type: "micLevel", level: 0.1 }).action).toBe("idle");
  });
});

describe("Mochi lines", () => {
  it("has three French lines and three English lines, and does not repeat the last one", () => {
    for (const key of PHRASE_KEYS) {
      const first = pickPhrase(key, "fr", "Yana", -1);
      const second = pickPhrase(key, "fr", "Yana", first.index);
      expect(second.index).not.toBe(first.index);
      expect(pickPhrase(key, "en", "Yana", 0).text).not.toContain("{name}");
    }
  });
});

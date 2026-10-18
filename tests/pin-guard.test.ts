import { describe, expect, it } from "vitest";
import { nextPinGuard, pinLocked } from "@/lib/pin-guard";

describe("PIN lock", () => {
  it("locks for 5 minutes after five wrong tries", () => {
    let guard = { fails: 0, until: 0 };
    for (let attempt = 0; attempt < 4; attempt += 1) guard = nextPinGuard(guard, 1_000, false);
    expect(pinLocked(guard, 1_000)).toBe(false);
    guard = nextPinGuard(guard, 1_000, false);
    expect(guard.fails).toBe(5);
    expect(pinLocked(guard, 1_000)).toBe(true);
    expect(pinLocked(guard, 1_000 + 5 * 60 - 1)).toBe(true);
    expect(pinLocked(guard, 1_000 + 5 * 60)).toBe(false);
    expect(nextPinGuard(guard, 1_000, true)).toEqual({ fails: 0, until: 0 });
  });
});

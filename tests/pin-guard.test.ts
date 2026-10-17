import { describe, expect, it } from "vitest";
import { demoMode } from "@/lib/preview";
import { nextPinGuard, pinLocked } from "@/lib/pin-guard";

describe("demo mode", () => {
  it("stays off on Vercel production", () => {
    const previous = process.env.VERCEL_ENV;
    const flag = process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(demoMode()).toBe(false);
    process.env.VERCEL_ENV = previous;
    process.env.NEXT_PUBLIC_DEMO_MODE = flag;
  });
});

describe("PIN lock", () => {
  it("locks for 15 minutes after five wrong tries", () => {
    let guard = { fails: 0, until: 0 };
    for (let attempt = 0; attempt < 4; attempt += 1) guard = nextPinGuard(guard, 1_000, false);
    expect(pinLocked(guard, 1_000)).toBe(false);
    guard = nextPinGuard(guard, 1_000, false);
    expect(guard.fails).toBe(5);
    expect(pinLocked(guard, 1_000)).toBe(true);
    expect(pinLocked(guard, 1_000 + 15 * 60)).toBe(false);
    expect(nextPinGuard(guard, 1_000, true)).toEqual({ fails: 0, until: 0 });
  });
});

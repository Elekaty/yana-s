import { describe, expect, it } from "vitest";
import { decideGate } from "@/lib/parent-gate";
import { demoDayLabel, demoEnabled, demoInstant, guestLinkStatus, readGuestLink } from "@/lib/parent/guest";

describe("guest link and demo day", () => {
  const now = new Date("2026-10-20T09:00:00.000Z");

  it("keeps a link for seven days and ends it after that", () => {
    expect(guestLinkStatus({
      token: "11111111-1111-4111-8111-111111111111",
      expiresAt: "2026-10-27T09:00:00.000Z",
      now,
    })).toBe("active");
    expect(guestLinkStatus({
      token: "11111111-1111-4111-8111-111111111111",
      expiresAt: "2026-10-20T09:00:00.000Z",
      now,
    })).toBe("ended");
    expect(guestLinkStatus({ token: "", expiresAt: "2026-10-27T09:00:00.000Z", now })).toBe("ended");
    expect(readGuestLink({ guest_token: "not-a-token", guest_expires_at: "2026-10-27T09:00:00.000Z" }, now)).toBeNull();
  });

  it("moves one day ahead only while development demo is on", () => {
    expect(demoEnabled({ demo_next_day: true }, "development")).toBe(true);
    expect(demoEnabled({ demo_next_day: true }, "production")).toBe(false);
    expect(demoInstant(now, false).toISOString()).toBe(now.toISOString());
    expect(demoInstant(now, true).toISOString()).toBe("2026-10-21T09:00:00.000Z");
    expect(demoDayLabel(now, "Europe/Paris", true)).toBe("21 October 2026");
  });

  it("leaves a guest link outside the parent gate", () => {
    const path = "/guest/11111111-1111-4111-8111-111111111111";
    expect(decideGate(path, false, false).redirectTo).toBeUndefined();
    expect(decideGate(path, true, false).redirectTo).toBeUndefined();
  });
});

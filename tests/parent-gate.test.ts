import { describe, expect, it } from "vitest";
import { decideGate } from "@/lib/parent-gate";

describe("parent PIN gate", () => {
  it("sends a signed-in parent without the unlock cookie to the PIN page", () => {
    for (const path of ["/parent", "/parent/inbox", "/parent/setup", "/parent/rewards"]) {
      expect(decideGate(path, true, false).redirectTo).toBe("/parent/unlock");
    }
  });

  it("keeps the PIN page itself from opening the parent screens", () => {
    expect(decideGate("/parent/unlock", true, false).redirectTo).toBeUndefined();
    expect(decideGate("/parent/unlock", true, true).redirectTo).toBeUndefined();
  });

  it("lets a valid cookie through and locks the area when kid mode opens", () => {
    expect(decideGate("/parent/inbox", true, true).redirectTo).toBeUndefined();
    expect(decideGate("/kid/home", true, true).clearUnlock).toBe(true);
    expect(decideGate("/parent", false, false).redirectTo).toBe("/login");
  });
});

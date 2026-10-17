import { describe, expect, it } from "vitest";
import { parentLoginEmail } from "@/lib/auth-name";

describe("parent login name", () => {
  it("turns a name into the same private sign-in address every time", () => {
    expect(parentLoginEmail("  Mom ")).toBe("mom@signin.yana-s.app");
    expect(parentLoginEmail("Yana's dad")).toBe("yana.s.dad@signin.yana-s.app");
  });

  it("rejects a name that is too short", () => {
    expect(parentLoginEmail("a")).toBeNull();
    expect(parentLoginEmail("  ")).toBeNull();
  });
});

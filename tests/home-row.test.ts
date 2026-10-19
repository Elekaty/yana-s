import { describe, expect, it } from "vitest";
import { helperMark } from "@/lib/kid/home-row";

describe("home helper mark", () => {
  it("uses the beach icon on a holiday", () => {
    expect(helperMark({ onBreak: true, role: "mom", start: "19:00" })).toEqual({ icon: "🏖️", text: "10:00" });
  });

  it("shows a short solo session when nobody is home", () => {
    expect(helperMark({ onBreak: false, role: "solo", start: "18:00" })).toEqual({ icon: "🐱", text: "5 min" });
  });

  it("shows who helps and the time", () => {
    expect(helperMark({ onBreak: false, role: "dad", start: "19:30" })).toEqual({ icon: "👨", text: "19:30" });
    expect(helperMark({ onBreak: false, role: "mom", start: "19:00" })).toEqual({ icon: "👩", text: "19:00" });
  });
});

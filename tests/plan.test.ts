import { describe, expect, it } from "vitest";
import { planTonight, type PlannerParent } from "@/lib/plan/tonight";

const window = { windowFrom: "18:00", windowTo: "20:00", capMinutes: 15 };

function parent(partial: Partial<PlannerParent> & Pick<PlannerParent, "id" | "role">): PlannerParent {
  return {
    name: partial.role === "mom" ? "Mom" : "Dad",
    duty: "off",
    freeFrom: "18:00",
    freeTo: "20:00",
    ...partial,
  };
}

describe("tonight plan", () => {
  it("never assigns a parent who is flying, including back-to-back trip days", () => {
    const mom = parent({ id: "mom", role: "mom", duty: "flying" });
    const dad = parent({ id: "dad", role: "dad" });
    expect(planTonight({ ...window, date: "2026-10-16", parents: [mom, dad] }).leaderId).toBe("dad");
    expect(planTonight({ ...window, date: "2026-10-17", parents: [mom, dad] }).leaderId).toBe("dad");
    expect(planTonight({ ...window, date: "2026-10-18", parents: [{ ...mom, duty: "layover" }, dad] }).leaderId).toBe("dad");
  });

  it("lets Mom lead on an even date when both are home, for 15 minutes", () => {
    const plan = planTonight({
      ...window,
      date: "2026-10-16",
      parents: [parent({ id: "mom", role: "mom" }), parent({ id: "dad", role: "dad" })],
    });
    expect(plan.leaderId).toBe("mom");
    expect(plan.duration).toBe(15);
    expect(plan.questions).toHaveLength(3);
  });

  it("gives Yana five minutes and a voice note when neither parent is home", () => {
    const plan = planTonight({
      ...window,
      date: "2026-10-16",
      parents: [
        parent({ id: "mom", role: "mom", duty: "flying" }),
        parent({ id: "dad", role: "dad", duty: "layover" }),
      ],
    });
    expect(plan.role).toBe("solo");
    expect(plan.duration).toBe(5);
    expect(plan.voiceNote).toBe(true);
  });

  it("keeps the session inside the daily cap", () => {
    const plan = planTonight({
      ...window,
      capMinutes: 10,
      date: "2026-10-16",
      parents: [parent({ id: "mom", role: "mom" }), parent({ id: "dad", role: "dad", duty: "flying" })],
    });
    expect(plan.leaderId).toBe("mom");
    expect(plan.duration).toBe(10);
  });

  it("uses a ten-minute morning plan on a school break and assigns nobody", () => {
    const plan = planTonight({
      ...window,
      date: "2026-10-19",
      onBreak: true,
      parents: [parent({ id: "mom", role: "mom" }), parent({ id: "dad", role: "dad" })],
    });
    expect(plan.role).toBe("break");
    expect(plan.leaderId).toBeNull();
    expect(plan.start).toBe("10:00");
    expect(plan.duration).toBe(10);
    expect(plan.voiceNote).toBe(false);
  });

  it("uses the swapped parent when that parent is free", () => {
    const plan = planTonight({
      ...window,
      date: "2026-10-16",
      preferId: "dad",
      parents: [parent({ id: "mom", role: "mom" }), parent({ id: "dad", role: "dad" })],
    });
    expect(plan.leaderId).toBe("dad");
    expect(plan.duration).toBe(10);
  });
});

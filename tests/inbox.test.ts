import { describe, expect, it } from "vitest";
import { canArchive, canUndo, chooseTier, classifyByRules, digestKind, escalationTargets } from "@/lib/inbox/sort";

const now = new Date("2026-10-16T18:00:00.000Z");

describe("inbox tiers", () => {
  it("sorts permission, homework, and a menu without asking the model", () => {
    expect(classifyByRules("Merci de signer l'autorisation.").tier).toBe("urgent");
    expect(classifyByRules("Devoir de maths pour lundi.").tier).toBe("important");
    expect(classifyByRules("Menu de la cantine.").tier).toBe("fyi");
  });

  it("moves an unsure message up one tier and asks the parent to check", () => {
    const vague = classifyByRules("Bonjour, voici un petit mot.");
    expect(vague.confidence).toBeLessThan(0.6);
    const choice = chooseTier(vague, { tier: "fyi", confidence: 0.4 });
    expect(choice.tier).toBe("important");
    expect(choice.pleaseCheck).toBe(true);
  });

  it("keeps a sender rule even when the words look ordinary", () => {
    expect(classifyByRules("Menu de la cantine.", { senderTier: "urgent" }).tier).toBe("urgent");
  });

  it("lets a parent undo only before the other parent ticks", () => {
    expect(canUndo(true, false)).toBe(true);
    expect(canUndo(true, true)).toBe(false);
    expect(canArchive(2, 1)).toBe(false);
    expect(canArchive(2, 2)).toBe(true);
  });

  it("alerts the parent who has not ticked an urgent message after 2 hours", () => {
    const targets = escalationTargets({
      tier: "urgent",
      status: "new",
      createdAt: "2026-10-16T15:00:00.000Z",
      now: now.toISOString(),
      parents: [
        { id: "mom", ticked: true },
        { id: "dad", ticked: false },
      ],
      alreadySent: [],
    });
    expect(targets).toEqual(["dad"]);
    expect(
      escalationTargets({
        tier: "urgent",
        status: "new",
        createdAt: "2026-10-16T17:30:00.000Z",
        now: now.toISOString(),
        parents: [{ id: "dad", ticked: false }],
        alreadySent: [],
      }),
    ).toEqual([]);
  });

  it("records the important digest at 7pm and the FYI digest on Sunday", () => {
    expect(digestKind(new Date("2026-10-16T17:00:00.000Z"), "Europe/Paris")).toBe("important");
    expect(digestKind(new Date("2026-10-18T16:00:00.000Z"), "Europe/Paris")).toBe("fyi");
    expect(digestKind(new Date("2026-10-16T10:00:00.000Z"), "Europe/Paris")).toBeNull();
  });
});

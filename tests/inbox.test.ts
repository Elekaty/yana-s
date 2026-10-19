import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { matchesInboxFilter, parseInboxFilter } from "@/lib/inbox/filter";
import { canArchive, canUndo, chooseTier, classifyByRules, digestKind, escalationTargets } from "@/lib/inbox/sort";
import { publicAppUrl } from "@/lib/intake/public-url";

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

describe("inbox filters", () => {
  it("keeps urgent, important, FYI, and waiting-for-me apart", () => {
    expect(parseInboxFilter("nope")).toBe("all");
    expect(matchesInboxFilter({ tier: "urgent" }, "urgent", false)).toBe(true);
    expect(matchesInboxFilter({ tier: "fyi" }, "urgent", true)).toBe(false);
    expect(matchesInboxFilter({ tier: "fyi" }, "mine", true)).toBe(true);
    expect(matchesInboxFilter({ tier: "fyi" }, "mine", false)).toBe(false);
  });

  it("points the webhook at the live app when the saved address is the retired host", () => {
    expect(publicAppUrl({ APP_URL: "https://yana-s-ele18.vercel.app" })).toBe("https://yana-s.vercel.app");
    expect(publicAppUrl({ APP_URL: "https://yana-s.vercel.app" })).toBe("https://yana-s.vercel.app");
    expect(publicAppUrl({})).toBe("");
  });

  it("shows the filter chips, the snooze choices, and the two-parent archive rule", () => {
    const page = readFileSync(path.join(process.cwd(), "src/app/parent/(gate)/inbox/page.tsx"), "utf8");
    expect(page).toContain("Waiting for me");
    expect(page).toContain("Needs both parents");
    expect(page).toContain("No messages yet. Forward a school email or post in the linked Telegram group.");
    expect(page).toContain("canArchive");
    const snooze = readFileSync(path.join(process.cwd(), "src/components/parent/snooze-forms.tsx"), "utf8");
    expect(snooze).toContain("30 min");
    expect(snooze).toContain("45 min");
    expect(snooze).toContain("1 hour");
  });
});

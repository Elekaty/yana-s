import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { reuseReadyScan } from "@/lib/scan/cache";
import { gameTypeFor } from "@/lib/scan/game-type";
import { applyMath, computeExpression } from "@/lib/scan/math";
import { SCAN_SYSTEM_PROMPT } from "@/lib/scan/prompt";
import { redactForModel } from "@/lib/scan/redact";
import { parseScanResult } from "@/lib/scan/schema";

describe("homework scan", () => {
  it("uses the system prompt from the plan", () => {
    const plan = readFileSync("docs/BUILD_PLAN.md", "utf8").replace(/\r\n/g, "\n");
    expect(plan).toContain(SCAN_SYSTEM_PROMPT);
  });

  it("checks the reading before it is stored", () => {
    const result = parseScanResult({
      parent_dashboard: {
        subject: "Maths",
        curriculum_skill: "Addition",
        translated_objective: "Add numbers to 20.",
        parent_action: "Ask her to count on.",
        confidence: 80,
        unclear_note: "",
      },
      child_ui: {
        island_title: "Additions",
        tasks: [
          {
            id: 1,
            instruction_fr: "Calcule 12 + 5",
            instruction_en: "Work out 12 + 5",
            type: "flashcard",
            expected_answer: "17",
            hint_1: "Start at 12.",
            hint_2: "Count five more.",
            reward_stars: 9,
          },
        ],
      },
      parent_questions: [
        { question_fr: "Combien font 12 et 5 ?", question_en: "What is 12 and 5?", expected_answer: "17" },
      ],
    });
    expect(result.parent_dashboard.confidence).toBe(0.8);
    expect(result.child_ui.tasks[0]?.reward_stars).toBe(5);
  });

  it("trusts the code when a maths answer disagrees", () => {
    const parsed = parseScanResult(sample("3 × 4", "3 x 4", "11"));
    const checked = applyMath(parsed);
    expect(checked.flagged).toBe(true);
    expect(checked.result.child_ui.tasks[0]?.expected_answer).toBe("12");
    expect(checked.result.parent_dashboard.confidence).toBeLessThanOrEqual(0.5);
  });

  it("keeps a maths answer that already matches", () => {
    const checked = applyMath(parseScanResult(sample("(2 + 3) × 4", "(2 + 3) x 4", "20")));
    expect(checked.flagged).toBe(false);
    expect(checked.result.child_ui.tasks[0]?.expected_answer).toBe("20");
    expect(computeExpression("8 ÷ 2")).toBe(4);
  });

  it("strips names, the school, and a street before a model call", () => {
    const redacted = redactForModel("Yana is at École Victor Hugo, 12 rue des Fleurs.", ["Yana"]);
    expect(redacted).not.toContain("Yana");
    expect(redacted).toContain("[name]");
    expect(redacted).toContain("[school]");
    expect(redacted).toContain("[address]");
    expect(redacted).not.toContain("Victor");
    expect(redacted).not.toContain("Fleurs");
  });

  it("reuses a ready reading and does not ask Gemini again", () => {
    expect(reuseReadyScan({ status: "ready", hasTask: true })).toBe(true);
    expect(reuseReadyScan({ status: "ready", hasTask: false })).toBe(false);
    expect(reuseReadyScan({ status: "failed", hasTask: true })).toBe(false);
    expect(reuseReadyScan(null)).toBe(false);
    const source = readFileSync("src/lib/scan/process.ts", "utf8");
    const enqueue = source.slice(source.indexOf("export async function enqueueScan"), source.indexOf("async function copyCachedScan"));
    expect(enqueue).toContain("cached: true");
    expect(enqueue).not.toContain("readHomeworkPhoto");
    const processing = source.slice(source.indexOf("export async function processNextScan"), source.indexOf("async function insertMiniGame"));
    expect(processing).toContain("readHomeworkPhoto");
  });

  it("maps each task type onto a game", () => {
    expect(gameTypeFor("multiple_choice")).toBe("flashcard");
    expect(gameTypeFor("physical_action")).toBe("physical");
    expect(gameTypeFor("say_aloud")).toBe("say_aloud");
    expect(gameTypeFor("write")).toBe("write");
  });
});

function sample(instructionFr: string, instructionEn: string, answer: string) {
  return {
    parent_dashboard: {
      subject: "Maths",
      curriculum_skill: "Calcul",
      translated_objective: "Practice a sum.",
      parent_action: "Let her try, then compare.",
      confidence: 0.9,
      unclear_note: "",
    },
    child_ui: {
      island_title: "Calcul",
      tasks: [
        {
          id: 1,
          instruction_fr: instructionFr,
          instruction_en: instructionEn,
          type: "flashcard",
          expected_answer: answer,
          hint_1: "Look at the sign.",
          hint_2: "Do the groups first.",
          reward_stars: 1,
        },
      ],
    },
    parent_questions: [{ question_fr: "Quel est le résultat ?", question_en: "What is the result?", expected_answer: answer }],
  };
}

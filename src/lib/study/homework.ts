import { rewardAmount } from "@/lib/study/clock";

export type HomeworkStep = {
  index: number;
  instruction: string;
  hint1: string;
  hint2: string;
  answer: string;
  reward: number;
};

export type RunStatus = "doing" | "done" | "stuck" | "needs_you";

export function stepsFromGames(rows: { game_data: unknown }[], lang: "fr" | "en"): HomeworkStep[] {
  const parsed = rows.flatMap((row) => {
    if (!row.game_data || typeof row.game_data !== "object") return [];
    const data = row.game_data as Record<string, unknown>;
    const instruction = stringField(lang === "en" ? data.instruction_en : data.instruction_fr);
    if (!instruction) return [];
    return [
      {
        order: Number(data.id ?? 0),
        instruction,
        hint1: stringField(data.hint_1),
        hint2: stringField(data.hint_2),
        answer: stringField(data.expected_answer),
        reward: rewardAmount(Number(data.reward_stars ?? 1)),
      },
    ];
  });
  parsed.sort((a, b) => a.order - b.order);
  return parsed.map((step, index) => ({
    index,
    instruction: step.instruction,
    hint1: step.hint1,
    hint2: step.hint2,
    answer: step.answer,
    reward: step.reward,
  }));
}

export function hintText(step: HomeworkStep, level: number) {
  if (level >= 3) return step.answer;
  if (level === 2) return step.hint2;
  if (level === 1) return step.hint1;
  return "";
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

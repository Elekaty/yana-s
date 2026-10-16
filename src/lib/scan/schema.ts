import { z } from "zod";

const taskSchema = z.object({
  id: z.coerce.number(),
  instruction_fr: z.string().trim().min(1),
  instruction_en: z.string().trim().min(1),
  type: z.enum(["flashcard", "multiple_choice", "physical_action", "say_aloud", "write"]),
  options: z.array(z.string()).optional().default([]),
  expected_answer: z.string(),
  hint_1: z.string(),
  hint_2: z.string(),
  reward_stars: z.coerce.number().transform((value) => Math.min(5, Math.max(1, Math.round(value)))),
});

export const scanResultSchema = z.object({
  parent_dashboard: z.object({
    subject: z.string().trim().min(1),
    curriculum_skill: z.string(),
    translated_objective: z.string().trim().min(1),
    parent_action: z.string().trim().min(1),
    confidence: z.coerce.number().transform((value) => {
      const normalized = value > 1 ? value / 100 : value;
      return Math.min(1, Math.max(0, normalized));
    }),
    unclear_note: z.string().optional().default(""),
  }),
  child_ui: z.object({
    island_title: z.string().trim().min(1),
    tasks: z.array(taskSchema).min(1).max(3),
  }),
  parent_questions: z
    .array(
      z.object({
        question_fr: z.string().trim().min(1),
        question_en: z.string().trim().min(1),
        expected_answer: z.string(),
      }),
    )
    .min(1)
    .max(3),
});

export type ScanResult = z.infer<typeof scanResultSchema>;
export type ScanTask = ScanResult["child_ui"]["tasks"][number];

export function parseScanResult(input: unknown) {
  return scanResultSchema.parse(input);
}

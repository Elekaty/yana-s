import { z } from "zod";

export const classifySchema = z.object({
  title: z.string().trim().min(1).max(140),
  summary_en: z.string().trim().min(1).max(800),
  tier: z.enum(["urgent", "important", "fyi"]).optional(),
  confidence: z.number().min(0).max(100).optional(),
});

export function parseClassifyResult(input: unknown) {
  return classifySchema.parse(input);
}

import { z } from "zod";

export const classifySchema = z.object({
  title: z.string().trim().min(1).max(140),
  summary_en: z.string().trim().min(1).max(800),
});

export function parseClassifyResult(input: unknown) {
  return classifySchema.parse(input);
}

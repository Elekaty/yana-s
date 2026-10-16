import "server-only";

import { z } from "zod";
import { askGemini } from "@/lib/intake/model";

const schema = z.object({
  title: z.string().trim().min(1).max(140),
  starts_at: z.string().nullish(),
});

const responseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    starts_at: { type: "string", nullable: true },
  },
  required: ["title"],
};

const PROMPT = `Extract one date from this school note.
Return a short English title and starts_at as an ISO 8601 datetime with a numeric offset.
If there is no date, set starts_at to null.
Do not include a child's name, a parent's name, a school name, or an address.`;

export async function extractEventDate(text: string) {
  const raw = await askGemini(PROMPT, responseSchema, text.slice(0, 4000));
  const parsed = schema.parse(raw);
  const starts = parsed.starts_at && !Number.isNaN(Date.parse(parsed.starts_at)) ? new Date(parsed.starts_at).toISOString() : "";
  return { title: parsed.title, startsAt: starts };
}

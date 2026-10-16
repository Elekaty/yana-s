import "server-only";

import { z } from "zod";
import { askGemini } from "@/lib/intake/model";
import type { Duty } from "@/lib/plan/tonight";
import { redactForModel } from "@/lib/scan/redact";

const duty = z.enum(["off", "flying", "standby", "layover"]);

const schema = z.object({
  days: z.array(z.object({ date: z.string(), status: z.string() })).max(40),
});

const responseSchema = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          status: { type: "string", enum: ["off", "flying", "standby", "layover"] },
        },
        required: ["date", "status"],
      },
    },
  },
  required: ["days"],
};

const PROMPT = `Read this roster image.
Return each day as date YYYY-MM-DD and status off, flying, standby, or layover.
off means a day at home. Do not include any person's name, a school name, or an address.`;

export async function extractRosterDays(file: { mime: string; bytes: Buffer }, names: string[] = []) {
  const raw = await askGemini(redactForModel(PROMPT, names), responseSchema, redactForModel("Read the attached roster.", names), file);
  const parsed = schema.parse(raw);
  const days: { date: string; status: Duty }[] = [];
  for (const day of parsed.days) {
    const status = duty.safeParse(day.status.toLowerCase());
    if (!status.success || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) continue;
    days.push({ date: day.date, status: status.data });
  }
  return days;
}

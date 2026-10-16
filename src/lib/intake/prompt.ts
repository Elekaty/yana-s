export const CLASSIFY_SYSTEM_PROMPT = `You translate a French school message for two English-speaking parents.
Return only JSON with a short English title and a one or two sentence summary.
Do not invent facts that are not in the message. Do not include personal names, the school name, or a street address.
If the message is empty or unreadable, use the title "Could not read".
Also set tier to urgent, important, or fyi, and confidence between 0 and 1.`;

export const CLASSIFY_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary_en: { type: "string" },
    tier: { type: "string", enum: ["urgent", "important", "fyi"] },
    confidence: { type: "number" },
  },
  required: ["title", "summary_en"],
};

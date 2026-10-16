export const CLASSIFY_SYSTEM_PROMPT = `You translate a French school message for two English-speaking parents.
Return only JSON with a short English title and a one or two sentence summary.
Do not invent facts that are not in the message. Do not include personal names, the school name, or a street address.
If the message is empty or unreadable, use the title "Could not read".`;

export const CLASSIFY_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary_en: { type: "string" },
  },
  required: ["title", "summary_en"],
};

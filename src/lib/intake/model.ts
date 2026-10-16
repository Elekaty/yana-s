import "server-only";

import { CLASSIFY_RESPONSE_SCHEMA, CLASSIFY_SYSTEM_PROMPT } from "@/lib/intake/prompt";

const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash"];

export async function summarizeSchoolNote(text: string, image?: { mime: string; bytes: Buffer }) {
  return askGemini(CLASSIFY_SYSTEM_PROMPT, CLASSIFY_RESPONSE_SCHEMA, text, image);
}

export async function askGemini(system: string, schema: unknown, text: string, image?: { mime: string; bytes: Buffer }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const parts: Record<string, unknown>[] = [{ text }];
  if (image) {
    parts.push({ inlineData: { mimeType: image.mime, data: image.bytes.toString("base64") } });
  }
  let lastError = "could not read";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2,
          },
        }),
      });
      if (response.status === 404) {
        lastError = `${model} is not available`;
        break;
      }
      if (!response.ok) {
        lastError = `Gemini returned ${response.status}`;
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }
        if (response.status === 429 || response.status >= 500) break;
        throw new Error(lastError);
      }
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").find((part) => part.trim().startsWith("{"));
      if (!raw) throw new Error("Gemini returned an empty reading");
      return JSON.parse(raw) as unknown;
    }
  }
  throw new Error(lastError);
}

import "server-only";

import { SCAN_RESPONSE_SCHEMA, SCAN_SYSTEM_PROMPT } from "@/lib/scan/prompt";

const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash"];

export async function readHomeworkPhoto(image: Buffer, instruction: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  let lastError = "could not read";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SCAN_SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                { text: instruction },
                { inlineData: { mimeType: "image/jpeg", data: image.toString("base64") } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCAN_RESPONSE_SCHEMA,
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
      const text = jsonText(payload.candidates?.[0]?.content?.parts ?? []);
      if (!text) throw new Error("Gemini returned an empty reading");
      return JSON.parse(stripFence(text)) as unknown;
    }
  }
  throw new Error(lastError);
}

function jsonText(parts: { text?: string }[]) {
  const texts = parts.map((part) => part.text ?? "").filter((text) => text.trim().length > 0);
  return texts.find((text) => stripFence(text).startsWith("{")) ?? texts.at(-1) ?? "";
}

function stripFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

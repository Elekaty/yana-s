import { z } from "zod";
import { contentHash, incomingHash } from "@/lib/intake/mail";

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Stay under the 4.5 MB Vercel request limit once the photo is inside JSON. */
export const USERBOT_PHOTO_LIMIT = 3_500_000;

const payloadSchema = z.object({
  chatId: z.union([z.string().trim().min(1), z.number()]),
  messageId: z.number().int(),
  senderName: z.string().max(120).optional().default(""),
  date: z.union([z.string(), z.number()]),
  text: z.string().nullable().optional(),
  photoBase64: z.string().nullable().optional(),
  mediaMimeType: z.string().nullable().optional(),
  inviteCode: z.string().trim().max(20).optional(),
});

export type UserbotPayload = z.infer<typeof payloadSchema>;

export function parseUserbotPayload(input: unknown): UserbotPayload | null {
  const parsed = payloadSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

export function userbotExternalId(chatId: string, messageId: number) {
  return `tg:${chatId}:${messageId}`;
}

export function decodeUserbotPhoto(photoBase64: string | null | undefined, mime: string | null | undefined) {
  if (!photoBase64?.trim()) return { bytes: null as Buffer | null, mime: "", name: "", hashPart: "", skipped: false };
  const cleaned = photoBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  const bytes = Buffer.from(cleaned, "base64");
  if (bytes.length === 0 || bytes.length > USERBOT_PHOTO_LIMIT) {
    return { bytes: null, mime: "", name: "", hashPart: "", skipped: true };
  }
  const type = IMAGE.has(mime ?? "") ? (mime as string) : "image/jpeg";
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return { bytes, mime: type, name: `photo.${ext}`, hashPart: contentHash([cleaned]), skipped: false };
}

export function userbotHash(text: string, photoKey: string, externalId: string) {
  return incomingHash(text, photoKey ? [photoKey] : [], externalId);
}

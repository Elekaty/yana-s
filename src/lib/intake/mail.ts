import { createHash } from "node:crypto";

export function contentHash(parts: string[]) {
  const normalized = parts.map((part) => part.trim().toLowerCase().replace(/\s+/g, " ")).join("\n");
  return createHash("sha256").update(normalized).digest("hex");
}

export function incomingHash(text: string, fileIds: string[], externalId: string) {
  if (!text.trim() && fileIds.length === 0) return contentHash([externalId]);
  return contentHash([text, ...fileIds]);
}

export function extractEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return (match?.[0] ?? value).trim().toLowerCase();
}

export function familyCodeFromAddress(to: string) {
  return extractEmail(to).split("@")[0] ?? "";
}

export function senderAllowed(from: string, allowed: string[]) {
  const email = extractEmail(from);
  return allowed.map((item) => item.toLowerCase()).includes(email);
}

export function parseLinkCode(text: string) {
  const match = text.trim().match(/^\/link(?:@\S+)?\s+([a-z0-9]{4,16})\b/i);
  return match?.[1]?.toLowerCase() ?? "";
}

export function afterClassifyError(attempts: number) {
  if (attempts >= 3) return { job: "failed" as const, read: "failed" as const };
  return { job: "queued" as const, read: "saved" as const };
}

export function extractPlainText(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const headerEnd = normalized.indexOf("\n\n");
  const body = headerEnd >= 0 ? normalized.slice(headerEnd + 2) : normalized;
  const parts = body.split(/\n--[^\n]+/);
  const chunks = parts.length > 1 ? parts : [body];
  for (const part of chunks) {
    if (parts.length > 1 && !/text\/plain/i.test(part)) continue;
    const splitAt = part.indexOf("\n\n");
    const headers = splitAt >= 0 ? part.slice(0, splitAt) : "";
    const content = splitAt >= 0 ? part.slice(splitAt + 2) : part;
    const decoded = /content-transfer-encoding:\s*base64/i.test(headers)
      ? decodeBase64(content)
      : /quoted-printable/i.test(headers)
        ? decodeQuoted(content)
        : content;
    const text = decoded.trim();
    if (text) return text.slice(0, 20_000);
  }
  return "";
}

function decodeQuoted(value: string) {
  return value
    .replace(/=\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function decodeBase64(value: string) {
  try {
    return Buffer.from(value.replace(/\s+/g, ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

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

export function decodeHeaderWords(value: string) {
  const decoded = value.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_match, charset: string, encoding: string, text: string) => {
    const bytes = encoding.toLowerCase() === "b" ? Buffer.from(text, "base64") : Buffer.from(quotedBytes(text.replace(/_/g, " ")));
    const label = String(charset).toLowerCase();
    if (label === "iso-8859-1" || label === "latin1" || label === "us-ascii") return bytes.toString("latin1");
    return bytes.toString("utf8");
  });
  return decoded.replace(/\s+/g, " ").trim();
}

export function extractPlainText(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const headerEnd = normalized.indexOf("\n\n");
  const top = headerEnd >= 0 ? normalized.slice(0, headerEnd) : "";
  const body = headerEnd >= 0 ? normalized.slice(headerEnd + 2) : normalized;
  const parts = body.split(/\n--[^\n]+/);
  if (parts.length === 1) return decodeBody(body, top).trim().slice(0, 20_000);
  for (const part of parts) {
    if (!/text\/plain/i.test(part)) continue;
    const splitAt = part.indexOf("\n\n");
    const headers = splitAt >= 0 ? part.slice(0, splitAt) : "";
    const content = splitAt >= 0 ? part.slice(splitAt + 2) : part;
    const text = decodeBody(content, /content-transfer-encoding/i.test(headers) ? headers : `${headers}\n${top}`).trim();
    if (text) return text.slice(0, 20_000);
  }
  return "";
}

function decodeBody(content: string, headers: string) {
  if (/content-transfer-encoding:\s*base64/i.test(headers)) return decodeBase64(content);
  if (/quoted-printable/i.test(headers)) return decodeQuoted(content);
  return content;
}

function decodeQuoted(value: string) {
  return Buffer.from(quotedBytes(value.replace(/=\n/g, ""))).toString("utf8");
}

function quotedBytes(value: string) {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 1) {
    const hex = value.slice(i + 1, i + 3);
    if (value[i] === "=" && /^[0-9A-F]{2}$/i.test(hex)) {
      bytes.push(Number.parseInt(hex, 16));
      i += 2;
      continue;
    }
    const code = value.charCodeAt(i);
    if (code < 128) bytes.push(code);
    else bytes.push(...Buffer.from(value[i] ?? "", "utf8"));
  }
  return bytes;
}

function decodeBase64(value: string) {
  try {
    return Buffer.from(value.replace(/\s+/g, ""), "base64").toString("utf8");
  } catch {
    return "";
  }
}

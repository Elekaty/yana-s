import { NextResponse } from "next/server";
import { familyIdForChat, familyIdForCode, linkTelegramChat, saveIncoming } from "@/lib/intake/save";
import { decodeUserbotPhoto, parseUserbotPayload, userbotExternalId, userbotHash } from "@/lib/intake/userbot";

export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.USERBOT_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-userbot-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = parseUserbotPayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ error: "bad payload" }, { status: 400 });

  const chatId = String(payload.chatId);
  let familyId = await familyIdForChat(chatId);
  if (!familyId && payload.inviteCode) {
    familyId = await familyIdForCode(payload.inviteCode);
    if (familyId) await linkTelegramChat(chatId, familyId, "Class group");
  }
  if (!familyId) return NextResponse.json({ success: true, ignored: true });

  const photo = decodeUserbotPhoto(payload.photoBase64, payload.mediaMimeType);
  const text = (payload.text ?? "").slice(0, 20_000);
  if (!text.trim() && !photo.bytes && !photo.skipped) return NextResponse.json({ success: true, ignored: true });

  const externalId = userbotExternalId(chatId, payload.messageId);
  const stored = await saveIncoming({
    familyId,
    source: "telegram",
    externalId,
    text,
    hash: userbotHash(text, photo.hashPart, externalId),
    sender: payload.senderName || `telegram:${chatId}`,
    raw: {
      via: "userbot",
      chatId,
      messageId: payload.messageId,
      senderName: payload.senderName,
      date: payload.date,
      photoSkipped: photo.skipped,
    },
    files: photo.bytes ? [{ bytes: photo.bytes, mime: photo.mime, name: photo.name }] : [],
  });

  if (!stored.saved) return NextResponse.json({ success: true, duplicate: true, messageId: stored.messageId ?? null });
  return NextResponse.json({ success: true, messageId: stored.messageId });
}

import { NextResponse } from "next/server";
import { incomingHash, parseLinkCode } from "@/lib/intake/mail";
import {
  downloadTelegramFile,
  familyIdForChat,
  familyIdForCode,
  linkTelegramChat,
  replyTelegram,
  saveIncoming,
} from "@/lib/intake/save";
import { handleTelegramCallback } from "@/lib/calendar/due";
import { parseTelegramNote } from "@/lib/intake/telegram";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const update = await request.json().catch(() => null);
  if (await handleTelegramCallback(update)) return NextResponse.json({ ok: true });
  const note = parseTelegramNote(update);
  if (!note) return NextResponse.json({ ok: true });

  const code = parseLinkCode(note.text);
  if (code) {
    const familyId = await familyIdForCode(code);
    if (!familyId) {
      await replyTelegram(note.chatId, "That code does not match a family.");
      return NextResponse.json({ ok: true });
    }
    await linkTelegramChat(note.chatId, familyId, note.chatTitle);
    await replyTelegram(note.chatId, "This chat is linked. School messages sent here will be saved.");
    return NextResponse.json({ ok: true });
  }

  const familyId = await familyIdForChat(note.chatId);
  if (!familyId) return NextResponse.json({ ok: true, ignored: true });

  const files = [];
  for (const file of note.files) {
    try {
      const bytes = await downloadTelegramFile(file.fileId);
      files.push({ bytes, mime: file.mime, name: file.name });
    } catch {
      files.push({ bytes: Buffer.alloc(0), mime: file.mime, name: file.name });
    }
  }
  const stored = files.filter((file) => file.bytes.length > 0);
  const externalId = `tg:${note.chatId}:${note.messageId}`;
  await saveIncoming({
    familyId,
    source: "telegram",
    externalId,
    text: note.text,
    hash: incomingHash(note.text, note.files.map((file) => file.uniqueId), externalId),
    sender: `telegram:${note.chatId}`,
    raw: { chatId: note.chatId, messageId: note.messageId, files: note.files.map((file) => file.uniqueId) },
    files: stored,
  });
  return NextResponse.json({ ok: true });
}

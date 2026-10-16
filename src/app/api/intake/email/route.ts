import { NextResponse } from "next/server";
import { extractEmail, extractPlainText, familyCodeFromAddress, incomingHash, senderAllowed } from "@/lib/intake/mail";
import { allowedEmails, familyIdForCode, saveIncoming } from "@/lib/intake/save";

export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    from?: string;
    to?: string;
    subject?: string;
    messageId?: string;
    text?: string;
    raw?: string;
  } | null;
  if (!body?.from || !body.to) return NextResponse.json({ ok: true, ignored: true });

  const familyId = await familyIdForCode(familyCodeFromAddress(body.to));
  if (!familyId) return NextResponse.json({ ok: true, ignored: true });
  const allowed = await allowedEmails(familyId);
  if (!senderAllowed(body.from, allowed)) return NextResponse.json({ ok: true, ignored: "sender" });

  const text = [body.subject ?? "", body.text || (body.raw ? extractPlainText(body.raw) : "")].filter(Boolean).join("\n\n");
  const externalId = body.messageId?.trim() || incomingHash(text, [], `${body.from}:${body.to}:${body.subject ?? ""}`);
  await saveIncoming({
    familyId,
    source: "email",
    externalId,
    text,
    hash: incomingHash(text, [], externalId),
    raw: { from: extractEmail(body.from), to: extractEmail(body.to), subject: body.subject ?? "" },
    files: [],
  });
  return NextResponse.json({ ok: true });
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { digestKind, escalationTargets } from "@/lib/inbox/sort";

export async function runEscalations(now = new Date()) {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const { data: messages, error } = await admin
    .from("messages")
    .select("id, family_id, created_at")
    .eq("tier", "urgent")
    .eq("status", "new")
    .lte("created_at", since);
  if (error || !messages) return 0;

  let sent = 0;
  for (const message of messages) {
    const familyId = message.family_id as string;
    const [{ data: parents }, { data: acks }, { data: prior }] = await Promise.all([
      admin.from("members").select("id").eq("family_id", familyId).eq("role", "parent"),
      admin.from("message_acks").select("member_id").eq("message_id", message.id),
      admin.from("message_alerts").select("member_id").eq("message_id", message.id).eq("kind", "escalation"),
    ]);
    const ticked = new Set((acks ?? []).map((ack) => ack.member_id as string));
    const targets = escalationTargets({
      tier: "urgent",
      status: "new",
      createdAt: message.created_at as string,
      now: now.toISOString(),
      parents: (parents ?? []).map((parent) => ({ id: parent.id as string, ticked: ticked.has(parent.id as string) })),
      alreadySent: (prior ?? []).map((alert) => alert.member_id as string),
    });
    for (const memberId of targets) {
      const inserted = await admin.from("message_alerts").insert({
        family_id: familyId,
        message_id: message.id,
        member_id: memberId,
        kind: "escalation",
      });
      if (!inserted.error) sent += 1;
    }
    if (targets.length > 0) await nudgeTelegram(familyId);
  }
  await markDigests(now);
  return sent;
}

async function markDigests(now: Date) {
  const admin = createAdminClient();
  const { data: families } = await admin.from("families").select("id, timezone");
  for (const family of families ?? []) {
    const kind = digestKind(now, (family.timezone as string) || "Europe/Paris");
    if (!kind) continue;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: (family.timezone as string) || "Europe/Paris" }).format(now);
    await admin.from("digest_marks").insert({ family_id: family.id, kind, day });
  }
}

async function nudgeTelegram(familyId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const admin = createAdminClient();
  const { data: chats } = await admin.from("telegram_chats").select("chat_id").eq("family_id", familyId);
  for (const chat of chats ?? []) {
    if (String(chat.chat_id).startsWith("-")) continue;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat.chat_id,
        text: "An urgent school message is still waiting for a parent.",
      }),
    });
  }
}

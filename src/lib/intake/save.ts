import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { alertUrgentArrival } from "@/lib/inbox/escalate";
import { chooseTier, classifyByRules } from "@/lib/inbox/sort";
import { createAdminClient } from "@/lib/supabase/admin";

export type IncomingFile = {
  bytes: Buffer;
  mime: string;
  name: string;
};

export async function saveIncoming(input: {
  familyId: string;
  source: "telegram" | "email";
  externalId: string;
  text: string;
  hash: string;
  raw: unknown;
  files: IncomingFile[];
  sender?: string;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("family_id", input.familyId)
    .eq("content_hash", input.hash)
    .maybeSingle();
  if (existing) return { saved: false as const, messageId: existing.id as string };

  const choice = chooseTier(classifyByRules(input.text));
  const { data: message, error } = await admin
    .from("messages")
    .insert({
      family_id: input.familyId,
      source: input.source,
      external_id: input.externalId,
      original_text: input.text,
      content_hash: input.hash,
      raw: input.raw,
      sender: input.sender ?? null,
      read_status: "saved",
      status: "new",
      tier: choice.tier,
      confidence: choice.confidence,
      please_check: choice.pleaseCheck,
      action_required: choice.actionRequired,
    })
    .select("id")
    .single();
  if (error?.code === "23505" || !message) return { saved: false as const, messageId: undefined };

  for (const file of input.files) {
    const path = `${input.familyId}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const uploaded = await admin.storage.from("attachments").upload(path, file.bytes, { contentType: file.mime, upsert: false });
    if (uploaded.error) continue;
    await admin.from("attachments").insert({
      family_id: input.familyId,
      message_id: message.id,
      path,
      mime: file.mime,
    });
  }

  const { error: jobError } = await admin.from("jobs").insert({
    family_id: input.familyId,
    kind: "classify",
    payload: { message_id: message.id, include_image: false },
    status: "queued",
  });
  if (jobError) throw new Error("Could not queue the reading");
  if (choice.tier === "urgent") {
    const line = input.text.trim().split("\n").find((row) => row.trim()) ?? "An urgent school message just arrived.";
    await alertUrgentArrival(input.familyId, message.id as string, line.slice(0, 140)).catch(() => 0);
  }
  return { saved: true as const, messageId: message.id as string };
}

export async function requeueClassify(familyId: string, messageId: string, includeImage: boolean) {
  const admin = createAdminClient();
  const { data: message } = await admin.from("messages").select("id").eq("id", messageId).eq("family_id", familyId).maybeSingle();
  if (!message) return;
  await admin.from("messages").update({ read_status: "saved" }).eq("id", messageId);
  await admin.from("jobs").insert({
    family_id: familyId,
    kind: "classify",
    payload: { message_id: messageId, include_image: includeImage },
    status: "queued",
  });
}

export async function familyIdForCode(code: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("families").select("id").eq("invite_code", code.toLowerCase()).maybeSingle();
  return (data?.id as string | undefined) ?? "";
}

export async function linkTelegramChat(chatId: string, familyId: string, title: string) {
  const admin = createAdminClient();
  await admin.from("telegram_chats").upsert({ chat_id: chatId, family_id: familyId, title, linked_at: new Date().toISOString() });
}

export async function familyIdForChat(chatId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("telegram_chats").select("family_id").eq("chat_id", chatId).maybeSingle();
  return (data?.family_id as string | undefined) ?? "";
}

export async function allowedEmails(familyId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("allowed_senders").select("email").eq("family_id", familyId);
  return (data ?? []).map((row) => row.email as string);
}

export async function downloadTelegramFile(fileId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram is not configured");
  const meta = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  if (!meta.ok) throw new Error("Could not fetch the Telegram file");
  const payload = (await meta.json()) as { result?: { file_path?: string; file_size?: number } };
  const filePath = payload.result?.file_path;
  if (!filePath || (payload.result?.file_size ?? 0) > 8_000_000) throw new Error("That file is too large");
  const file = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!file.ok) throw new Error("Could not download the Telegram file");
  return Buffer.from(await file.arrayBuffer());
}

export async function replyTelegram(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export type AdminClient = SupabaseClient;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40) || "file";
}

import "server-only";

import { applySnooze, parseReminderAction, shouldNotifyOther } from "@/lib/calendar/plan";
import { customSnoozeReply, reminderButtons } from "@/lib/notify/copy";
import { createAdminClient } from "@/lib/supabase/admin";

export async function runDueReminders(now = new Date()) {
  const admin = createAdminClient();
  const { data: due, error } = await admin
    .from("reminders")
    .select("id, family_id, target, status, due_at, snooze_count, escalated, ref_type, ref_id")
    .in("status", ["pending", "snoozed"])
    .lte("due_at", now.toISOString())
    .limit(20);
  if (error || !due) return 0;

  let sent = 0;
  for (const reminder of due) {
    const title = await reminderTitle(reminder.ref_type as string | null, reminder.ref_id as string | null);
    await admin.from("reminders").update({ status: "sent" }).eq("id", reminder.id).in("status", ["pending", "snoozed"]);
    if (reminder.target === "parent") {
      await notifyParents(reminder.family_id as string, title, reminder.id as string);
    }
    sent += 1;
  }

  const { data: waiting } = await admin
    .from("reminders")
    .select("id, family_id, target, status, due_at, escalated")
    .eq("status", "sent")
    .eq("escalated", false)
    .eq("target", "parent")
    .lte("due_at", new Date(now.getTime() - 20 * 60 * 1000).toISOString())
    .limit(20);
  for (const reminder of waiting ?? []) {
    const ready = shouldNotifyOther(
      {
        status: reminder.status as string,
        dueAt: reminder.due_at as string,
        escalated: Boolean(reminder.escalated),
        target: reminder.target as string,
      },
      now,
    );
    if (!ready) continue;
    await admin.from("reminders").update({ escalated: true }).eq("id", reminder.id);
    await notifyParents(reminder.family_id as string, "A reminder is still waiting.", reminder.id as string);
  }
  return sent;
}

export async function applyReminderAction(id: string, action: "done" | "30" | "45" | "60" | number, timeZone = "Europe/Paris") {
  const admin = createAdminClient();
  const { data: reminder } = await admin.from("reminders").select("id, due_at, snooze_count, status").eq("id", id).maybeSingle();
  if (!reminder || reminder.status === "done") return false;
  if (action === "done") {
    await admin.from("reminders").update({ status: "done", note: null }).eq("id", id);
    return true;
  }
  const minutes = typeof action === "number" ? action : Number(action);
  const next = applySnooze({
    dueAt: new Date(reminder.due_at as string),
    snoozeCount: Number(reminder.snooze_count ?? 0),
    minutes,
    timeZone,
  });
  await admin.from("reminders").update({
    due_at: next.dueAt.toISOString(),
    snooze_count: next.snoozeCount,
    note: next.note,
    status: next.status,
    escalated: false,
  }).eq("id", id);
  return true;
}

export async function handleTelegramCallback(update: unknown) {
  const query = (update as { callback_query?: { id?: string; data?: string; message?: { chat?: { id?: number } } } } | null)?.callback_query;
  if (!query?.id || !query.data) return false;
  const parsed = parseReminderAction(query.data);
  if (!parsed) {
    await answerCallback(query.id, customSnoozeReply());
    return true;
  }
  const admin = createAdminClient();
  const chatId = query.message?.chat?.id;
  const { data: reminder } = await admin.from("reminders").select("id, family_id").eq("id", parsed.id).maybeSingle();
  if (!reminder) {
    await answerCallback(query.id, "That reminder is already finished.");
    return true;
  }
  if (chatId !== undefined) {
    const { data: chat } = await admin.from("telegram_chats").select("family_id").eq("chat_id", String(chatId)).maybeSingle();
    if (!chat || chat.family_id !== reminder.family_id) {
      await answerCallback(query.id, "This chat is not linked to that reminder.");
      return true;
    }
  }
  await applyReminderAction(parsed.id, parsed.action);
  await answerCallback(query.id, parsed.action === "done" ? "Marked done." : "Snoozed.");
  return true;
}

async function reminderTitle(refType: string | null, refId: string | null) {
  if (!refId) return "Reminder";
  const admin = createAdminClient();
  if (refType === "event") {
    const { data } = await admin.from("events").select("title").eq("id", refId).maybeSingle();
    return (data?.title as string) || "Reminder";
  }
  if (refType === "roster") return "Time to add next month's roster.";
  if (refType === "message") {
    const { data } = await admin.from("messages").select("title").eq("id", refId).maybeSingle();
    return (data?.title as string) || "Reminder";
  }
  return "Reminder";
}

export async function notifyParents(familyId: string, text: string, reminderId?: string) {
  await sendTelegram(familyId, text, reminderId);
  await sendPush(familyId, text);
}

async function sendTelegram(familyId: string, text: string, reminderId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const admin = createAdminClient();
  const { data: chats } = await admin.from("telegram_chats").select("chat_id").eq("family_id", familyId);
  const buttons = reminderId ? reminderButtons(reminderId) : [];
  for (const chat of chats ?? []) {
    if (String(chat.chat_id).startsWith("-")) continue;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat.chat_id,
        text,
        reply_markup: buttons.length
          ? { inline_keyboard: [buttons.map((button) => ({ text: button.text, callback_data: button.data }))] }
          : undefined,
      }),
    });
  }
}

async function sendPush(familyId: string, title: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  const admin = createAdminClient();
  const { data } = await admin.from("push_subscriptions").select("endpoint, keys").eq("family_id", familyId);
  if (!data || data.length === 0) return;
  const webpush = await import("web-push");
  webpush.setVapidDetails("mailto:parents@signin.yana-s.app", publicKey, privateKey);
  for (const row of data) {
    const keys = row.keys as { p256dh?: string; auth?: string } | null;
    if (!row.endpoint || !keys?.p256dh || !keys.auth) continue;
    try {
      await webpush.sendNotification({ endpoint: String(row.endpoint), keys: { p256dh: keys.p256dh, auth: keys.auth } }, title);
    } catch {
      // A phone that unsubscribed stays quiet until it subscribes again.
    }
  }
}

async function answerCallback(callbackId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
}

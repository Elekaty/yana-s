"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BREAK_PRACTICE,
  atLocalTime,
  defaultOffsets,
  offsetsForChoice,
  parseLocalDateTime,
  reminderInstants,
  titledEvent,
  type Holiday,
  weekdayDates,
} from "@/lib/calendar/plan";
import { noticeHoliday } from "@/lib/parent/today";
import { extractEventDate } from "@/lib/calendar/extract";
import { applyReminderAction } from "@/lib/calendar/due";
import { getFamily } from "@/lib/family";
import { redactForModel } from "@/lib/scan/redact";

export async function addToCalendar(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  const { data: message } = await ctx.supabase
    .from("messages")
    .select("id, title, summary_en, original_text")
    .eq("id", messageId)
    .eq("family_id", ctx.familyId)
    .maybeSingle();
  if (!message) return;
  const names = await familyNames(ctx);
  const text = redactForModel(`${message.summary_en ?? ""}\n${message.original_text ?? ""}`, names);
  let title = message.title || "School event";
  let starts = "";
  try {
    const extracted = await extractEventDate(text || title);
    title = extracted.title || title;
    starts = extracted.startsAt;
  } catch {
    starts = "";
  }
  const params = new URLSearchParams({ message: messageId, title, starts });
  redirect(`/parent/calendar/confirm?${params.toString()}`);
}

export async function saveEvent(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const when = parseLocalDateTime(String(formData.get("when") ?? ""), ctx.timeZone);
  const messageId = String(formData.get("messageId") ?? "");
  const type = String(formData.get("type") ?? (messageId ? "school" : "family"));
  if (!title || !when) return;
  const offsets = offsetsForChoice(String(formData.get("reminder") ?? ""), when, new Date(), ctx.timeZone);
  const { data: event, error } = await ctx.supabase
    .from("events")
    .insert({
      family_id: ctx.familyId,
      title: titledEvent(title, type),
      starts_at: when.toISOString(),
      source_message_id: messageId || null,
      remind_offsets: offsets,
    })
    .select("id")
    .single();
  if (error || !event) return;
  const instants = reminderInstants(when, offsets, new Date());
  if (instants.length > 0) {
    await ctx.supabase.from("reminders").insert(
      instants.map((due) => ({
        family_id: ctx.familyId,
        target: "parent",
        member_id: ctx.memberId,
        ref_type: "event",
        ref_id: event.id,
        due_at: due.toISOString(),
        status: "pending",
      })),
    );
  }
  revalidatePath("/parent/calendar");
  redirect("/parent/calendar");
}

export async function removeEvent(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;
  await ctx.supabase.from("reminders").delete().eq("family_id", ctx.familyId).eq("ref_type", "event").eq("ref_id", id);
  await ctx.supabase.from("events").delete().eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent");
  revalidatePath("/parent/calendar");
}

export async function savePushSubscription(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const endpoint = String(formData.get("endpoint") ?? "");
  const p256dh = String(formData.get("p256dh") ?? "");
  const auth = String(formData.get("auth") ?? "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) return;
  await ctx.supabase.from("push_subscriptions").delete().eq("member_id", ctx.memberId).eq("endpoint", endpoint);
  await ctx.supabase.from("push_subscriptions").insert({
    family_id: ctx.familyId,
    member_id: ctx.memberId,
    endpoint,
    keys: { p256dh, auth },
  });
  revalidatePath("/parent/calendar");
}

export async function addTask(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  const { data: message } = await ctx.supabase.from("messages").select("title, summary_en").eq("id", messageId).maybeSingle();
  if (!message) return;
  await ctx.supabase.from("tasks").insert({
    family_id: ctx.familyId,
    message_id: messageId,
    title: message.title || "To do",
    parent_action: message.summary_en,
    status: "pending",
  });
  revalidatePath("/parent");
  revalidatePath("/parent/todo");
  revalidatePath("/parent/inbox");
}

export async function completeTask(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  await ctx.supabase.from("tasks").update({ status: "completed" }).eq("id", taskId).eq("family_id", ctx.familyId);
  revalidatePath("/parent/todo");
}

export async function remindParent(formData: FormData) {
  await remind(formData, "parent");
}

export async function remindChild(formData: FormData) {
  await remind(formData, "child");
}

export async function snoozeReminder(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("reminderId") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;
  const { data: own } = await ctx.supabase.from("reminders").select("id").eq("id", id).eq("family_id", ctx.familyId).maybeSingle();
  if (!own) return;
  if (action === "done") await applyReminderAction(id, "done", ctx.timeZone);
  else if (action === "30" || action === "45" || action === "60") await applyReminderAction(id, action, ctx.timeZone);
  else {
    const minutes = Number(formData.get("minutes"));
    if (minutes >= 1 && minutes <= 24 * 60) await applyReminderAction(id, minutes, ctx.timeZone);
  }
  revalidatePath("/parent/calendar");
}

export async function saveZone(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const zone = String(formData.get("zone") ?? "A");
  if (!["A", "B", "C"].includes(zone)) return;
  const { data } = await ctx.supabase.from("families").select("settings").eq("id", ctx.familyId).single();
  const settings = { ...((data?.settings as Record<string, unknown> | null) ?? {}), school_zone: zone };
  await ctx.supabase.from("families").update({ settings }).eq("id", ctx.familyId);
  revalidatePath("/parent/calendar");
}

export async function saveHoliday(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const starts = String(formData.get("starts") ?? "");
  const ends = String(formData.get("ends") ?? "");
  const zone = String(formData.get("zone") ?? "");
  if (!label || !/^\d{4}-\d{2}-\d{2}$/.test(starts) || !/^\d{4}-\d{2}-\d{2}$/.test(ends) || ends < starts) return;
  await ctx.supabase.from("school_calendar").delete().eq("family_id", ctx.familyId).eq("label", label);
  await ctx.supabase.from("school_calendar").insert({
    family_id: ctx.familyId,
    kind: "holiday",
    starts_on: starts,
    ends_on: ends,
    label,
    source: "parent",
    zone: zone || null,
  });
  revalidatePath("/parent/calendar");
}

export async function createBreakPlan() {
  const ctx = await parentContext();
  if (!ctx) return;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: ctx.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data: rows } = await ctx.supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind");
  const holiday = noticeHoliday(today, (rows ?? []) as Holiday[], ctx.zone);
  if (!holiday) return;
  const days = weekdayDates(today > holiday.starts_on ? today : holiday.starts_on, holiday.ends_on);
  for (let index = 0; index < days.length; index += 1) {
    const title = `Break: ${BREAK_PRACTICE[index % BREAK_PRACTICE.length]}`;
    const starts = atLocalTime(days[index], 10, 0, ctx.timeZone);
    const { data: existing } = await ctx.supabase.from("events").select("id").eq("family_id", ctx.familyId).eq("title", title).gte("starts_at", `${days[index]}T00:00:00Z`).limit(1);
    if ((existing ?? []).length > 0) continue;
    const offsets = defaultOffsets(starts, new Date(), ctx.timeZone);
    const { data: event } = await ctx.supabase
      .from("events")
      .insert({ family_id: ctx.familyId, title, starts_at: starts.toISOString(), remind_offsets: offsets })
      .select("id")
      .single();
    if (!event) continue;
    const instants = reminderInstants(starts, offsets, new Date());
    if (instants.length === 0) continue;
    await ctx.supabase.from("reminders").insert(
      instants.map((due) => ({
        family_id: ctx.familyId,
        target: "parent",
        member_id: ctx.memberId,
        ref_type: "event",
        ref_id: event.id,
        due_at: due.toISOString(),
        status: "pending",
      })),
    );
  }
  revalidatePath("/parent");
  revalidatePath("/parent/calendar");
  revalidatePath("/parent/curriculum");
}

async function remind(formData: FormData, target: "parent" | "child") {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  const when = parseLocalDateTime(String(formData.get("when") ?? ""), ctx.timeZone);
  if (!messageId || !when) return;
  await ctx.supabase.from("reminders").insert({
    family_id: ctx.familyId,
    target,
    member_id: target === "parent" ? ctx.memberId : null,
    child_id: target === "child" ? ctx.childId : null,
    ref_type: "message",
    ref_id: messageId,
    due_at: when.toISOString(),
    status: "pending",
  });
  revalidatePath("/parent/calendar");
  revalidatePath("/kid/home");
}

async function parentContext() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") return null;
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
  if (!member) return null;
  const { data: row } = await supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle();
  const settings = (row?.settings as { school_zone?: string } | null) ?? {};
  const zone = settings.school_zone === "B" || settings.school_zone === "C" ? settings.school_zone : "A";
  return { supabase, familyId: family.family_id, memberId: member.id as string, childId: family.child_id, timeZone: family.timezone || "Europe/Paris", zone };
}

async function familyNames(ctx: { supabase: Awaited<ReturnType<typeof getFamily>>["supabase"]; familyId: string }) {
  const [{ data: children }, { data: members }] = await Promise.all([
    ctx.supabase.from("children").select("name").eq("family_id", ctx.familyId),
    ctx.supabase.from("members").select("display_name").eq("family_id", ctx.familyId),
  ]);
  return [...(children ?? []).map((row) => String(row.name ?? "")), ...(members ?? []).map((row) => String(row.display_name ?? ""))];
}

"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";

export async function snoozeTonight(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const minutes = snoozeMinutes(formData);
  if (!minutes) return;
  await ctx.supabase.from("reminders").insert({
    family_id: ctx.familyId,
    target: "parent",
    member_id: ctx.memberId,
    ref_type: "tonight",
    due_at: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    status: "pending",
  });
  revalidatePath("/parent");
  revalidatePath("/parent/calendar");
}

export async function doneTonight() {
  const ctx = await parentContext();
  if (!ctx?.childId) return;
  const { data: existing } = await ctx.supabase.from("sessions").select("id").eq("family_id", ctx.familyId).eq("date", ctx.today).eq("status", "done").limit(1);
  if ((existing ?? []).length === 0) {
    await ctx.supabase.from("sessions").insert({
      family_id: ctx.familyId,
      child_id: ctx.childId,
      date: ctx.today,
      leader_member_id: ctx.memberId,
      duration_min: 10,
      status: "done",
    });
  }
  revalidatePath("/parent");
}

export async function remindSoon(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  const minutes = snoozeMinutes(formData);
  if (!messageId || !minutes) return;
  await ctx.supabase.from("reminders").insert({
    family_id: ctx.familyId,
    target: "parent",
    member_id: ctx.memberId,
    ref_type: "message",
    ref_id: messageId,
    due_at: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    status: "pending",
  });
  revalidatePath("/parent");
  revalidatePath("/parent/calendar");
}

function snoozeMinutes(formData: FormData) {
  const minutes = Math.floor(Number(formData.get("minutes")));
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) return 0;
  return minutes;
}

async function parentContext() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") return null;
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
  if (!member) return null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: family.timezone || "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { supabase, familyId: family.family_id, memberId: member.id as string, childId: family.child_id, today };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atLocalTime } from "@/lib/calendar/plan";
import { getFamily } from "@/lib/family";
import { processNextRoster, rosterMime, saveRosterFile } from "@/lib/plan/roster";
import type { Duty } from "@/lib/plan/tonight";

const DUTIES = new Set(["off", "flying", "standby", "layover"]);

export async function uploadRoster(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const memberId = String(formData.get("memberId") ?? "");
  const file = formData.get("file");
  if (!memberId || !(file instanceof File) || file.size < 1 || file.size > 4_000_000) {
    redirect("/parent/setup?roster=large");
  }
  const mime = rosterMime(file.name, file.type);
  if (!mime) redirect("/parent/setup?roster=type");
  await saveRosterFile(ctx.familyId, memberId, { name: file.name, bytes: Buffer.from(await file.arrayBuffer()), mime });
  revalidatePath("/parent/setup");
  redirect("/parent/setup?roster=saved");
}

export async function readRoster() {
  const ctx = await parentContext();
  if (!ctx) return;
  const result = await processNextRoster(ctx.familyId);
  revalidatePath("/parent/setup");
  redirect(result.failed ? "/parent/setup?roster=failed" : "/parent/setup?roster=read");
}

export async function addRosterDay(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const memberId = String(formData.get("memberId") ?? "");
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!memberId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !DUTIES.has(status)) return;
  const { data: parent } = await ctx.supabase.from("members").select("id").eq("id", memberId).eq("role", "parent").maybeSingle();
  if (!parent) return;
  await ctx.supabase.from("roster_drafts").upsert(
    { family_id: ctx.familyId, member_id: memberId, date, status },
    { onConflict: "family_id,member_id,date" },
  );
  revalidatePath("/parent/setup");
}

export async function updateDraft(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !DUTIES.has(status)) return;
  await ctx.supabase.from("roster_drafts").update({ status }).eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent/setup");
}

export async function confirmRoster(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;
  const { data: drafts } = await ctx.supabase.from("roster_drafts").select("date, status").eq("member_id", memberId).eq("family_id", ctx.familyId);
  let saved = true;
  for (const draft of drafts ?? []) {
    const status = draft.status as Duty;
    const { error } = await ctx.supabase.from("roster_days").upsert(
      { family_id: ctx.familyId, member_id: memberId, date: draft.date, status },
      { onConflict: "family_id,member_id,date" },
    );
    if (error) saved = false;
    else if (status === "flying" || status === "layover") {
      const title = status === "flying" ? "Flying" : "Layover";
      const starts = atLocalTime(String(draft.date), 8, 0, ctx.timeZone);
      const { data: existing } = await ctx.supabase.from("events").select("id").eq("family_id", ctx.familyId).eq("title", title).eq("starts_at", starts.toISOString()).limit(1);
      if ((existing ?? []).length === 0) {
        await ctx.supabase.from("events").insert({
          family_id: ctx.familyId,
          title,
          starts_at: starts.toISOString(),
          remind_offsets: [],
        });
      }
    }
  }
  if (saved) await ctx.supabase.from("roster_drafts").delete().eq("family_id", ctx.familyId).eq("member_id", memberId);
  revalidatePath("/parent/setup");
  revalidatePath("/parent/calendar");
  revalidatePath("/parent");
}

export async function saveAvailability(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const memberId = String(formData.get("memberId") ?? "");
  const weekday = Number(formData.get("weekday"));
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!memberId || weekday < 0 || weekday > 6 || !/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || to <= from) return;
  await ctx.supabase.from("availability").upsert(
    { family_id: ctx.familyId, member_id: memberId, weekday, from_time: from, to_time: to },
    { onConflict: "member_id,weekday" },
  );
  revalidatePath("/parent");
  revalidatePath("/parent/setup");
}

export async function saveEvening(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const cap = Number(formData.get("cap"));
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const mom = String(formData.get("mom") ?? "");
  const dad = String(formData.get("dad") ?? "");
  if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || cap < 5 || cap > 60) return;
  const { data } = await ctx.supabase.from("families").select("settings").eq("id", ctx.familyId).single();
  const settings = {
    ...((data?.settings as Record<string, unknown> | null) ?? {}),
    mom_member_id: mom,
    dad_member_id: dad,
    daily_cap_minutes: cap,
    evening_from: from,
    evening_to: to,
  };
  await ctx.supabase.from("families").update({ settings }).eq("id", ctx.familyId);
  revalidatePath("/parent");
  revalidatePath("/parent/setup");
}

export async function swapTonight(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const leaderId = String(formData.get("leaderId") ?? "");
  if (!leaderId) return;
  const { data } = await ctx.supabase.from("families").select("settings").eq("id", ctx.familyId).single();
  const settings = {
    ...((data?.settings as Record<string, unknown> | null) ?? {}),
    tonight_prefer: leaderId,
    tonight_prefer_date: ctx.today,
  };
  await ctx.supabase.from("families").update({ settings }).eq("id", ctx.familyId);
  revalidatePath("/parent");
}

async function parentContext() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") return null;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: family.timezone || "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return { supabase, familyId: family.family_id, timeZone: family.timezone || "Europe/Paris", today };
}

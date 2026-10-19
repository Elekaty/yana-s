"use server";

import { revalidatePath } from "next/cache";
import { PLAN } from "@/lib/plan/outline";
import { getFamily } from "@/lib/family";

export async function savePlanItem(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const itemKey = clean(formData.get("itemKey"), 80);
  const month = clean(formData.get("month"), 7);
  const subject = clean(formData.get("subject"), 40);
  const text = clean(formData.get("text"), 240);
  const period = Number(formData.get("period"));
  if (!itemKey || !/^\d{4}-\d{2}$/.test(month) || !subject || !text) return;
  await upsertFamilyItem(ctx, {
    item_key: itemKey,
    month,
    period: Number.isInteger(period) && period >= 1 && period <= 5 ? period : 1,
    subject,
    text,
    done: formData.get("done") === "true",
    hidden: false,
  });
}

export async function tickPlanItem(formData: FormData) {
  formData.set("done", formData.get("done") === "true" ? "false" : "true");
  await savePlanItem(formData);
}

export async function hidePlanItem(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const itemKey = clean(formData.get("itemKey"), 80);
  const shared = PLAN.find((item) => item.item_key === itemKey);
  const month = clean(formData.get("month"), 7) || shared?.month || "";
  if (!itemKey || !/^\d{4}-\d{2}$/.test(month)) return;
  await upsertFamilyItem(ctx, {
    item_key: itemKey,
    month,
    period: shared?.period ?? 1,
    subject: clean(formData.get("subject"), 40) || shared?.subject || "Plan",
    text: clean(formData.get("text"), 240) || shared?.text || "Hidden",
    done: false,
    hidden: true,
  });
}

export async function addQuickTask(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const title = clean(formData.get("title"), 140);
  if (!title) return;
  const due = clean(formData.get("due"), 10);
  await ctx.supabase.from("tasks").insert({
    family_id: ctx.familyId,
    title,
    status: "pending",
    due_at: /^\d{4}-\d{2}-\d{2}$/.test(due) ? `${due}T18:00:00.000Z` : null,
    assignee_member_id: ctx.memberId,
  });
  revalidatePath("/parent/todo");
}

export async function snoozeTask(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("taskId") ?? "");
  const minutes = Math.floor(Number(formData.get("minutes")));
  if (!id || !Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) return;
  await ctx.supabase.from("tasks").update({ due_at: new Date(Date.now() + minutes * 60 * 1000).toISOString() }).eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent/todo");
}

export async function reassignTask(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("taskId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!id || !memberId) return;
  const { data: parent } = await ctx.supabase.from("members").select("id").eq("id", memberId).eq("role", "parent").maybeSingle();
  if (!parent) return;
  await ctx.supabase.from("tasks").update({ assignee_member_id: memberId }).eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent/todo");
}

export async function addPlanItem(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const subject = clean(formData.get("subject"), 40);
  const text = clean(formData.get("text"), 240);
  const month = clean(formData.get("month"), 7);
  if (!subject || !text || !/^\d{4}-\d{2}$/.test(month)) return;
  await ctx.supabase.from("plan_items").insert({
    family_id: ctx.familyId,
    item_key: `parent-${crypto.randomUUID()}`,
    month,
    period: 1,
    subject,
    text,
    source: "parent",
    done: false,
    hidden: false,
  });
  revalidatePath("/parent/todo");
  revalidatePath("/parent/curriculum");
  revalidatePath("/parent");
}

async function upsertFamilyItem(
  ctx: NonNullable<Awaited<ReturnType<typeof parentContext>>>,
  item: { item_key: string; month: string; period: number; subject: string; text: string; done: boolean; hidden: boolean },
) {
  const { data: existing } = await ctx.supabase
    .from("plan_items")
    .select("id")
    .eq("family_id", ctx.familyId)
    .eq("item_key", item.item_key)
    .maybeSingle();
  const row = { ...item, source: "parent", family_id: ctx.familyId };
  if (existing) await ctx.supabase.from("plan_items").update(row).eq("id", existing.id).eq("family_id", ctx.familyId);
  else await ctx.supabase.from("plan_items").insert(row);
  revalidatePath("/parent/todo");
  revalidatePath("/parent/curriculum");
  revalidatePath("/parent");
}

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

async function parentContext() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") return null;
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
  return { supabase, familyId: family.family_id, memberId: (member?.id as string | undefined) ?? null };
}

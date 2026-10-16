"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";
import { requeueClassify } from "@/lib/intake/save";
import { canUndo } from "@/lib/inbox/sort";

const tiers = new Set(["urgent", "important", "fyi"]);

export async function retryReading(formData: FormData) {
  const { family } = await getFamily();
  if (!family || family.my_role !== "parent") return;
  const messageId = String(formData.get("messageId") ?? "");
  const includeImage = formData.get("includeImage") === "yes";
  if (!messageId) return;
  await requeueClassify(family.family_id, messageId, includeImage);
  revalidatePath("/parent/inbox");
}

export async function tickMessage(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  if (!messageId) return;
  await ctx.supabase.from("message_acks").insert({ message_id: messageId, member_id: ctx.memberId, family_id: ctx.familyId });
  revalidatePath("/parent/inbox");
}

export async function untickMessage(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  if (!messageId) return;
  const [{ data: acks }, { data: parents }] = await Promise.all([
    ctx.supabase.from("message_acks").select("member_id").eq("message_id", messageId),
    ctx.supabase.from("members").select("id").eq("role", "parent"),
  ]);
  const parentIds = new Set((parents ?? []).map((parent) => parent.id as string));
  const mine = (acks ?? []).some((ack) => ack.member_id === ctx.memberId);
  const other = (acks ?? []).some((ack) => ack.member_id !== ctx.memberId && parentIds.has(ack.member_id as string));
  if (!canUndo(mine, other)) return;
  await ctx.supabase.from("message_acks").delete().eq("message_id", messageId).eq("member_id", ctx.memberId);
  revalidatePath("/parent/inbox");
}

export async function archiveMessage(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  if (!messageId) return;
  await ctx.supabase.rpc("archive_message", { p_msg: messageId });
  revalidatePath("/parent/inbox");
}

export async function restoreMessage(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  if (!messageId) return;
  await ctx.supabase.rpc("restore_message", { p_msg: messageId });
  revalidatePath("/parent/inbox");
}

export async function setTier(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const messageId = String(formData.get("messageId") ?? "");
  const tier = String(formData.get("tier") ?? "");
  if (!messageId || !tiers.has(tier)) return;
  await ctx.supabase.from("messages").update({ tier, please_check: false }).eq("id", messageId).eq("family_id", ctx.familyId);
  revalidatePath("/parent/inbox");
}

export async function setSenderRule(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const sender = String(formData.get("sender") ?? "");
  const tier = String(formData.get("tier") ?? "");
  if (!sender || !tiers.has(tier)) return;
  await ctx.supabase.from("sender_rules").upsert({ family_id: ctx.familyId, sender, tier }, { onConflict: "family_id,sender" });
  revalidatePath("/parent/inbox");
}

async function parentContext() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") return null;
  const { data: member } = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
  if (!member) return null;
  return { supabase, familyId: family.family_id, memberId: member.id as string };
}

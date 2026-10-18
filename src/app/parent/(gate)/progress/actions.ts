"use server";

import { revalidatePath } from "next/cache";
import { SKILLS, nextLevel } from "@/lib/plan/outline";
import { getFamily } from "@/lib/family";

const reactions = new Set(["👍", "❤️", "🌟"]);

export async function reactToVoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reaction = String(formData.get("reaction") ?? "");
  if (!reactions.has(reaction)) return;
  const { supabase, family } = await getFamily();
  if (!family) return;
  await supabase.from("voice_recordings").update({ parent_reaction: reaction }).eq("id", id).eq("family_id", family.family_id);
  revalidatePath("/parent/progress");
  revalidatePath("/kid/games/voice/album");
}

export async function addReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const cost = Math.floor(Number(formData.get("cost")));
  if (!title || !Number.isInteger(cost) || cost < 1 || cost > 100) return;
  await ctx.supabase.from("rewards").insert({ family_id: ctx.familyId, title, cost_stars: cost, active: true });
  revalidatePath("/parent/progress");
  revalidatePath("/kid/store");
}

export async function hideReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("id") ?? "");
  await ctx.supabase.from("rewards").update({ active: false }).eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent/progress");
  revalidatePath("/kid/store");
}

export async function approveReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  await ctx.supabase.rpc("approve_purchase", { p_purchase: String(formData.get("id") ?? "") });
  revalidatePath("/parent/progress");
  revalidatePath("/kid/store");
}

export async function denyReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  await ctx.supabase
    .from("purchases")
    .update({ status: "denied" })
    .eq("id", String(formData.get("id") ?? ""))
    .eq("family_id", ctx.familyId)
    .eq("status", "requested");
  revalidatePath("/parent/progress");
  revalidatePath("/kid/store");
}

export async function raiseSkill(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx?.childId) return;
  const key = String(formData.get("key") ?? "");
  const chosen = Number(formData.get("level"));
  if (!SKILLS.some((skill) => skill.skill_key === key) || (chosen !== 1 && chosen !== 3)) return;
  const { data } = await ctx.supabase.from("skill_progress").select("correct, attempts, level").eq("child_id", ctx.childId).eq("skill", key).maybeSingle();
  await ctx.supabase.from("skill_progress").upsert(
    {
      family_id: ctx.familyId,
      child_id: ctx.childId,
      skill: key,
      correct: Number(data?.correct ?? 0),
      attempts: Number(data?.attempts ?? 0),
      level: nextLevel(Number(data?.level ?? 0), chosen),
    },
    { onConflict: "child_id,skill" },
  );
  revalidatePath("/parent/progress");
  revalidatePath("/parent/curriculum");
}

async function parentContext() {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent") return null;
  return { supabase, familyId: family.family_id, childId: family.child_id };
}

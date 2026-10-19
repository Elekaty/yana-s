"use server";

import { revalidatePath } from "next/cache";
import { growGarden } from "@/lib/garden/grow";
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
  revalidatePath("/parent");
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
  revalidatePath("/parent/rewards");
  revalidatePath("/kid/store");
}

export async function hideReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const id = String(formData.get("id") ?? "");
  await ctx.supabase.from("rewards").update({ active: false }).eq("id", id).eq("family_id", ctx.familyId);
  revalidatePath("/parent/progress");
  revalidatePath("/parent/rewards");
  revalidatePath("/kid/store");
}

export async function approveReward(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  await ctx.supabase.rpc("approve_purchase", { p_purchase: String(formData.get("id") ?? "") });
  revalidatePath("/parent");
  revalidatePath("/parent/progress");
  revalidatePath("/parent/rewards");
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
  revalidatePath("/parent");
  revalidatePath("/parent/progress");
  revalidatePath("/parent/rewards");
  revalidatePath("/kid/store");
}

export async function confirmStory(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx?.childId) return;
  const storyId = String(formData.get("id") ?? "");
  const [{ data: story }, { data: read }] = await Promise.all([
    ctx.supabase.from("stories").select("id, slug").eq("id", storyId).maybeSingle(),
    ctx.supabase.from("story_reads").select("story_id").eq("child_id", ctx.childId).eq("story_id", storyId).maybeSingle(),
  ]);
  if (!story?.slug || !read) return;
  const reason = `story:${story.slug}`;
  const { data: paid } = await ctx.supabase.from("star_ledger").select("id").eq("child_id", ctx.childId).eq("reason", reason).limit(1);
  if ((paid ?? []).length > 0) return;
  await ctx.supabase.rpc("award_stars", { p_child: ctx.childId, p_amount: 2, p_reason: reason });
  await growGarden(ctx.supabase, ctx.childId);
  const { data } = await ctx.supabase.from("skill_progress").select("correct, attempts, level").eq("child_id", ctx.childId).eq("skill", "reading").maybeSingle();
  const correct = Number(data?.correct ?? 0) + 1;
  await ctx.supabase.from("skill_progress").upsert(
    {
      family_id: ctx.familyId,
      child_id: ctx.childId,
      skill: "reading",
      correct,
      attempts: Number(data?.attempts ?? 0) + 1,
      level: nextLevel(Number(data?.level ?? 0), correct >= 3 ? 3 : 1),
    },
    { onConflict: "child_id,skill" },
  );
  revalidatePath("/parent/progress");
  revalidatePath("/parent");
}

export async function sendDigest(formData: FormData) {
  const ctx = await parentContext();
  if (!ctx) return;
  const text = String(formData.get("text") ?? "").trim().slice(0, 700);
  if (!text) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const { data: chats } = await ctx.supabase.from("telegram_chats").select("chat_id").eq("family_id", ctx.familyId);
  for (const chat of chats ?? []) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat.chat_id, text }),
    });
  }
  revalidatePath("/parent/progress");
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

"use server";

import { nextLevel } from "@/lib/plan/outline";
import { getFamily } from "@/lib/family";
import { isFamilyVoicePath } from "@/lib/voice/record";
import { NEW_PROMPTS, phraseById } from "@/lib/voice/packs";
import { storyBySlug } from "@/lib/stories/library";

export async function finishPhrase(phraseId: string) {
  const known = phraseById(phraseId) ?? NEW_PROMPTS.find((prompt) => prompt.id === phraseId);
  if (!known) return { stars: 0, balance: 0 };
  return awardOnce(phraseId, "dictation");
}

export async function saveRecording(path: string, phraseId: string) {
  const ctx = await childContext();
  if (!ctx) return { ok: false, stars: 0, balance: 0 };
  if (!isFamilyVoicePath(ctx.familyId, path)) return { ok: false, stars: 0, balance: 0 };
  const { error } = await ctx.supabase.from("voice_recordings").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    path,
  });
  if (error) return { ok: false, stars: 0, balance: 0 };
  const award = await finishPhrase(phraseId);
  return { ok: true, ...award };
}

export async function finishStory(slug: string) {
  const story = storyBySlug(slug);
  const ctx = await childContext();
  if (!story || !ctx) return { stars: 0, balance: 0 };
  const { data: row } = await ctx.supabase.from("stories").select("id").eq("slug", slug).maybeSingle();
  if (!row) return { stars: 0, balance: ctx.stars };
  const { data: existing } = await ctx.supabase
    .from("story_reads")
    .select("story_id")
    .eq("child_id", ctx.childId)
    .eq("story_id", row.id)
    .maybeSingle();
  if (existing) return { stars: 0, balance: ctx.stars };
  const inserted = await ctx.supabase.from("story_reads").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    story_id: row.id,
    completed_at: new Date().toISOString(),
  });
  if (inserted.error) return { stars: 0, balance: ctx.stars };
  return { stars: 0, balance: ctx.stars };
}

async function awardOnce(key: string, skill: string) {
  const ctx = await childContext();
  if (!ctx) return { stars: 0, balance: 0 };
  const game = `voice:${key}`;
  const { data: prior } = await ctx.supabase.from("game_sessions").select("id").eq("child_id", ctx.childId).eq("game", game).limit(1);
  if ((prior ?? []).length > 0) return { stars: 0, balance: ctx.stars };
  const { data } = await ctx.supabase.rpc("award_stars", { p_child: ctx.childId, p_amount: 2, p_reason: game });
  if (typeof data !== "number") return { stars: 0, balance: ctx.stars };
  const stars = data > ctx.stars ? 2 : 0;
  await ctx.supabase.from("game_sessions").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    game,
    score: 1,
    stars,
  });
  await bumpSkill(ctx, skill);
  return { stars, balance: data };
}

async function bumpSkill(ctx: NonNullable<Awaited<ReturnType<typeof childContext>>>, skill: string) {
  const { data } = await ctx.supabase.from("skill_progress").select("correct, attempts, level").eq("child_id", ctx.childId).eq("skill", skill).maybeSingle();
  const correct = Number(data?.correct ?? 0) + 1;
  const attempts = Number(data?.attempts ?? 0) + 1;
  await ctx.supabase.from("skill_progress").upsert(
    {
      family_id: ctx.familyId,
      child_id: ctx.childId,
      skill,
      correct,
      attempts,
      level: nextLevel(Number(data?.level ?? 0), correct >= 3 ? 3 : 1),
    },
    { onConflict: "child_id,skill" },
  );
}

async function childContext() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  return { supabase, familyId: family.family_id, childId: family.child_id, stars: family.star_balance };
}

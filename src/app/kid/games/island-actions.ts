"use server";

import { revalidatePath } from "next/cache";
import { nextLevel } from "@/lib/plan/outline";
import { songMatches } from "@/lib/games/cove";
import { gradeKitchen, type Plate } from "@/lib/games/kitchen";
import { cleared, levelById, type Dir } from "@/lib/games/lagoon";
import { gradeSafari } from "@/lib/games/safari";
import { townItem } from "@/lib/games/town";
import { getFamily } from "@/lib/family";

const dirs = new Set<Dir>(["up", "right", "down", "left"]);

export async function finishLagoon(level: number, arrows: Dir[]) {
  const puzzle = levelById(level);
  const path = arrows.filter((dir) => dirs.has(dir)).slice(0, 8);
  if (!puzzle || !cleared(puzzle, path)) return { stars: 0, balance: 0, cleared: false };
  const awarded = await awardOnce(`lagoon:${level}`, "problem", 2, path.length);
  return { ...awarded, cleared: true };
}

export async function finishKitchen(plates: Plate[]) {
  const graded = gradeKitchen(plates.slice(0, 5).map(asPlate));
  return awardRound("kitchen", "numbers", graded.stars, graded.correct);
}

export async function finishSafari(picks: string[]) {
  const graded = gradeSafari(picks.map(String).slice(0, 5));
  return awardRound("safari", "vocabulary", graded.stars, graded.correct);
}

export async function finishSong(notes: string[]) {
  if (!songMatches(notes.map(String))) return { stars: 0, balance: 0 };
  return awardOnce("cove:frere-jacques", "music", 2, notes.length);
}

export async function buyPlot(slot: number, item: string) {
  const ctx = await childContext();
  if (!ctx || !townItem(item) || !Number.isInteger(slot)) return { ok: false, balance: 0 };
  const { data, error } = await ctx.supabase.rpc("buy_town_item", { p_child: ctx.childId, p_slot: slot, p_item: item });
  if (error || typeof data !== "number") return { ok: false, balance: ctx.stars };
  return { ok: true, balance: data };
}

export async function requestReward(rewardId: string) {
  const ctx = await childContext();
  if (!ctx) return { ok: false };
  const { data: reward } = await ctx.supabase
    .from("rewards")
    .select("id")
    .eq("id", rewardId)
    .eq("family_id", ctx.familyId)
    .eq("active", true)
    .maybeSingle();
  if (!reward) return { ok: false };
  const { data: pending } = await ctx.supabase
    .from("purchases")
    .select("id")
    .eq("child_id", ctx.childId)
    .eq("reward_id", rewardId)
    .eq("status", "requested")
    .limit(1);
  if ((pending ?? []).length > 0) return { ok: true };
  const { error } = await ctx.supabase.from("purchases").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    reward_id: rewardId,
    status: "requested",
  });
  return { ok: !error };
}

export async function requestRewardForm(formData: FormData) {
  await requestReward(String(formData.get("id") ?? ""));
  revalidatePath("/kid/store");
}

async function awardRound(game: string, skill: string, stars: number, score: number) {
  const ctx = await childContext();
  if (!ctx) return { stars: 0, balance: 0 };
  let balance = ctx.stars;
  let given = 0;
  if (stars > 0) {
    const { data } = await ctx.supabase.rpc("award_stars", { p_child: ctx.childId, p_amount: stars, p_reason: game });
    if (typeof data === "number") {
      balance = data;
      given = data > ctx.stars ? stars : 0;
    }
  }
  await ctx.supabase.from("game_sessions").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    game,
    score,
    stars: given,
  });
  if (given > 0) await bumpSkill(ctx, skill);
  return { stars: given, balance };
}

async function awardOnce(game: string, skill: string, stars: number, score: number) {
  const ctx = await childContext();
  if (!ctx) return { stars: 0, balance: 0 };
  const { data: prior } = await ctx.supabase.from("game_sessions").select("id").eq("child_id", ctx.childId).eq("game", game).gt("stars", 0).limit(1);
  if ((prior ?? []).length > 0) return { stars: 0, balance: ctx.stars };
  return awardRound(game, skill, stars, score);
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

function asPlate(plate: Plate): Plate {
  return { pomme: count(plate?.pomme), biscuit: count(plate?.biscuit), jus: count(plate?.jus) };
}

function count(value: number) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(number, 5);
}

async function childContext() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  return { supabase, familyId: family.family_id, childId: family.child_id, stars: family.star_balance };
}

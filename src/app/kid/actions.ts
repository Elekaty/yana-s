"use server";

import { z } from "zod";
import { getFamily } from "@/lib/family";
import { BUBBLE_FRIENDS, type BubbleFriend } from "@/lib/mochi";
import {
  applyClientTick,
  initialClock,
  postponeClock,
  rewardAmount,
  skipBreakClock,
  studySettings,
  type StudyClock,
} from "@/lib/study/clock";
import { stepsFromGames, type RunStatus } from "@/lib/study/homework";

const pinSchema = z.string().regex(/^\d{4,6}$/);

export async function saveClock(proposedRemaining: number): Promise<StudyClock | null> {
  const ctx = await clockContext();
  if (!ctx) return null;
  const now = Date.now();
  const result = applyClientTick({
    saved: ctx.clock,
    savedAt: ctx.updatedAt,
    proposedRemaining,
    now,
    settings: ctx.settings,
  });
  if (result.finishedBreak) {
    await writeClock(ctx.supabase, ctx.childId, { ...result.clock, remainingSec: 0, mode: "break" });
    const { data: claimed } = await ctx.supabase
      .from("study_clocks")
      .update({ break_awarded: true })
      .eq("child_id", ctx.childId)
      .eq("mode", "break")
      .eq("break_awarded", false)
      .lte("remaining_sec", 0)
      .select("child_id")
      .maybeSingle();
    if (!claimed) return { ...result.clock, remainingSec: 0, mode: "break" };
    await ctx.supabase.rpc("award_stars", { p_child: ctx.childId, p_amount: 1, p_reason: "break" });
    const fresh = initialClock(ctx.settings);
    await writeClock(ctx.supabase, ctx.childId, fresh);
    return fresh;
  }
  await writeClock(ctx.supabase, ctx.childId, result.clock);
  return result.clock;
}

export async function postponeStudy(minutes: number): Promise<StudyClock | null> {
  const ctx = await clockContext();
  if (!ctx) return null;
  const next = postponeClock(ctx.clock, ctx.settings, minutes);
  await writeClock(ctx.supabase, ctx.childId, next);
  return next;
}

export async function skipBreak(pin: string): Promise<{ error?: string; clock?: StudyClock }> {
  const ctx = await clockContext();
  if (!ctx) return { error: "Could not skip the break." };
  if (!ctx.hasPin) return { error: "A parent needs to set a PIN first." };
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { error: "That PIN is not right." };
  const { data: ok, error } = await ctx.supabase.rpc("verify_family_pin", { p_pin: parsed.data });
  if (error || !ok) return { error: "That PIN is not right." };
  const next = skipBreakClock(ctx.clock, ctx.settings);
  await writeClock(ctx.supabase, ctx.childId, next);
  return { clock: next };
}

export async function saveProgress(input: { taskId: string; stepIndex: number; hintLevel: number; status: RunStatus }) {
  const ctx = await runContext(input.taskId);
  if (!ctx) return;
  const hintLevel = Math.min(3, Math.max(0, Math.round(input.hintLevel)));
  const stepIndex = Math.max(0, Math.round(input.stepIndex));
  const status: RunStatus = input.hintLevel >= 3 && input.status === "doing" ? "stuck" : input.status;
  if (ctx.run) {
    await ctx.supabase
      .from("homework_runs")
      .update({ step_index: stepIndex, hint_level: hintLevel, status, updated_at: new Date().toISOString() })
      .eq("id", ctx.run.id);
    return;
  }
  await ctx.supabase.from("homework_runs").insert({
    family_id: ctx.familyId,
    child_id: ctx.childId,
    task_id: input.taskId,
    step_index: stepIndex,
    hint_level: hintLevel,
    status,
    awarded_steps: [],
  });
}

export async function completeStep(input: { taskId: string; stepIndex: number }) {
  const ctx = await runContext(input.taskId);
  if (!ctx) return { error: "Could not save this step." };
  const stepIndex = Math.max(0, Math.round(input.stepIndex));
  const steps = stepsFromGames(ctx.games, ctx.lang);
  const step = steps[stepIndex];
  if (!step) return { error: "That step is missing." };
  const awarded = new Set(ctx.run?.awarded_steps ?? []);
  let stars = ctx.stars;
  if (!awarded.has(stepIndex)) {
    const amount = rewardAmount(step.reward);
    const { data, error } = await ctx.supabase.rpc("award_stars", {
      p_child: ctx.childId,
      p_amount: amount,
      p_reason: `homework:${input.taskId}:${stepIndex}`,
    });
    if (error) return { error: "Could not add the stars." };
    if (typeof data === "number") stars = data;
    awarded.add(stepIndex);
  }
  const done = stepIndex >= steps.length - 1;
  const nextIndex = done ? stepIndex : stepIndex + 1;
  const row = {
    step_index: nextIndex,
    hint_level: done ? 3 : 0,
    status: done ? "done" : "doing",
    awarded_steps: [...awarded],
    updated_at: new Date().toISOString(),
  };
  const saved = ctx.run
    ? await ctx.supabase.from("homework_runs").update(row).eq("id", ctx.run.id)
    : await ctx.supabase.from("homework_runs").insert({
        family_id: ctx.familyId,
        child_id: ctx.childId,
        task_id: input.taskId,
        ...row,
      });
  if (saved.error) return { error: "Could not save this step." };
  if (done) {
    await ctx.supabase.from("tasks").update({ status: "completed" }).eq("id", input.taskId).eq("family_id", ctx.familyId);
  }
  return { stars, done, stepIndex: nextIndex };
}

export async function meetFriend(friend: string) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return { fresh: false, stars: family?.star_balance ?? 0 };
  if (!BUBBLE_FRIENDS.includes(friend as BubbleFriend)) return { fresh: false, stars: family.star_balance };
  const { error } = await supabase.from("friends_unlocked").insert({
    family_id: family.family_id,
    child_id: family.child_id,
    friend,
  });
  if (error) return { fresh: false, stars: family.star_balance };
  const { data } = await supabase.rpc("award_stars", { p_child: family.child_id, p_amount: 2, p_reason: `friend:${friend}` });
  return { fresh: true, stars: typeof data === "number" ? data : family.star_balance + 2 };
}

async function clockContext() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const [{ data: familyRow, error: familyError }, { data: row, error: clockError }] = await Promise.all([
    supabase.from("families").select("settings").eq("id", family.family_id).single(),
    supabase.from("study_clocks").select("mode, remaining_sec, postponements, break_awarded, updated_at").eq("child_id", family.child_id).maybeSingle(),
  ]);
  if (familyError || clockError || !row) return null;
  const settings = studySettings(familyRow?.settings);
  const clock: StudyClock = {
    mode: row.mode,
    remainingSec: row.remaining_sec,
    postponements: row.postponements,
    breakAwarded: row.break_awarded,
  };
  return {
    supabase,
    childId: family.child_id,
    hasPin: family.has_pin,
    settings,
    clock,
    updatedAt: Date.parse(row.updated_at),
  };
}

async function writeClock(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  childId: string,
  clock: StudyClock,
) {
  await supabase
    .from("study_clocks")
    .update({
      mode: clock.mode,
      remaining_sec: clock.remainingSec,
      postponements: clock.postponements,
      break_awarded: clock.breakAwarded,
      updated_at: new Date().toISOString(),
    })
    .eq("child_id", childId);
}

async function runContext(taskId: string) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const { data: task } = await supabase.from("tasks").select("id").eq("id", taskId).eq("family_id", family.family_id).maybeSingle();
  if (!task) return null;
  const [{ data: games }, { data: run }] = await Promise.all([
    supabase.from("mini_games").select("game_data").eq("task_id", taskId),
    supabase
      .from("homework_runs")
      .select("id, awarded_steps")
      .eq("child_id", family.child_id)
      .eq("task_id", taskId)
      .maybeSingle(),
  ]);
  return {
    supabase,
    familyId: family.family_id,
    childId: family.child_id,
    lang: family.child_language,
    stars: family.star_balance,
    games: games ?? [],
    run: run ? { id: run.id as string, awarded_steps: (run.awarded_steps ?? []) as number[] } : null,
  };
}

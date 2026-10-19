"use server";

import { z } from "zod";
import { getFamily } from "@/lib/family";
import { BUBBLE_FRIENDS, type BubbleFriend } from "@/lib/mochi";
import { addStudySeconds, markCheckIn, mondayKey, prizeSettings, readPrizeState, weekDays, type StarAward } from "@/lib/prizes";
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
  const studied = ctx.clock.mode === "study" ? Math.max(0, ctx.clock.remainingSec - result.clock.remainingSec) : 0;
  await grantChests(ctx.supabase, ctx.familyId, ctx.childId, studied);
  return result.clock;
}

export async function postponeStudy(minutes: number): Promise<StudyClock | null> {
  const ctx = await clockContext();
  if (!ctx) return null;
  const next = postponeClock(ctx.clock, ctx.settings, minutes);
  await writeClock(ctx.supabase, ctx.childId, next);
  return next;
}

export async function allowStoryLink(pin: string) {
  const { supabase, family } = await getFamily();
  if (!family) return { ok: false, error: "no-family" };
  if (!family.has_pin) return { ok: false, error: "need-pin" };
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, error: "bad-pin" };
  const { data: ok, error } = await supabase.rpc("verify_family_pin", { p_pin: parsed.data });
  if (error || !ok) return { ok: false, error: "bad-pin" };
  return { ok: true, error: "" };
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

export async function checkInNow() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return { stars: family?.star_balance ?? 0, note: "" };
  const timeZone = family.timezone || "Europe/Paris";
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [{ data: familyRow }, { data: child }] = await Promise.all([
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
    supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle(),
  ]);
  const settings = (familyRow?.settings as { evening_from?: string; evening_to?: string } | null) ?? {};
  const from = settings.evening_from || "18:00";
  const to = settings.evening_to || "20:00";
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const open = clock >= from.slice(0, 5) && clock <= to.slice(0, 5);
  const monday = mondayKey(day);
  const marked = markCheckIn(readPrizeState(child?.settings), day, weekDays(monday), monday, open, prizeSettings(familyRow?.settings));
  if (marked.awards.length === 0) {
    const note = marked.status === "already" ? "already" : "closed";
    return { stars: family.star_balance, note };
  }
  const stars = await payAwards(supabase, family.child_id, marked.awards, family.star_balance);
  const childSettings = { ...((child?.settings as Record<string, unknown> | null) ?? {}), prizes: marked.state };
  await supabase.from("children").update({ settings: childSettings }).eq("id", family.child_id);
  return { stars, note: marked.status };
}

async function grantChests(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  familyId: string,
  childId: string,
  seconds: number,
) {
  if (seconds < 1) return;
  const [{ data: familyRow }, { data: child }] = await Promise.all([
    supabase.from("families").select("settings, timezone").eq("id", familyId).maybeSingle(),
    supabase.from("children").select("settings").eq("id", childId).maybeSingle(),
  ]);
  const timeZone = familyRow?.timezone || "Europe/Paris";
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const prior = readPrizeState(child?.settings);
  const added = addStudySeconds(prior, day, seconds, prizeSettings(familyRow?.settings));
  if (added.prizes.length === 0 && added.state.activeSec === prior.activeSec && added.state.chestDay === prior.chestDay) return;
  const childSettings = { ...((child?.settings as Record<string, unknown> | null) ?? {}), prizes: added.state };
  await supabase.from("children").update({ settings: childSettings }).eq("id", childId);
  for (const friend of added.state.friends) {
    if (prior.friends.includes(friend)) continue;
    await supabase.from("friends_unlocked").insert({ family_id: familyId, child_id: childId, friend });
  }
  if (added.awards.length > 0) await payAwards(supabase, childId, added.awards, 0);
}

async function payAwards(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  childId: string,
  awards: StarAward[],
  fallback: number,
) {
  let stars = fallback;
  for (const award of awards) {
    const { data } = await supabase.rpc("award_stars", { p_child: childId, p_amount: award.amount, p_reason: award.reason });
    if (typeof data === "number") stars = data;
  }
  return stars;
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
    familyId: family.family_id,
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

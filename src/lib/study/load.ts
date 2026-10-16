import type { SupabaseClient } from "@supabase/supabase-js";
import { initialClock, studySettings, type StudyClock, type StudySettings } from "@/lib/study/clock";

export type LoadedClock = {
  settings: StudySettings;
  clock: StudyClock;
  updatedAt: string;
};

export async function ensureStudyClock(
  supabase: SupabaseClient,
  familyId: string,
  childId: string,
): Promise<LoadedClock | null> {
  const { data: familyRow, error: familyError } = await supabase.from("families").select("settings").eq("id", familyId).single();
  if (familyError) return null;
  const settings = studySettings(familyRow?.settings);
  const { data: existing, error: clockError } = await supabase
    .from("study_clocks")
    .select("mode, remaining_sec, postponements, break_awarded, updated_at")
    .eq("child_id", childId)
    .maybeSingle();
  if (clockError) return null;
  if (existing) return { settings, clock: clockFrom(existing), updatedAt: existing.updated_at as string };
  const clock = initialClock(settings);
  const { error: insertError } = await supabase.from("study_clocks").insert({
    child_id: childId,
    family_id: familyId,
    mode: clock.mode,
    remaining_sec: clock.remainingSec,
    postponements: clock.postponements,
    break_awarded: clock.breakAwarded,
  });
  if (insertError) {
    const { data: again } = await supabase
      .from("study_clocks")
      .select("mode, remaining_sec, postponements, break_awarded, updated_at")
      .eq("child_id", childId)
      .maybeSingle();
    if (!again) return null;
    return { settings, clock: clockFrom(again), updatedAt: again.updated_at as string };
  }
  return { settings, clock, updatedAt: new Date().toISOString() };
}

function clockFrom(row: { mode: StudyClock["mode"]; remaining_sec: number; postponements: number; break_awarded: boolean }): StudyClock {
  return {
    mode: row.mode,
    remainingSec: row.remaining_sec,
    postponements: row.postponements,
    breakAwarded: row.break_awarded,
  };
}

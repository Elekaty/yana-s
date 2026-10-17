import type { SupabaseClient } from "@supabase/supabase-js";
import { initialClock, studySettings } from "@/lib/study/clock";

export async function resumeFromBreak(supabase: SupabaseClient, familyId: string, childId: string) {
  const { data: row } = await supabase.from("study_clocks").select("mode").eq("child_id", childId).maybeSingle();
  if (row?.mode !== "break") return;
  const { data: familyRow } = await supabase.from("families").select("settings").eq("id", familyId).maybeSingle();
  const fresh = initialClock(studySettings(familyRow?.settings));
  await supabase
    .from("study_clocks")
    .update({
      mode: fresh.mode,
      remaining_sec: fresh.remainingSec,
      postponements: 0,
      break_awarded: false,
      updated_at: new Date().toISOString(),
    })
    .eq("child_id", childId);
}

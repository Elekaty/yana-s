"use server";

import { revalidatePath } from "next/cache";
import { studySettings } from "@/lib/study/clock";
import { getFamily } from "@/lib/family";

export async function savePractice(formData: FormData) {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent" || !family.child_id) return;
  const study = studySettings({
    study_minutes: Number(formData.get("study")),
    break_minutes: Number(formData.get("break")),
  });
  const tables = formData
    .getAll("table")
    .map(Number)
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 10)
    .slice(0, 6);
  const capRaw = String(formData.get("townCap") ?? "").trim();
  const townCap = capRaw === "" ? null : Math.min(500, Math.max(0, Math.floor(Number(capRaw))));
  const [{ data: familyRow }, { data: child }] = await Promise.all([
    supabase.from("families").select("settings").eq("id", family.family_id).single(),
    supabase.from("children").select("settings").eq("id", family.child_id).single(),
  ]);
  const settings = { ...((familyRow?.settings as Record<string, unknown> | null) ?? {}) };
  settings.study_minutes = study.studyMinutes;
  settings.break_minutes = study.breakMinutes;
  settings.on_time_stars = clampSetting(formData.get("onTime"), 1, 5, 2);
  settings.chest_minutes = clampSetting(formData.get("chestMinutes"), 5, 60, 10);
  settings.chest_daily_cap = clampSetting(formData.get("chestCap"), 0, 5, 3);
  if (townCap === null || Number.isNaN(townCap)) delete settings.town_star_cap;
  else settings.town_star_cap = townCap;
  const childSettings = { ...((child?.settings as Record<string, unknown> | null) ?? {}) };
  if (tables.length > 0) childSettings.tables = tables;
  childSettings.voice = formData.get("voice") === "on";
  await supabase.from("families").update({ settings }).eq("id", family.family_id);
  await supabase.from("children").update({ settings: childSettings }).eq("id", family.child_id);
  revalidatePath("/parent/setup");
  revalidatePath("/kid", "layout");
}

function clampSetting(value: FormDataEntryValue | null, min: number, max: number, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(number)));
}

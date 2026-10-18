"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";

const GAME_TABLES = [2, 3, 4, 5, 10];

export async function saveGameTables(formData: FormData) {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent" || !family.child_id) return;
  const tables = formData
    .getAll("table")
    .map(Number)
    .filter((value) => GAME_TABLES.includes(value));
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).single();
  const settings = { ...((child?.settings as Record<string, unknown> | null) ?? {}) };
  settings.tables = tables.length > 0 ? tables : [2, 5, 10];
  await supabase.from("children").update({ settings }).eq("id", family.child_id);
  revalidatePath("/parent/curriculum");
  revalidatePath("/kid", "layout");
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFamily } from "@/lib/family";

const languageSchema = z.enum(["fr", "en"]);

export async function setChildLanguage(formData: FormData) {
  const parsed = languageSchema.safeParse(formData.get("language"));
  if (!parsed.success) return;
  const { supabase, family } = await getFamily();
  if (!family?.child_id || family.my_role !== "parent") return;
  await supabase.from("children").update({ language: parsed.data }).eq("id", family.child_id);
  revalidatePath("/kid", "layout");
  revalidatePath("/parent/setup");
}

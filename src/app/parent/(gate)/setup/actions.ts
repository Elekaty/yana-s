"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getFamily } from "@/lib/family";

const languageSchema = z.enum(["fr", "en"]);

export async function setChildLanguage(formData: FormData) {
  const parsed = languageSchema.safeParse(formData.get("language"));
  if (!parsed.success) return;
  const jar = await cookies();
  jar.set("mf_lang", parsed.data, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 400,
    secure: process.env.NODE_ENV === "production",
  });
  const { supabase, family } = await getFamily();
  if (family?.child_id && family.my_role === "parent") {
    await supabase.from("children").update({ language: parsed.data }).eq("id", family.child_id);
  }
  revalidatePath("/", "layout");
  revalidatePath("/kid", "layout");
  revalidatePath("/parent", "layout");
}

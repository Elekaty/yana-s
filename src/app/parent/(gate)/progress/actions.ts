"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";

const reactions = new Set(["👍", "❤️", "🌟"]);

export async function reactToVoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reaction = String(formData.get("reaction") ?? "");
  if (!reactions.has(reaction)) return;
  const { supabase, family } = await getFamily();
  if (!family) return;
  await supabase.from("voice_recordings").update({ parent_reaction: reaction }).eq("id", id).eq("family_id", family.family_id);
  revalidatePath("/parent/progress");
  revalidatePath("/kid/games/voice/album");
}

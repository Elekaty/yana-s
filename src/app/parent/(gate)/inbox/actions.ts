"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";
import { requeueClassify } from "@/lib/intake/save";

export async function retryReading(formData: FormData) {
  const { family } = await getFamily();
  if (!family || family.my_role !== "parent") return;
  const messageId = String(formData.get("messageId") ?? "");
  const includeImage = formData.get("includeImage") === "yes";
  if (!messageId) return;
  await requeueClassify(family.family_id, messageId, includeImage);
  revalidatePath("/parent/inbox");
}

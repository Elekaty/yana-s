import "server-only";

import { PLAN, SKILLS } from "@/lib/plan/outline";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureOutline() {
  const admin = createAdminClient();
  const { data: skills } = await admin.from("skills").select("skill_key").is("family_id", null);
  const knownSkills = new Set((skills ?? []).map((row) => row.skill_key));
  const missingSkills = SKILLS.filter((skill) => !knownSkills.has(skill.skill_key)).map((skill) => ({ ...skill, family_id: null }));
  if (missingSkills.length > 0) await admin.from("skills").insert(missingSkills);
  const { data: items } = await admin.from("plan_items").select("item_key").is("family_id", null);
  const knownItems = new Set((items ?? []).map((row) => row.item_key));
  const missingItems = PLAN.filter((item) => !knownItems.has(item.item_key)).map((item) => ({
    ...item,
    family_id: null,
    done: false,
    hidden: false,
  }));
  if (missingItems.length > 0) await admin.from("plan_items").insert(missingItems);
}

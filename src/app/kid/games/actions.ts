"use server";

import { nextLevel } from "@/lib/plan/outline";
import { getFamily } from "@/lib/family";
import { gradeRound, tablesFrom } from "@/lib/games/questions";

export async function finishRound(input: { game: "bulles" | "fruit"; level: "easy" | "medium"; picks: number[] }) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return { stars: 0, correct: 0, balance: 0 };
  if (input.game !== "bulles" && input.game !== "fruit") return { stars: 0, correct: 0, balance: family.star_balance };
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  const tables = tablesFrom(child?.settings);
  const choiceCount = input.game === "fruit" && input.level === "medium" ? 4 : 3;
  const graded = gradeRound(tables, input.picks.map(Number).slice(0, 5), choiceCount);
  let balance = family.star_balance;
  if (graded.stars > 0) {
    const { data } = await supabase.rpc("award_stars", {
      p_child: family.child_id,
      p_amount: graded.stars,
      p_reason: input.game,
    });
    if (typeof data === "number") balance = data;
  }
  await supabase.from("game_sessions").insert({
    family_id: family.family_id,
    child_id: family.child_id,
    game: input.game,
    score: graded.correct,
    stars: graded.stars,
  });
  const { data: skill } = await supabase
    .from("skill_progress")
    .select("correct, attempts, level")
    .eq("child_id", family.child_id)
    .eq("skill", "tables")
    .maybeSingle();
  const correct = Number(skill?.correct ?? 0) + graded.correct;
  const attempts = Number(skill?.attempts ?? 0) + 1;
  await supabase.from("skill_progress").upsert(
    {
      family_id: family.family_id,
      child_id: family.child_id,
      skill: "tables",
      correct,
      attempts,
      level: nextLevel(Number(skill?.level ?? 0), correct >= 15 ? 3 : correct >= 5 ? 1 : 0),
    },
    { onConflict: "child_id,skill" },
  );
  return { stars: graded.stars, correct: graded.correct, balance };
}

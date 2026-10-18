import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLAN, SCHOOL_MONTHS, SKILLS, monthPlan, nextLevel, nextMonthKey, skillStatus, tablesSkillLevel, weekCounts, type PlanItem } from "@/lib/plan/outline";

const shared = (key: string): PlanItem => {
  const item = PLAN.find((row) => row.item_key === key);
  if (!item) throw new Error(key);
  return { ...item, family_id: null, done: false, hidden: false };
};

describe("monthly plan and skills", () => {
  it("lets a family line replace the shared one for that month", () => {
    const base = [shared("toussaint"), shared("numbers-oct")];
    expect(monthPlan(base, "2026-10").map((row) => row.item_key).sort()).toEqual(["numbers-oct", "toussaint"]);
    const edited: PlanItem = { ...shared("toussaint"), family_id: "family", text: "Our break is a week later.", source: "parent" };
    const visible = monthPlan([...base, edited], "2026-10");
    expect(visible.find((row) => row.item_key === "toussaint")?.text).toBe("Our break is a week later.");
    expect(visible.filter((row) => row.item_key === "toussaint")).toHaveLength(1);
    const hidden: PlanItem = { ...edited, hidden: true };
    expect(monthPlan([...base, hidden], "2026-10").map((row) => row.item_key)).toEqual(["numbers-oct"]);
  });

  it("shows the November plan and lets a tables round raise the skill", () => {
    const rows = PLAN.map((item) => ({ ...item, family_id: null, done: false, hidden: false }));
    expect(SCHOOL_MONTHS).toContain("2026-11");
    expect(monthPlan(rows, "2026-11").map((row) => row.item_key).sort()).toEqual(["sentence-nov", "times-2"]);
    expect(skillStatus(nextLevel(0, tablesSkillLevel(5)))).toBe("practicing");
    expect(skillStatus(nextLevel(3, tablesSkillLevel(5)))).toBe("strong");
  });

  it("keeps a parent strong status above a later game", () => {
    expect(nextLevel(3, 1)).toBe(3);
    expect(nextLevel(0, 1)).toBe(1);
    expect(skillStatus(3)).toBe("strong");
    expect(skillStatus(0)).toBe("not started");
    expect(nextMonthKey("2026-12")).toBe("2027-01");
    expect(weekCounts(["bulles", "lagoon:1", "kitchen"])).toEqual({ games: 2, logic: 1 });
  });

  it("ships the outline in the app and in SQL", () => {
    const sql = readFileSync("supabase/migrations/0010_plan.sql", "utf8");
    expect(sql.startsWith("-- 0010 plan")).toBe(true);
    expect(SKILLS).toHaveLength(23);
    expect(new Set(SKILLS.map((skill) => skill.skill_key)).size).toBe(23);
    for (const skill of SKILLS) expect(sql).toContain(`'${skill.skill_key}'`);
    for (const item of PLAN) expect(sql).toContain(`'${item.item_key}'`);
  });
});

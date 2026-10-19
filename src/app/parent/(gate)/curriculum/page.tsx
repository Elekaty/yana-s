import { createBreakPlan } from "@/app/parent/(gate)/calendar/actions";
import { saveGameTables } from "@/app/parent/(gate)/curriculum/actions";
import { addPlanItem, hidePlanItem, savePlanItem, tickPlanItem } from "@/app/parent/(gate)/todo/actions";
import { raiseSkill } from "@/app/parent/(gate)/progress/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ensureHolidays } from "@/lib/calendar/seed";
import { dayKey, holidayOn, type Holiday } from "@/lib/calendar/plan";
import { tablesFrom } from "@/lib/games/questions";
import { requireParent } from "@/lib/parent/guard";
import { monthPlan, SCHOOL_MONTHS, skillStatus, type PlanItem } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";

export const dynamic = "force-dynamic";

const GAME_TABLES = [2, 3, 4, 5, 10];

export default async function CurriculumPage() {
  const { supabase, user, family } = await requireParent();
  const timeZone = family.timezone || "Europe/Paris";
  try {
    await Promise.all([ensureOutline(), ensureHolidays()]);
  } catch {
    // Missing tables are handled by the empty lists below.
  }
  const today = dayKey(new Date(), timeZone);
  const currentMonth = today.slice(0, 7);
  const [{ data: planRows }, { data: holidayRows }, { data: familyRow }, { data: child }, skillQuery, progressQuery] = await Promise.all([
    supabase.from("plan_items").select("family_id, item_key, month, period, subject, text, source, done, hidden"),
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
    family.child_id ? supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("skills").select("skill_key, area, title_fr, explanation_en, ask_fr").is("family_id", null).order("sort"),
    family.child_id ? supabase.from("skill_progress").select("skill, level").eq("child_id", family.child_id) : Promise.resolve({ data: [] }),
  ]);
  const plan = (planRows ?? []) as PlanItem[];
  const zoneSetting = (familyRow?.settings as { school_zone?: string } | null)?.school_zone;
  const zone = zoneSetting === "B" || zoneSetting === "C" ? zoneSetting : "A";
  const breakToday = holidayOn(today, (holidayRows ?? []) as Holiday[], zone);
  const november = monthPlan(plan, "2026-11");
  const tables = new Set(tablesFrom(child?.settings));
  const levels = new Map((progressQuery.data ?? []).map((row) => [row.skill, Number(row.level)]));

  return (
    <div className="space-y-4">
      <h1>Curriculum</h1>
      {breakToday ? (
        <Card>
          <CardTitle>{breakToday.label}</CardTitle>
          <CardDescription>Back Mon 2 Nov. Here is what to expect in November.</CardDescription>
          <ul className="mt-3 space-y-2 text-sm">
            {november.map((line) => (
              <li key={line.item_key}>
                {line.subject}: {line.text}
              </li>
            ))}
          </ul>
          <form action={createBreakPlan} className="mt-3">
            <Button type="submit" className="h-12">
              Add the break plan to the calendar
            </Button>
          </form>
        </Card>
      ) : null}
      <Card id="november">
        <CardTitle>November</CardTitle>
        <CardDescription>Period 2. The table of 2 is the national marker.</CardDescription>
        <ul className="mt-3 space-y-2 text-sm">
          {november.map((line) => (
            <li key={line.item_key}>
              <span className="font-semibold">{sourceLabel(line.source)}</span> · {line.subject}: {line.text}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Tables in the games</CardTitle>
        <CardDescription>Bulles and Fruit use the boxes you leave on.</CardDescription>
        <form action={saveGameTables} className="mt-3 grid gap-2">
          {GAME_TABLES.map((table) => (
            <label key={table} className="flex h-12 items-center gap-3 text-sm">
              <input type="checkbox" name="table" value={table} defaultChecked={tables.has(table)} />
              Table of {table}
            </label>
          ))}
          <Button type="submit" variant="outline" className="h-12">
            Save tables
          </Button>
        </form>
      </Card>
      {SCHOOL_MONTHS.map((month) => {
        const lines = monthPlan(plan, month);
        const title = monthTitle(month);
        return (
          <section key={month} className={`space-y-3 rounded-2xl p-1 ${month === currentMonth ? "ring-2 ring-grape" : ""}`}>
            <h2 className="font-fredoka text-2xl">{title}</h2>
            {lines.map((line) => (
              <Card key={line.item_key}>
                <CardTitle>{line.subject}</CardTitle>
                <CardDescription>
                  {sourceLabel(line.source)} · {line.done ? "Done" : "Open"}
                </CardDescription>
                <form action={savePlanItem} className="mt-3 grid gap-2">
                  <PlanFields line={line} />
                  <label className="grid gap-1 text-sm">
                    Edit
                    <input name="text" aria-label={`${title} ${line.subject}`} defaultValue={line.text} className="h-12 rounded-md border border-border bg-background px-3" />
                  </label>
                  <Button type="submit" variant="outline" className="h-12">
                    Save
                  </Button>
                </form>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={tickPlanItem}>
                    <PlanFields line={line} />
                    <input type="hidden" name="text" value={line.text} />
                    <Button type="submit" variant="outline" className="h-12">
                      {line.done ? "Undo" : "Done"}
                    </Button>
                  </form>
                  <form action={hidePlanItem}>
                    <PlanFields line={line} />
                    <input type="hidden" name="text" value={line.text} />
                    <Button type="submit" variant="ghost" className="h-12">
                      Remove
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
            <Card>
              <CardTitle>Add your own</CardTitle>
              <form action={addPlanItem} className="mt-3 grid gap-2">
                <input type="hidden" name="month" value={month} />
                <input name="subject" aria-label={`${title} subject`} placeholder="Subject" className="h-12 rounded-md border border-border bg-background px-3" />
                <input name="text" aria-label={`${title} practice`} placeholder="What to practice" className="h-12 rounded-md border border-border bg-background px-3" />
                <Button type="submit" className="h-12">
                  Add
                </Button>
              </form>
            </Card>
          </section>
        );
      })}
      <Card>
        <CardTitle>Skills</CardTitle>
        <CardDescription>A game can raise Tables. A status you set stays if it is higher.</CardDescription>
        <ul className="mt-3 space-y-4">
          {(skillQuery.data ?? []).map((skill) => (
            <li key={skill.skill_key} id={skill.skill_key}>
              <p className="font-medium">{skill.title_fr}</p>
              <p className="text-sm text-muted-foreground">
                {skill.area} · {skillStatus(levels.get(skill.skill_key) ?? 0)}
              </p>
              <p className="text-sm">Ask her: {skill.ask_fr}</p>
              {user && family.child_id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={raiseSkill}>
                    <input type="hidden" name="key" value={skill.skill_key} />
                    <input type="hidden" name="level" value="1" />
                    <Button type="submit" variant="outline" className="h-12">
                      Practicing
                    </Button>
                  </form>
                  <form action={raiseSkill}>
                    <input type="hidden" name="key" value={skill.skill_key} />
                    <input type="hidden" name="level" value="3" />
                    <Button type="submit" variant="outline" className="h-12">
                      Strong
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function sourceLabel(source: string) {
  if (source === "national") return "National";
  if (source === "typical") return "Typical";
  return "Yours";
}

function monthTitle(month: string) {
  return new Date(`${month}-01T12:00:00Z`).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

function PlanFields({ line }: { line: PlanItem }) {
  return (
    <>
      <input type="hidden" name="itemKey" value={line.item_key} />
      <input type="hidden" name="month" value={line.month} />
      <input type="hidden" name="period" value={line.period} />
      <input type="hidden" name="subject" value={line.subject} />
      <input type="hidden" name="done" value={String(line.done)} />
    </>
  );
}

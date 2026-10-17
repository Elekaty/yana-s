import { completeTask } from "@/app/parent/(gate)/calendar/actions";
import { addPlanItem, hidePlanItem, savePlanItem, tickPlanItem } from "@/app/parent/(gate)/todo/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";
import { monthKey, monthPlan, type PlanItem } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, parent_action, status, due_at")
    .eq("family_id", family.family_id)
    .eq("status", "pending")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(40);
  const month = monthKey(new Date(), family.timezone || "Europe/Paris");
  let plan: PlanItem[] | null = null;
  try {
    await ensureOutline();
    const { data, error } = await supabase.from("plan_items").select("family_id, item_key, month, period, subject, text, source, done, hidden");
    if (!error) plan = (data ?? []) as PlanItem[];
  } catch {
    plan = null;
  }
  const lines = plan ? monthPlan(plan, month) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">To do</h1>
      {(tasks ?? []).length === 0 ? <ParentNote title="Nothing waiting" body="Press To do on an inbox message and it will collect here." /> : null}
      {(tasks ?? []).map((task) => (
        <Card key={task.id}>
          <CardTitle>{task.title || "To do"}</CardTitle>
          {task.parent_action ? <CardDescription>{task.parent_action}</CardDescription> : null}
          <form action={completeTask} className="mt-3">
            <input type="hidden" name="taskId" value={task.id} />
            <Button type="submit" variant="outline">Done</Button>
          </form>
        </Card>
      ))}
      <h2 className="text-xl font-semibold">This month</h2>
      <p className="text-sm text-muted-foreground">General outline. A change here is saved for your family.</p>
      {plan === null ? (
        <div className="space-y-2">
          <ParentNote title="Monthly plan" body="The plan table is missing." />
          <a className="text-sm underline" href="/parent/setup/status">Setup checklist</a>
        </div>
      ) : null}
      {lines.map((line) => (
        <Card key={line.item_key}>
          <CardTitle>{line.subject}</CardTitle>
          <CardDescription>
            {line.source} · {line.done ? "ticked" : "open"}
          </CardDescription>
          <form action={savePlanItem} className="mt-3 grid gap-2">
            <PlanFields line={line} />
            <input name="text" aria-label={`${line.subject} text`} defaultValue={line.text} className="h-10 rounded-md border border-border bg-background px-2" />
            <Button type="submit" variant="outline">Save</Button>
          </form>
          <div className="mt-2 flex gap-2">
            <form action={tickPlanItem}>
              <PlanFields line={line} />
              <input type="hidden" name="text" value={line.text} />
              <Button type="submit" variant="outline">{line.done ? "Untick" : "Tick"}</Button>
            </form>
            <form action={hidePlanItem}>
              <PlanFields line={line} />
              <input type="hidden" name="text" value={line.text} />
              <Button type="submit" variant="ghost">Remove</Button>
            </form>
          </div>
        </Card>
      ))}
      <Card>
        <CardTitle>Add a line</CardTitle>
        <form action={addPlanItem} className="mt-3 grid gap-2">
          <input type="hidden" name="month" value={month} />
          <input name="subject" aria-label="Subject" placeholder="Subject" className="h-10 rounded-md border border-border bg-background px-2" />
          <input name="text" aria-label="What to practice" placeholder="What to practice" className="h-10 rounded-md border border-border bg-background px-2" />
          <Button type="submit">Add</Button>
        </form>
      </Card>
    </div>
  );
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

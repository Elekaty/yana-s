import { completeTask } from "@/app/parent/(gate)/calendar/actions";
import { addPlanItem, addQuickTask, hidePlanItem, reassignTask, savePlanItem, snoozeTask, tickPlanItem } from "@/app/parent/(gate)/todo/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireParent } from "@/lib/parent/guard";
import { monthKey, monthPlan, type PlanItem } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const { supabase, family } = await requireParent();
  const [{ data: tasks }, { data: parents }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, parent_action, status, due_at, message_id, assignee_member_id")
      .eq("family_id", family.family_id)
      .eq("status", "pending")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase.from("members").select("id, display_name").eq("role", "parent"),
  ]);
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
      {(tasks ?? []).map((task) => {
        const owner = (parents ?? []).find((parent) => parent.id === task.assignee_member_id);
        return (
          <Card key={task.id}>
            <CardTitle>{task.title || "To do"}</CardTitle>
            <CardDescription>
              {task.due_at ? String(task.due_at).slice(0, 16).replace("T", " ") : "No due date"}
              {owner ? ` · ${owner.display_name}` : ""}
            </CardDescription>
            {task.parent_action ? <p className="mt-2 text-sm">{task.parent_action}</p> : null}
            {task.message_id ? (
              <a className="mt-2 inline-flex h-12 items-center text-sm font-semibold underline" href={`/parent/inbox#${task.message_id}`}>
                School message
              </a>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={completeTask}>
                <input type="hidden" name="taskId" value={task.id} />
                <Button type="submit" size="lg" variant="outline">Done</Button>
              </form>
              {[
                ["30", "30 min"],
                ["45", "45 min"],
                ["60", "1 hour"],
              ].map(([minutes, label]) => (
                <form key={minutes} action={snoozeTask}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="minutes" value={minutes} />
                  <Button type="submit" size="lg" variant="outline">{label}</Button>
                </form>
              ))}
            </div>
            <form action={reassignTask} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="taskId" value={task.id} />
              <select name="memberId" aria-label="Reassign" defaultValue={String(task.assignee_member_id ?? "")} className="h-12 rounded-md border border-border bg-background px-2">
                {(parents ?? []).map((parent) => (
                  <option key={parent.id} value={parent.id}>{parent.display_name}</option>
                ))}
              </select>
              <Button type="submit" size="lg" variant="outline">Reassign</Button>
            </form>
          </Card>
        );
      })}
      <Card>
        <CardTitle>Add a task</CardTitle>
        <form action={addQuickTask} className="mt-3 flex flex-wrap gap-2">
          <input name="title" aria-label="Task" required placeholder="What needs doing" className="h-12 min-w-40 flex-1 rounded-md border border-border bg-background px-3" />
          <input name="due" type="date" aria-label="Due date" className="h-12 rounded-md border border-border bg-background px-2" />
          <Button type="submit" size="lg">Add</Button>
        </form>
      </Card>
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
            {line.source === "national" ? "National" : line.source === "typical" ? "Typical" : "Yours"} · {line.done ? "ticked" : "open"}
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

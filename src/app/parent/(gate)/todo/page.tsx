import { completeTask } from "@/app/parent/(gate)/calendar/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";

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
    </div>
  );
}

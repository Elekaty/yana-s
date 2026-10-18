import { TonightCard } from "@/components/parent/tonight-card";
import { ParentNote } from "@/components/parent-note";
import { ScanDesk, type Question, type ScanCard } from "@/components/scan/desk";
import { getFamily } from "@/lib/family";
import { monthKey, monthPlan, nextMonthKey, type PlanItem } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";

export const dynamic = "force-dynamic";

const ISLANDS = ["Game Bay", "Logic Lagoon", "Creative Cove"] as const;

export default async function ScanPage() {
  const { supabase, family } = await getFamily();
  if (!family) return null;

  const [{ data: scans }, { data: tasks }, { data: sessions }, { data: runs }] = await Promise.all([
    supabase.from("homework_scans").select("id, status, image_path, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("tasks").select("id, scan_id, subject, translated_objective, parent_action, curriculum_skill, confidence, coaching, status"),
    supabase.from("game_sessions").select("game, created_at"),
    supabase.from("homework_runs").select("task_id, status"),
  ]);

  const runStatus = new Map((runs ?? []).map((run) => [run.task_id as string, run.status as string]));

  const cards = await Promise.all(
    (scans ?? []).map(async (scan) => {
      const task = (tasks ?? []).find((item) => item.scan_id === scan.id);
      const coaching = (task?.coaching ?? {}) as { questions?: Question[]; unclear_note?: string; flagged?: boolean };
      const { data: signed } = await supabase.storage.from("scans").createSignedUrl(scan.image_path, 60 * 10);
      const card: ScanCard = {
        id: scan.id,
        status: scan.status,
        createdAt: scan.created_at,
        photoUrl: signed?.signedUrl ?? null,
        subject: task?.subject ?? null,
        objective: task?.translated_objective ?? null,
        action: task?.parent_action ?? null,
        skill: task?.curriculum_skill ?? null,
        confidence: task?.confidence ?? null,
        unclearNote: coaching.unclear_note ?? "",
        flagged: Boolean(coaching.flagged),
        questions: coaching.questions ?? [],
        childStatus: task ? (runStatus.get(task.id) ?? null) : null,
      };
      return card;
    }),
  );

  const today = new Date().toISOString().slice(0, 10);
  const played = new Set(
    (sessions ?? [])
      .filter((session) => String(session.created_at).slice(0, 10) === today)
      .map((session) => session.game as string),
  );
  const homeworkDone = (tasks ?? []).some((task) => task.status === "completed");
  const bayPlayed = played.has("Game Bay") || played.has("bulles") || played.has("fruit");
  const islandsDone = (homeworkDone ? 1 : 0) + (bayPlayed ? 1 : 0) + ISLANDS.filter((island) => island !== "Game Bay" && played.has(island)).length;
  const nextMonth = await nextMonthLine(supabase, family.timezone || "Europe/Paris");

  return (
    <div className="space-y-4">
      <TonightCard />
      {nextMonth ? <ParentNote title="What to expect next month" body={nextMonth} /> : null}
      <ScanDesk familyId={family.family_id} stars={family.star_balance} islandsDone={islandsDone} scans={cards} childName={family.child_name ?? "Child"} />
    </div>
  );
}

async function nextMonthLine(supabase: Awaited<ReturnType<typeof getFamily>>["supabase"], timeZone: string) {
  try {
    await ensureOutline();
  } catch {
    return "";
  }
  const month = nextMonthKey(monthKey(new Date(), timeZone));
  const { data, error } = await supabase.from("plan_items").select("family_id, item_key, month, period, subject, text, source, done, hidden");
  if (error) return "";
  return monthPlan((data ?? []) as PlanItem[], month)[0]?.text ?? "";
}

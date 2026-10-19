import Link from "next/link";
import { HomeworkPlayer } from "@/components/kid/homework-player";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { ensureStudyClock } from "@/lib/study/load";
import { stepsFromGames, type RunStatus } from "@/lib/study/homework";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  if (!family?.child_id) {
    return (
      <div className="grid justify-items-center gap-4 pt-6 text-center">
        <p className="text-6xl" aria-hidden>
          📚
        </p>
        <h1 className="text-4xl">{copy.noHomework}</h1>
        <Link href="/kid/games" className="flex h-16 w-full max-w-xs items-center justify-center rounded-full bg-sun text-2xl text-plum shadow-[0_6px_0_#e0b520]">
          {copy.games}
        </Link>
      </div>
    );
  }

  const [{ data: child }, loaded, { data: scan }] = await Promise.all([
    supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle(),
    ensureStudyClock(supabase, family.family_id, family.child_id),
    supabase.from("homework_scans").select("id, status").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const voice = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  const task = scan?.status === "ready" ? await loadTask(supabase, scan.id, family.child_id, lang) : null;

  return (
    <HomeworkPlayer
      familyId={family.family_id}
      taskId={task?.id ?? null}
      title={task?.title || copy.homework}
      steps={task?.steps ?? []}
      brief={task?.brief ?? { objective: "", action: "" }}
      initialStep={task?.stepIndex ?? 0}
      initialHint={task?.hintLevel ?? 0}
      initialStatus={task?.status ?? "doing"}
      scanStatus={scan?.status ?? null}
      voice={voice}
      lang={lang}
      childName={family.child_name ?? ""}
      clock={loaded?.clock ?? null}
      studyMinutes={loaded?.settings.studyMinutes ?? 20}
      copy={copy}
    />
  );
}

async function loadTask(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  scanId: string,
  childId: string,
  lang: "fr" | "en",
) {
  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, subject, translated_objective, parent_action")
    .eq("scan_id", scanId)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!task) return null;
  const [{ data: games }, { data: run }] = await Promise.all([
    supabase.from("mini_games").select("game_data").eq("task_id", task.id),
    supabase
      .from("homework_runs")
      .select("step_index, hint_level, status")
      .eq("child_id", childId)
      .eq("task_id", task.id)
      .maybeSingle(),
  ]);
  const status = (run?.status ?? "doing") as RunStatus;
  return {
    id: task.id as string,
    title: (lang === "en" ? task.subject : task.title) || task.subject || task.title || "",
    steps: stepsFromGames(games ?? [], lang),
    brief: { objective: task.translated_objective ?? "", action: task.parent_action ?? "" },
    stepIndex: run?.step_index ?? 0,
    hintLevel: run?.hint_level ?? 0,
    status,
  };
}

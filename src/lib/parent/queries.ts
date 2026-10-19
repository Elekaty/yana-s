import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dayKey, holidayOn, type Holiday } from "@/lib/calendar/plan";
import { homeworkLabel, tonightLine } from "@/lib/parent/labels";
import { breakBannerText, noticeHoliday, togetherSuggestion, weekHasActivity, type WeekGlance } from "@/lib/parent/today";
import { loadTonight } from "@/lib/plan/load";
import { skillStatus, weekCounts } from "@/lib/plan/outline";
import type { FamilySummary } from "@/lib/types";

export type TodayCard = {
  id: string;
  tier: string;
  source: string;
  title: string;
  summary: string;
  original: string;
  waitingFor: string;
  ticks: { name: string; seen: boolean }[];
  seenByMe: boolean;
};

export type CoachingLine = { fr: string; en: string; answer: string };

export type TodayData = {
  childName: string;
  stars: number;
  tonightLine: string;
  tonightQuestions: CoachingLine[];
  tonightDone: boolean;
  swapLeaderId: string | null;
  unseenCount: number;
  needsYou: TodayCard[];
  homework: string;
  briefReady: boolean;
  comingUp: { id: string; label: string; when: string; kind: "school" | "holiday" | "flying" | "family" | "reminder" }[];
  breakBanner: string | null;
  breakPlanned: boolean;
  week: WeekGlance & { together: string };
  rewards: { id: string; title: string; cost: number }[];
  recordings: { id: string; createdAt: string; url: string }[];
  setup: { label: string; href: string }[];
};

const tierRank: Record<string, number> = { urgent: 0, important: 1, fyi: 2 };

export async function loadToday(supabase: SupabaseClient, family: FamilySummary, userId: string): Promise<TodayData> {
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekIso = weekStart.toISOString();
  const weekDay = weekIso.slice(0, 10);
  const ahead = new Date();
  ahead.setDate(ahead.getDate() + 7);

  const [plan, me, parents, messages, acks, scans, tasks, events, holidays, roster, sessions, reads, voices, purchases, rewards, chats, familyRow, runs, games, ledger, skills, evenings, reminders] = await Promise.all([
    loadTonight(supabase, family).catch(() => null),
    supabase.from("members").select("id, display_name").eq("user_id", userId).maybeSingle(),
    supabase.from("members").select("id, display_name").eq("role", "parent"),
    supabase.from("messages").select("id, source, title, summary_en, original_text, tier, status, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(30),
    supabase.from("message_acks").select("message_id, member_id"),
    supabase.from("homework_scans").select("id, status, created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("tasks").select("id, scan_id, status, coaching, translated_objective").limit(8),
    supabase.from("events").select("id, title, starts_at, source_message_id").gte("starts_at", new Date().toISOString()).lte("starts_at", ahead.toISOString()).order("starts_at").limit(8),
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("roster_days").select("date, status").gte("date", today).limit(14),
    supabase.from("game_sessions").select("game, created_at").gte("created_at", weekIso),
    supabase.from("story_reads").select("story_id").gte("completed_at", weekIso),
    supabase.from("voice_recordings").select("id, path, created_at, parent_reaction").order("created_at", { ascending: false }).limit(8),
    supabase.from("purchases").select("id, reward_id, status").eq("status", "requested"),
    supabase.from("rewards").select("id, title, cost_stars"),
    supabase.from("telegram_chats").select("chat_id").limit(1),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
    supabase.from("homework_runs").select("task_id, step_index, hint_level, status, updated_at").order("updated_at", { ascending: false }).limit(20),
    supabase.from("mini_games").select("task_id").limit(30),
    supabase.from("star_ledger").select("amount, created_at").gte("created_at", weekIso),
    family.child_id ? supabase.from("skill_progress").select("skill, level").eq("child_id", family.child_id) : Promise.resolve({ data: [] }),
    supabase.from("sessions").select("date, status, duration_min").gte("date", weekDay),
    supabase.from("reminders").select("id, due_at, status").eq("status", "pending").gte("due_at", new Date().toISOString()).lte("due_at", ahead.toISOString()).limit(5),
  ]);

  const myId = (me.data?.id as string | undefined) ?? "";
  const parentRows = (parents.data ?? []) as { id: string; display_name: string }[];
  const ticked = new Set((acks.data ?? []).filter((ack) => ack.member_id === myId).map((ack) => ack.message_id as string));
  const tickedBy = new Map<string, Set<string>>();
  for (const ack of acks.data ?? []) {
    const set = tickedBy.get(ack.message_id as string) ?? new Set<string>();
    set.add(ack.member_id as string);
    tickedBy.set(ack.message_id as string, set);
  }
  const openMessages = ((messages.data ?? []) as { id: string; source: string; title: string | null; summary_en: string | null; original_text: string | null; tier: string | null }[])
    .slice()
    .sort((a, b) => {
      const mine = Number(ticked.has(a.id)) - Number(ticked.has(b.id));
      if (mine !== 0) return mine;
      return (tierRank[a.tier ?? "fyi"] ?? 3) - (tierRank[b.tier ?? "fyi"] ?? 3);
    });
  const needsYou = openMessages.slice(0, 3).map((message) => {
    const seen = tickedBy.get(message.id) ?? new Set<string>();
    const other = parentRows.find((parent) => parent.id !== myId && !seen.has(parent.id));
    return {
      id: message.id,
      tier: message.tier || "fyi",
      source: message.source,
      title: message.title || "School message",
      summary: message.summary_en || "",
      original: message.original_text || "",
      waitingFor: message.tier === "urgent" && other ? `Waiting for ${other.display_name}` : "",
      ticks: parentRows.map((parent) => ({ name: parent.display_name, seen: seen.has(parent.id) })),
      seenByMe: ticked.has(message.id),
    };
  });

  const latestScan = scans.data?.[0];
  const task = (tasks.data ?? []).find((item) => item.scan_id === latestScan?.id);
  const coaching = (task?.coaching ?? {}) as { flagged?: boolean; questions?: { question_fr?: string; question_en?: string; expected_answer?: string }[] };
  const scanQuestions = (coaching.questions ?? [])
    .filter((question) => question.question_fr || question.question_en)
    .slice(0, 3)
    .map((question) => ({ fr: question.question_fr || "", en: question.question_en || "", answer: question.expected_answer || "" }));
  const run = (runs.data ?? []).find((item) => item.task_id === task?.id);
  const stepTotal = (games.data ?? []).filter((item) => item.task_id === task?.id).length;
  const step = run && stepTotal > 0 ? { current: Math.min(stepTotal, Number(run.step_index) + 1), total: stepTotal } : null;
  const runStatus = run?.status === "done" ? "done" : run?.status === "stuck" || run?.status === "needs_you" ? String(run.status) : ((task?.status as string | undefined) ?? null);
  const holidayRows = (holidays.data ?? []) as Holiday[];
  const zone = ((familyRow.data?.settings as { school_zone?: string } | null)?.school_zone === "B" || (familyRow.data?.settings as { school_zone?: string } | null)?.school_zone === "C")
    ? (familyRow.data?.settings as { school_zone: "B" | "C" }).school_zone
    : "A";
  const onBreak = holidayOn(today, holidayRows, zone);
  const notice = noticeHoliday(today, holidayRows, zone);
  const played = (sessions.data ?? []).map((session) => (String(session.game) === "Logic Lagoon" ? "lagoon" : String(session.game)));
  const counts = weekCounts(played);
  const weekRuns = (runs.data ?? []).filter((item) => String(item.updated_at) >= weekIso);
  const rewardById = new Map((rewards.data ?? []).map((reward) => [reward.id as string, reward]));
  const setup: { label: string; href: string }[] = [];
  if ((chats.data ?? []).length === 0) setup.push({ label: "Telegram is not linked", href: "/parent/setup" });
  const senders = (familyRow.data?.settings as { allowed_senders?: string[] } | null)?.allowed_senders;
  if (!senders || senders.length === 0) setup.push({ label: "Email forwarding is not set up", href: "/parent/setup" });
  const day = Number(today.slice(8, 10));
  if (day >= 25 && (roster.data ?? []).length === 0) setup.push({ label: "Roster missing for next month", href: "/parent/setup" });

  const comingUp = [
    ...((events.data ?? []).map((event) => ({
      id: event.id as string,
      label: event.title as string,
      when: String(event.starts_at).slice(0, 10),
      kind: (event.source_message_id ? "school" : "family") as "school" | "family",
    }))),
    ...(notice ? [{ id: "holiday", label: notice.label, when: notice.starts_on, kind: "holiday" as const }] : []),
    ...((roster.data ?? []).filter((dayRow) => dayRow.status === "flying" || dayRow.status === "layover").slice(0, 2).map((dayRow) => ({ id: `fly-${dayRow.date}`, label: "Flying day", when: String(dayRow.date), kind: "flying" as const }))),
    ...((reminders.data ?? []).map((reminder) => ({ id: reminder.id as string, label: "Reminder", when: String(reminder.due_at).slice(0, 10), kind: "reminder" as const }))),
  ].slice(0, 5);

  let breakPlanned = false;
  if (notice) {
    const { data: planned } = await supabase.from("events").select("id").like("title", "Break:%").gte("starts_at", `${notice.starts_on}T00:00:00Z`).limit(1);
    breakPlanned = (planned ?? []).length > 0;
  }

  const unheard = (voices.data ?? []).filter((row) => !row.parent_reaction).slice(0, 3);
  const recordings = await Promise.all(
    unheard.map(async (row) => {
      const signed = row.path ? await supabase.storage.from("voice").createSignedUrl(String(row.path), 60 * 10) : { data: null };
      return { id: row.id as string, createdAt: String(row.created_at), url: signed.data?.signedUrl ?? "" };
    }),
  );

  const levels = (skills.data ?? []) as { level: number }[];
  const week: WeekGlance = {
    homework: weekRuns.filter((item) => item.status === "done").length,
    games: counts.games,
    logic: counts.logic,
    voice: (voices.data ?? []).filter((row) => String(row.created_at) >= weekIso).length,
    stories: (reads.data ?? []).length,
    studyMinutes: (evenings.data ?? []).reduce((sum, row) => sum + Number(row.duration_min ?? 0), 0),
    stars: (ledger.data ?? []).reduce((sum, row) => sum + Math.max(0, Number(row.amount ?? 0)), 0),
    hints: weekRuns.reduce((sum, item) => sum + Math.max(0, Number(item.hint_level ?? 0)), 0),
    strong: levels.filter((row) => skillStatus(Number(row.level)) === "strong").length,
    practicing: levels.filter((row) => skillStatus(Number(row.level)) === "practicing").length,
  };
  const otherLeader = parentRows.find((parent) => parent.id !== plan?.leaderId)?.id ?? null;

  return {
    childName: family.child_name || "Yana",
    stars: family.star_balance,
    tonightLine: plan ? tonightLine(plan) : onBreak ? "Break: 10 min of games and reading" : "Tonight is not planned yet",
    tonightQuestions: scanQuestions.length > 0 ? scanQuestions : (plan?.questions ?? []).map((question) => ({ fr: "", en: question, answer: "" })),
    tonightDone: (evenings.data ?? []).some((row) => String(row.date) === today && row.status === "done"),
    swapLeaderId: plan?.leaderId ? otherLeader : null,
    unseenCount: openMessages.filter((message) => !ticked.has(message.id)).length,
    needsYou,
    homework: homeworkLabel(latestScan?.status ?? null, runStatus, Boolean(coaching.flagged), step, Boolean(onBreak)),
    briefReady: Boolean(latestScan && (task?.translated_objective || scanQuestions.length > 0)),
    comingUp,
    breakBanner: notice ? breakBannerText(notice) : null,
    breakPlanned,
    week: weekHasActivity(week) ? { ...week, together: togetherSuggestion(week) } : { ...week, together: "" },
    rewards: (purchases.data ?? []).map((purchase) => {
      const reward = rewardById.get(purchase.reward_id as string);
      return { id: purchase.id as string, title: (reward?.title as string) || "A prize", cost: Number(reward?.cost_stars ?? 0) };
    }),
    recordings,
    setup,
  };
}

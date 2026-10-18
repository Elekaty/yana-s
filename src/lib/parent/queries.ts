import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dayKey, holidayOn, type Holiday } from "@/lib/calendar/plan";
import { homeworkLabel, tonightLine } from "@/lib/parent/labels";
import { loadTonight } from "@/lib/plan/load";
import type { FamilySummary } from "@/lib/types";

export type TodayCard = {
  id: string;
  tier: string;
  source: string;
  title: string;
  summary: string;
  original: string;
  waitingFor: string;
};

export type TodayData = {
  childName: string;
  stars: number;
  tonightLine: string;
  unseenCount: number;
  needsYou: TodayCard[];
  homework: string;
  comingUp: { id: string; label: string; when: string }[];
  breakBanner: string | null;
  week: { homework: number; games: number; logic: number; voice: number; stories: number };
  rewards: { id: string; title: string; cost: number }[];
  recordings: { id: string; createdAt: string }[];
  setup: { label: string; href: string }[];
};

const tierRank: Record<string, number> = { urgent: 0, important: 1, fyi: 2 };

export async function loadToday(supabase: SupabaseClient, family: FamilySummary, userId: string): Promise<TodayData> {
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekIso = weekStart.toISOString();
  const ahead = new Date();
  ahead.setDate(ahead.getDate() + 7);

  const [plan, me, parents, messages, acks, scans, tasks, events, holidays, roster, sessions, reads, voices, purchases, rewards, chats, familyRow] = await Promise.all([
    loadTonight(supabase, family).catch(() => null),
    supabase.from("members").select("id, display_name").eq("user_id", userId).maybeSingle(),
    supabase.from("members").select("id, display_name").eq("role", "parent"),
    supabase.from("messages").select("id, source, title, summary_en, original_text, tier, status, created_at").eq("status", "new").order("created_at", { ascending: false }).limit(30),
    supabase.from("message_acks").select("message_id, member_id"),
    supabase.from("homework_scans").select("id, status, created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("tasks").select("id, scan_id, status, coaching").limit(8),
    supabase.from("events").select("id, title, starts_at").gte("starts_at", new Date().toISOString()).lte("starts_at", ahead.toISOString()).order("starts_at").limit(5),
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("roster_days").select("date, status").gte("date", today).limit(14),
    supabase.from("game_sessions").select("game, created_at").gte("created_at", weekIso),
    supabase.from("story_reads").select("story_id").gte("completed_at", weekIso),
    supabase.from("voice_recordings").select("id, created_at, parent_reaction").order("created_at", { ascending: false }).limit(8),
    supabase.from("purchases").select("id, reward_id, status").eq("status", "requested"),
    supabase.from("rewards").select("id, title, cost_stars"),
    supabase.from("telegram_chats").select("chat_id").limit(1),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
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
  const mine = ((messages.data ?? []) as { id: string; source: string; title: string | null; summary_en: string | null; original_text: string | null; tier: string | null }[])
    .filter((message) => !ticked.has(message.id))
    .sort((a, b) => (tierRank[a.tier ?? "fyi"] ?? 3) - (tierRank[b.tier ?? "fyi"] ?? 3));
  const needsYou = mine.slice(0, 3).map((message) => {
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
    };
  });

  const latestScan = scans.data?.[0];
  const task = (tasks.data ?? []).find((item) => item.scan_id === latestScan?.id);
  const coaching = (task?.coaching ?? {}) as { flagged?: boolean };
  const holidayRows = (holidays.data ?? []) as Holiday[];
  const zone = ((familyRow.data?.settings as { school_zone?: string } | null)?.school_zone === "B" || (familyRow.data?.settings as { school_zone?: string } | null)?.school_zone === "C")
    ? (familyRow.data?.settings as { school_zone: "B" | "C" }).school_zone
    : "A";
  const breakToday = holidayOn(today, holidayRows, zone);
  const games = (sessions.data ?? []).map((session) => String(session.game));
  const rewardById = new Map((rewards.data ?? []).map((reward) => [reward.id as string, reward]));
  const setup: { label: string; href: string }[] = [];
  if ((chats.data ?? []).length === 0) setup.push({ label: "Telegram is not linked", href: "/parent/setup" });
  const senders = (familyRow.data?.settings as { allowed_senders?: string[] } | null)?.allowed_senders;
  if (!senders || senders.length === 0) setup.push({ label: "Email forwarding is not set up", href: "/parent/setup" });
  const day = Number(today.slice(8, 10));
  if (day >= 25 && (roster.data ?? []).length === 0) setup.push({ label: "Roster missing for next month", href: "/parent/setup" });

  const comingUp = [
    ...((events.data ?? []).map((event) => ({ id: event.id as string, label: event.title as string, when: String(event.starts_at).slice(0, 10) }))),
    ...(breakToday ? [{ id: "holiday", label: breakToday.label, when: today }] : []),
    ...((roster.data ?? []).filter((dayRow) => dayRow.status === "flying" || dayRow.status === "layover").slice(0, 2).map((dayRow) => ({ id: `fly-${dayRow.date}`, label: "Flying day", when: String(dayRow.date) }))),
  ].slice(0, 5);

  return {
    childName: family.child_name || "Yana",
    stars: family.star_balance,
    tonightLine: plan ? tonightLine(plan) : "Tonight is not planned yet",
    unseenCount: mine.length,
    needsYou,
    homework: homeworkLabel(latestScan?.status ?? null, (task?.status as string | undefined) ?? null, Boolean(coaching.flagged)),
    comingUp,
    breakBanner: breakToday ? `${breakToday.label}. Here is what to expect next.` : null,
    week: {
      homework: (tasks.data ?? []).filter((item) => item.status === "completed" || item.status === "done").length,
      games: games.filter((game) => game !== "Logic Lagoon").length,
      logic: games.filter((game) => game === "Logic Lagoon" || game === "lagoon").length,
      voice: (voices.data ?? []).filter((row) => String(row.created_at) >= weekIso).length,
      stories: (reads.data ?? []).length,
    },
    rewards: (purchases.data ?? []).map((purchase) => {
      const reward = rewardById.get(purchase.reward_id as string);
      return { id: purchase.id as string, title: (reward?.title as string) || "A prize", cost: Number(reward?.cost_stars ?? 0) };
    }),
    recordings: (voices.data ?? []).filter((row) => !row.parent_reaction).map((row) => ({ id: row.id as string, createdAt: String(row.created_at) })),
    setup,
  };
}

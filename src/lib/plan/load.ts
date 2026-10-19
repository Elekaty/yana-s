import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dayKey, holidayDates, holidayOn, schoolZone, type Holiday } from "@/lib/calendar/plan";
import { planTonight, type Duty, type PlannerParent, type TonightPlan } from "@/lib/plan/tonight";
import type { FamilySummary } from "@/lib/types";

type Settings = {
  mom_member_id?: string;
  dad_member_id?: string;
  daily_cap_minutes?: number;
  evening_from?: string;
  evening_to?: string;
  tonight_prefer?: string;
  tonight_prefer_date?: string;
  school_zone?: string;
};

export async function loadTonight(supabase: SupabaseClient, family: FamilySummary): Promise<TonightPlan> {
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const [{ data: members }, { data: roster }, { data: hours }, { data: row }, { data: holidays }] = await Promise.all([
    supabase.from("members").select("id, display_name, role").eq("role", "parent"),
    supabase.from("roster_days").select("member_id, status").eq("date", today),
    supabase.from("availability").select("member_id, weekday, from_time, to_time"),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
  ]);
  const settings = (row?.settings as Settings | null) ?? {};
  const parents = (members ?? []) as { id: string; display_name: string }[];
  const momId = settings.mom_member_id && parents.some((parent) => parent.id === settings.mom_member_id) ? settings.mom_member_id : parents[0]?.id;
  const dadId = settings.dad_member_id && parents.some((parent) => parent.id === settings.dad_member_id) ? settings.dad_member_id : parents.find((parent) => parent.id !== momId)?.id;
  const weekday = weekdayNumber(today, timeZone);
  const duty = new Map((roster ?? []).map((item) => [item.member_id as string, item.status as Duty]));
  const plannerParents: PlannerParent[] = parents.slice(0, 2).map((parent) => {
    const window = (hours ?? []).find((item) => item.member_id === parent.id && Number(item.weekday) === weekday);
    return {
      id: parent.id,
      name: parent.display_name,
      role: parent.id === dadId && parent.id !== momId ? "dad" : "mom",
      duty: duty.get(parent.id) ?? "off",
      freeFrom: window ? String(window.from_time).slice(0, 5) : null,
      freeTo: window ? String(window.to_time).slice(0, 5) : null,
    };
  });
  if (dadId) {
    const dad = plannerParents.find((parent) => parent.id === dadId);
    if (dad) dad.role = "dad";
  }
  if (momId) {
    const mom = plannerParents.find((parent) => parent.id === momId);
    if (mom) mom.role = "mom";
  }
  return planTonight({
    date: today,
    capMinutes: Number(settings.daily_cap_minutes ?? 15),
    windowFrom: settings.evening_from || "18:00",
    windowTo: settings.evening_to || "20:00",
    parents: plannerParents,
    preferId: settings.tonight_prefer_date === today ? settings.tonight_prefer : null,
    onBreak: Boolean(holidayOn(today, (holidays ?? []) as Holiday[], schoolZone(settings))),
  });
}

export async function familyOnBreak(supabase: SupabaseClient, family: { family_id: string; timezone?: string | null }) {
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const [{ data: holidays }, { data: row }] = await Promise.all([
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
  ]);
  return Boolean(holidayOn(today, (holidays ?? []) as Holiday[], schoolZone((row?.settings as Settings | null) ?? null)));
}

export async function breakWeekDays(supabase: SupabaseClient, familyId: string, days: string[]) {
  const [{ data: holidays }, { data: row }] = await Promise.all([
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("settings").eq("id", familyId).maybeSingle(),
  ]);
  return holidayDates(days, (holidays ?? []) as Holiday[], schoolZone((row?.settings as Settings | null) ?? null));
}

function weekdayNumber(day: string, timeZone: string) {
  const noon = new Date(`${day}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noon);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

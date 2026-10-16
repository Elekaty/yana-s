import { HomeScreen } from "@/components/kid/home-screen";
import { dayKey, holidayOn, type Holiday } from "@/lib/calendar/plan";
import { getFamily } from "@/lib/family";
import { fillPhrase, phrases } from "@/lib/phrases";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function KidHomePage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  const today = family ? await todayTitle(supabase, family.family_id, lang) : "";
  const nudge = family ? await kidNudge(supabase, family.family_id, family.child_name ?? "", lang, family.timezone || "Europe/Paris") : "";
  return (
    <HomeScreen
      childName={family?.child_name ?? ""}
      lang={lang}
      stars={family?.star_balance ?? 0}
      today={today}
      copy={copy}
      nudge={nudge}
    />
  );
}

async function kidNudge(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  familyId: string,
  name: string,
  lang: "fr" | "en",
  timeZone: string,
) {
  const today = dayKey(new Date(), timeZone);
  const [{ data: holidays }, { data: familyRow }] = await Promise.all([
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("settings").eq("id", familyId).maybeSingle(),
  ]);
  const zone = (familyRow?.settings as { school_zone?: string } | null)?.school_zone;
  const schoolZone = zone === "B" || zone === "C" ? zone : "A";
  if (holidayOn(today, (holidays ?? []) as Holiday[], schoolZone)) return phrases.breakTime[lang];
  const { data: reminders } = await supabase
    .from("reminders")
    .select("id")
    .eq("family_id", familyId)
    .eq("target", "child")
    .neq("status", "done")
    .lte("due_at", new Date().toISOString())
    .limit(1);
  if ((reminders ?? []).length === 0) return "";
  return fillPhrase(phrases.reminder[lang], name);
}

async function todayTitle(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  familyId: string,
  lang: "fr" | "en",
) {
  const { data: scans } = await supabase
    .from("homework_scans")
    .select("id, status")
    .eq("family_id", familyId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(5);
  const scanIds = (scans ?? []).map((scan) => scan.id);
  if (scanIds.length === 0) return "";
  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, subject, status, scan_id")
    .in("scan_id", scanIds);
  const open = (tasks ?? []).find((task) => task.status !== "completed") ?? tasks?.[0];
  if (!open) return "";
  return (lang === "en" ? open.subject : open.title) || open.subject || open.title || "";
}

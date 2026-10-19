import { HomeScreen } from "@/components/kid/home-screen";
import { dayKey, holidayOn, type Holiday } from "@/lib/calendar/plan";
import { getFamily } from "@/lib/family";
import { helperMark } from "@/lib/kid/home-row";
import { t } from "@/lib/i18n";
import { crewWithStarter } from "@/lib/mochi/crew";
import { ensureStarterFriend } from "@/lib/mochi/starter";
import { loadTonight } from "@/lib/plan/load";
import { readPrizeState } from "@/lib/prizes";

export const dynamic = "force-dynamic";

export default async function KidHomePage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  const onBreak = family ? await breakToday(supabase, family.family_id, family.timezone || "Europe/Paris") : false;
  const plan = family ? await loadTonight(supabase, family) : null;
  const helper = helperMark({ onBreak, role: plan?.role ?? "solo", start: plan?.start ?? "" });
  const { data: child } = family?.child_id
    ? await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle()
    : { data: null };
  const voice = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  const day = dayKey(new Date(), family?.timezone || "Europe/Paris");
  const checkedIn = readPrizeState(child?.settings).checkins.includes(day);
  if (family?.child_id) await ensureStarterFriend(supabase, family.family_id, family.child_id);
  const { data: met } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  return (
    <HomeScreen
      childName={family?.child_name ?? ""}
      lang={lang}
      stars={family?.star_balance ?? 0}
      copy={copy}
      voice={voice}
      checkedIn={checkedIn}
      helper={helper}
      crew={crewWithStarter((met ?? []).map((row) => String(row.friend)))}
    />
  );
}

async function breakToday(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  familyId: string,
  timeZone: string,
) {
  const today = dayKey(new Date(), timeZone);
  const [{ data: holidays }, { data: familyRow }] = await Promise.all([
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("settings").eq("id", familyId).maybeSingle(),
  ]);
  const zone = (familyRow?.settings as { school_zone?: string } | null)?.school_zone;
  const schoolZone = zone === "B" || zone === "C" ? zone : "A";
  return Boolean(holidayOn(today, (holidays ?? []) as Holiday[], schoolZone));
}

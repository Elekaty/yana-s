import { saveStudy } from "@/app/parent/(gate)/setup/practice-actions";
import { Button } from "@/components/ui/button";
import { demoDayLabel, demoEnabled } from "@/lib/parent/guest";
import { requireParent } from "@/lib/parent/guard";
import { studySettings } from "@/lib/study/clock";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const { supabase, family } = await requireParent();
  const { data: familyRow } = await supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle();
  const settings = (familyRow?.settings as {
    on_time_stars?: number;
    chest_minutes?: number;
    chest_daily_cap?: number;
    daily_cap_minutes?: number;
    town_star_cap?: number;
    building_shop?: boolean;
    demo_next_day?: boolean;
  } | null) ?? {};
  const study = studySettings(familyRow?.settings);
  const demo = demoEnabled(settings);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Study and prizes</h1>
      <p className="text-sm">Only a parent can skip a break, with the PIN.</p>
      <form action={saveStudy} className="grid gap-3 rounded-2xl border border-grape/15 bg-card p-4 text-sm">
        <label>
          Study block, 10 to 30 minutes
          <input name="study" type="number" min={10} max={30} defaultValue={Math.min(30, Math.max(10, study.studyMinutes))} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Break length
          <select name="break" defaultValue={study.breakMinutes === 10 || study.breakMinutes === 20 ? String(study.breakMinutes) : "15"} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3">
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </label>
        <label>
          Warning, minutes before the break
          <input name="headsUp" type="number" min={1} max={10} defaultValue={study.headsUpMinutes} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Maximum postponements
          <input name="postponements" type="number" min={0} max={4} defaultValue={study.maxPostponements} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          On-time stars each day
          <input name="onTime" type="number" min={1} max={5} defaultValue={settings.on_time_stars ?? 2} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Minutes of active study per chest
          <input name="chestMinutes" type="number" min={5} max={60} defaultValue={settings.chest_minutes ?? 10} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Chests per day
          <input name="chestCap" type="number" min={0} max={5} defaultValue={settings.chest_daily_cap ?? 3} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Daily play cap, minutes
          <input name="cap" type="number" min={5} max={60} defaultValue={settings.daily_cap_minutes ?? 15} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label>
          Town spending cap
          <input name="townCap" type="number" min={0} max={500} defaultValue={settings.town_star_cap ?? ""} placeholder="No cap" className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="flex h-12 items-center gap-2">
          <input type="checkbox" name="buildingShop" value="on" defaultChecked={settings.building_shop === true} />
          Enable the building shop
        </label>
        {process.env.NODE_ENV === "development" ? (
          <label className="flex h-12 items-center gap-2">
            <input type="checkbox" name="demoNext" value="on" defaultChecked={demo} />
            Demo: next day
          </label>
        ) : null}
        {demo ? <p className="text-sm">Demo day is {demoDayLabel(new Date(), family.timezone || "Europe/Paris", true)}.</p> : null}
        <p className="text-sm text-muted-foreground">A perfect week adds 10 stars, as two fives. Idle time does not open a chest.</p>
        <Button type="submit" size="lg">Save</Button>
      </form>
    </div>
  );
}
